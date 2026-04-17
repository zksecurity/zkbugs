#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(dirname "$(realpath "$0")")
ROOT_DIR=$(dirname "$SCRIPT_DIR")

supported_dsls=("circom")

contains_element() {
    local match="$1"
    shift
    for e; do [[ "$e" == "$match" ]] && return 0; done
    return 1
}

if [ "$#" -lt 3 ]; then
    echo "Usage: $0 <dsl> <org/project> <bug_name> [--url <project_url>] [--commit <commit_hash>]"
    echo ""
    echo "  dsl          DSL name (e.g., circom)"
    echo "  org/project  GitHub org/repo (e.g., iden3/circomlib)"
    echo "  bug_name     Bug identifier (e.g., auditor_description)"
    echo "  --url        Project GitHub URL"
    echo "  --commit     Vulnerable commit hash"
    exit 1
fi

dsl=$1
project=$2
bug_name=$3
shift 3

PROJECT_URL=""
COMMIT=""

while [ $# -gt 0 ]; do
    case "$1" in
        --url) PROJECT_URL="$2"; shift 2 ;;
        --commit) COMMIT="$2"; shift 2 ;;
        *) echo "Unknown option: $1"; exit 1 ;;
    esac
done

if ! contains_element "$dsl" "${supported_dsls[@]}"; then
    echo "Error: Unsupported DSL. Supported DSLs are: ${supported_dsls[*]}"
    exit 1
fi

if [[ ! $project =~ ^[^/]+/[^/]+$ ]]; then
    echo "Error: Project should be in the format <org>/<repo>"
    exit 1
fi

if [[ ! $bug_name =~ ^[^_]+_.+$ ]]; then
    echo "Error: Bug name should be in the format <bug-hunter>_<description>"
    exit 1
fi

ORG=$(echo "$project" | cut -d/ -f1)
REPO=$(echo "$project" | cut -d/ -f2)
BUG_DIR="$ROOT_DIR/dataset/$dsl/$ORG/$REPO/$bug_name"

if [ -d "$BUG_DIR" ]; then
    echo "Error: $BUG_DIR already exists."
    exit 1
fi

if [ -z "$PROJECT_URL" ]; then
    PROJECT_URL="https://github.com/$project"
fi

CODEBASE_REL="dataset/codebases/$dsl/$ORG/$REPO/${COMMIT:-TODO_COMMIT}"

mkdir -p "$BUG_DIR"
echo "Created bug directory: $BUG_DIR"

# circuit.circom (direct wrapper template)
cat > "$BUG_DIR/circuit.circom" << 'EOF'
pragma circom 2.0.0;

// Include the vulnerable template from the codebase
// (resolved via -l flag pointing to the codebase directory)
// include "path/to/vulnerable_template.circom";

// Instantiate the vulnerable template with minimal parameters
// component main = VulnerableTemplate();
EOF

# direct_input.json
echo '{}' > "$BUG_DIR/direct_input.json"

# zkbugs_vars.sh
cat > "$BUG_DIR/zkbugs_vars.sh" << 'VARS_HEAD'
#!/bin/bash
SCRIPT_PATH=$(realpath "$0")
BUG_DIR=$(dirname "$SCRIPT_PATH")
ROOT_PATH=$(dirname "$(dirname "$(dirname "$(dirname "$(dirname "$(dirname "$SCRIPT_PATH")")")")")")
VARS_HEAD

cat >> "$BUG_DIR/zkbugs_vars.sh" << EOF
CODEBASE_PATH="\$ROOT_PATH/$CODEBASE_REL"
CIRCOMLIB_PATH="\$ROOT_PATH/dataset/circom/dependencies/circomlib"
VKEY=verification_key.json

ZKBUGS_MODE=\${ZKBUGS_MODE:-original}
CIRCOM_CIRCUIT_ORIGINAL="\$CODEBASE_PATH/TODO_ENTRYPOINT"
CIRCOM_CIRCUIT_DIRECT="\$BUG_DIR/circuit.circom"

if [ "\$ZKBUGS_MODE" = "direct" ]; then
    CIRCOM_CIRCUIT="\$CIRCOM_CIRCUIT_DIRECT"
    PTAU_TARGET=bn128_pot12_0001.ptau
    INPUTJSON=direct_input.json
else
    CIRCOM_CIRCUIT="\$CIRCOM_CIRCUIT_ORIGINAL"
    PTAU_TARGET=TODO_PTAU
    INPUTJSON=input.json
fi

PTAU_FILE="\$ROOT_PATH/misc/circom/\$PTAU_TARGET"
PTAU_FINAL="final.ptau"

CIRCOM_LINK_FLAGS=(-l "\$CODEBASE_PATH" -l "\$CIRCOMLIB_PATH")

TARGET=\$(basename "\$CIRCOM_CIRCUIT" .circom)
R1CS="\$TARGET.r1cs"
ZKEY_INIT=\${TARGET}_0000.zkey
ZKEY_FINAL=\${TARGET}_0001.zkey
CIRCUITJS=\${TARGET}_js
CIRCUITWASM=\${CIRCUITJS}/\${TARGET}.wasm
WTNS=\$CIRCUITJS/witness.wtns
EOF
chmod +x "$BUG_DIR/zkbugs_vars.sh"

# zkbugs_compile.sh
cat > "$BUG_DIR/zkbugs_compile.sh" << 'EOF'
#!/bin/bash
set -euo pipefail
source zkbugs_vars.sh

if ! command -v circom &> /dev/null; then
    echo "circom is not installed."
    echo "Please install it using the script: $ROOT_PATH/scripts/install_circom.sh"
    exit 1
fi

echo "Compiling the target circuit: $CIRCOM_CIRCUIT"
circom "$CIRCOM_CIRCUIT" --O0 --r1cs --wasm --sym "${CIRCOM_LINK_FLAGS[@]}"

echo "Compilation successful."
echo "  R1CS:  $R1CS"
echo "  WASM:  $CIRCUITWASM"
echo "  SYM:   $TARGET.sym"
EOF
chmod +x "$BUG_DIR/zkbugs_compile.sh"

# zkbugs_compile_setup.sh
cat > "$BUG_DIR/zkbugs_compile_setup.sh" << 'EOF'
#!/bin/bash
set -euo pipefail
source zkbugs_vars.sh

MISSING_TOOLS=()
if ! command -v circom &> /dev/null; then MISSING_TOOLS+=("circom"); fi
if ! command -v snarkjs &> /dev/null; then MISSING_TOOLS+=("snarkjs"); fi
if [ ! -f "$PTAU_FILE" ]; then MISSING_TOOLS+=("PTAU file"); fi

if [ ${#MISSING_TOOLS[@]} -ne 0 ]; then
    echo "The following are missing: ${MISSING_TOOLS[*]}"
    echo "Please ensure they are installed and available."
    exit 1
else
    echo "circom, snarkjs, and the PTAU file are already installed."
fi

echo "Compiling the target circuit: $CIRCOM_CIRCUIT"
circom "$CIRCOM_CIRCUIT" --O0 --r1cs --wasm --sym "${CIRCOM_LINK_FLAGS[@]}"

echo "Phase 2 of the ceremony producing zkey and verification key: ${ZKEY_FINAL}"
snarkjs powersoftau prepare phase2 ${PTAU_FILE} ${PTAU_FINAL} -v
snarkjs groth16 setup $R1CS ${PTAU_FINAL} ${ZKEY_INIT}
echo "zkbugs" | snarkjs zkey contribute ${ZKEY_INIT} ${ZKEY_FINAL} --name="1st Contributor Name" -v
snarkjs zkey export verificationkey ${ZKEY_FINAL} $VKEY
EOF
chmod +x "$BUG_DIR/zkbugs_compile_setup.sh"

# zkbugs_positive_test.sh
cat > "$BUG_DIR/zkbugs_positive_test.sh" << 'EOF'
#!/bin/bash
set -euo pipefail
source zkbugs_vars.sh

echo "Computing witness"
node $CIRCUITJS/generate_witness.js $CIRCUITWASM $INPUTJSON $WTNS

echo "Producing proof"
snarkjs groth16 prove $ZKEY_FINAL $WTNS proof.json public.json

echo "Verifying proof"
snarkjs groth16 verify $VKEY public.json proof.json
EOF
chmod +x "$BUG_DIR/zkbugs_positive_test.sh"

# zkbugs_setup.sh
cat > "$BUG_DIR/zkbugs_setup.sh" << 'EOF'
#!/bin/bash
set -euo pipefail
source zkbugs_vars.sh

echo "Root path: $ROOT_PATH"

MISSING_TOOLS=()
if ! command -v circom &> /dev/null; then MISSING_TOOLS+=("circom"); fi
if ! command -v snarkjs &> /dev/null; then MISSING_TOOLS+=("snarkjs"); fi

if [ ${#MISSING_TOOLS[@]} -ne 0 ]; then
    echo "The following tools are missing: ${MISSING_TOOLS[*]}"
    echo "Please install them using the script: $ROOT_PATH/scripts/install_circom.sh"
    exit 1
else
    echo "circom and snarkjs are already installed."
fi

if [ -f "$PTAU_FILE" ]; then
    echo "The PTAU file exists at: $PTAU_FILE"
else
    echo "The PTAU file does not exist: $PTAU_FILE"
    exit 1
fi

# Symlink circomlib into the codebase's parent node_modules
CODEBASE_PARENT=$(dirname "$CODEBASE_PATH")
CIRCOMLIB_NODE_MODULES="$CODEBASE_PARENT/node_modules/circomlib/circuits"
if [ ! -L "$CIRCOMLIB_NODE_MODULES" ]; then
    mkdir -p "$(dirname "$CIRCOMLIB_NODE_MODULES")"
    ln -s "$CIRCOMLIB_PATH/circuits" "$CIRCOMLIB_NODE_MODULES"
    echo "Symlinked circomlib into $CODEBASE_PARENT/node_modules/"
else
    echo "circomlib symlink already exists."
fi

echo "Setup is completed."
EOF
chmod +x "$BUG_DIR/zkbugs_setup.sh"

# zkbugs_clean.sh
cat > "$BUG_DIR/zkbugs_clean.sh" << 'EOF'
#!/bin/bash
set -euo pipefail

# Clean all possible build artifacts
rm -rf *.sym *_0001.zkey *.r1cs *_0000.zkey *_js \
    final.ptau proof.json verification_key.json public.json
EOF
chmod +x "$BUG_DIR/zkbugs_clean.sh"

# zkbugs_config.json
python3 -c "
import json, os
config = {
    'TODO_BUG_TITLE': {
        'Id': '$project/$bug_name',
        'Path': 'dataset/$dsl/$ORG/$REPO/$bug_name',
        'Project': '$PROJECT_URL',
        'Commit': '$COMMIT',
        'Fix Commit': '',
        'DSL': '${dsl^}',
        'Vulnerability': '',
        'Impact': '',
        'Root Cause': '',
        'Reproduced': False,
        'Codebase': '$CODEBASE_REL',
        'Original Entrypoint': ['TODO_ENTRYPOINT'],
        'Direct Entrypoint': 'circuit.circom',
        'Location': {
            'Path': '',
            'Function': '',
            'Line': ''
        },
        'Source': {
            'Audit Report': {
                'Source Link': '',
                'Bug ID': ''
            }
        },
        'Input': {
            'Original': 'input.json',
            'Direct': 'direct_input.json'
        },
        'Commands': {
            'Setup Environment': './zkbugs_setup.sh',
            'Compile': './zkbugs_compile.sh',
            'Compile and Preprocess': './zkbugs_compile_setup.sh',
            'Positive Test': './zkbugs_positive_test.sh',
            'Clean': './zkbugs_clean.sh'
        },
        'Short Description of the Vulnerability': '',
        'Proposed Mitigation': ''
    }
}
with open('$BUG_DIR/zkbugs_config.json', 'w') as f:
    json.dump(config, f, indent=4)
    f.write('\n')
"

echo ""
echo "Setup complete. Next steps:"
echo "1. Update the bug title key in zkbugs_config.json"
echo "2. Fill in zkbugs_config.json fields (vulnerability, location, source, etc.)"
echo "3. Update circuit.circom with the vulnerable template include and instantiation"
echo "4. Fill in direct_input.json with valid witness inputs"
echo "5. Set CIRCOM_CIRCUIT_ORIGINAL in zkbugs_vars.sh (replace TODO_ENTRYPOINT)"
echo "6. Set original ptau in zkbugs_vars.sh (replace TODO_PTAU)"
echo "7. Verify: ZKBUGS_MODE=direct ./zkbugs_compile.sh"
echo "8. Verify: ./zkbugs_compile.sh (original mode)"
echo "9. Generate README: python3 scripts/generate_readmes.py ${dsl^}"

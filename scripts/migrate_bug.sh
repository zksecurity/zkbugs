#!/bin/bash
set -euo pipefail

# Migration script for converting circom bugs to the new format.
# Usage: scripts/migrate_bug.sh <bug_dir> [--clone] [--dry-run]
#
# Automates: cloning codebase, transforming circuit.circom, renaming
# input.json, generating shell scripts, updating config, deleting old files.
#
# Leaves TODOs for: identifying entrypoints, fixing compilation errors,
# setting ptau sizes, verifying compilation.

SCRIPT_DIR=$(dirname "$(realpath "$0")")
ROOT_DIR=$(dirname "$SCRIPT_DIR")

usage() {
    echo "Usage: $0 <bug_dir> [--clone] [--dry-run]"
    echo "  bug_dir   Path to bug directory (e.g., dataset/circom/iden3/circomlib/veridise_decoder_...)"
    echo "  --clone   Clone the codebase if not already present"
    echo "  --dry-run Show what would change without making changes"
    exit 1
}

if [ $# -lt 1 ]; then usage; fi

BUG_DIR="$ROOT_DIR/$1"
DO_CLONE=false
DRY_RUN=false

shift
while [ $# -gt 0 ]; do
    case "$1" in
        --clone) DO_CLONE=true ;;
        --dry-run) DRY_RUN=true ;;
        *) echo "Unknown option: $1"; usage ;;
    esac
    shift
done

if [ ! -d "$BUG_DIR" ]; then
    echo "ERROR: Bug directory does not exist: $BUG_DIR"
    exit 1
fi

CONFIG="$BUG_DIR/zkbugs_config.json"
if [ ! -f "$CONFIG" ]; then
    echo "ERROR: No zkbugs_config.json found in $BUG_DIR"
    exit 1
fi

# Extract fields from config using python (available everywhere, no jq dependency)
extract_config() {
    python3 -c "
import json, sys
with open('$CONFIG') as f:
    data = json.load(f)
key = list(data.keys())[0]
bug = data[key]
field = sys.argv[1]
parts = field.split('.')
val = bug
for p in parts:
    val = val.get(p, '')
    if val == '': break
print(val if isinstance(val, str) else json.dumps(val))
" "$1"
}

PROJECT_URL=$(extract_config "Project")
COMMIT=$(extract_config "Commit")
DSL=$(extract_config "DSL")
LOCATION_PATH=$(extract_config "Location.Path")
LOCATION_FUNC=$(extract_config "Location.Function")
LOCATION_LINE=$(extract_config "Location.Line")

# Extract org/project from URL
ORG=$(echo "$PROJECT_URL" | sed 's|.*/\([^/]*\)/[^/]*$|\1|')
PROJECT=$(echo "$PROJECT_URL" | sed 's|.*/||')

# Normalize commit: strip 0x prefix
COMMIT_CLEAN=$(echo "$COMMIT" | sed 's/^0x//')

if [ -z "$COMMIT_CLEAN" ]; then
    echo "WARNING: Empty commit hash for $BUG_DIR — skipping clone, manual resolution needed"
    echo "TODO: Find the correct commit for this bug from the audit report"
    exit 0
fi

CODEBASE_REL="dataset/codebases/circom/$ORG/$PROJECT/$COMMIT_CLEAN"
CODEBASE_PATH="$ROOT_DIR/$CODEBASE_REL"

echo "=== Migrating bug ==="
echo "  Bug dir:    $BUG_DIR"
echo "  Project:    $ORG/$PROJECT"
echo "  Commit:     $COMMIT_CLEAN"
echo "  Codebase:   $CODEBASE_REL"
echo ""

if $DRY_RUN; then
    echo "[DRY RUN] Would perform the following:"
    echo "  - Clone $PROJECT_URL @ $COMMIT_CLEAN into $CODEBASE_REL"
    echo "  - Transform circuits/circuit.circom -> circuit.circom"
    echo "  - Rename input.json -> direct_input.json"
    echo "  - Generate shell scripts from templates"
    echo "  - Update zkbugs_config.json"
    echo "  - Delete old files (circuits/, detect.sage, exploitable_witness.json, zkbugs_exploit.sh, zkbugs_find_exploit.sh)"
    echo "  - Generate README.md"
    exit 0
fi

# Step 1: Clone codebase if requested and not already present
if $DO_CLONE && [ ! -d "$CODEBASE_PATH" ]; then
    echo "Cloning $PROJECT_URL @ $COMMIT_CLEAN..."
    mkdir -p "$(dirname "$CODEBASE_PATH")"
    git clone "$PROJECT_URL" "$CODEBASE_PATH" 2>&1 | tail -1
    cd "$CODEBASE_PATH"
    git checkout "$COMMIT_CLEAN" 2>&1 | tail -1
    # Resolve short hash to full hash
    FULL_HASH=$(git rev-parse HEAD)
    cd "$ROOT_DIR"
    # If hash was short, rename directory to full hash
    if [ "$FULL_HASH" != "$COMMIT_CLEAN" ] && [ ${#COMMIT_CLEAN} -lt 40 ]; then
        CODEBASE_PATH_FULL="$ROOT_DIR/dataset/codebases/circom/$ORG/$PROJECT/$FULL_HASH"
        if [ ! -d "$CODEBASE_PATH_FULL" ]; then
            mv "$CODEBASE_PATH" "$CODEBASE_PATH_FULL"
            CODEBASE_PATH="$CODEBASE_PATH_FULL"
            CODEBASE_REL="dataset/codebases/circom/$ORG/$PROJECT/$FULL_HASH"
            COMMIT_CLEAN="$FULL_HASH"
            echo "  Resolved short hash to: $FULL_HASH"
        fi
    fi
    # Remove .git
    trash "$CODEBASE_PATH/.git" 2>/dev/null || rm -rf "$CODEBASE_PATH/.git"
    echo "  Codebase cloned."
elif [ -d "$CODEBASE_PATH" ]; then
    echo "Codebase already exists at $CODEBASE_PATH"
else
    echo "Codebase not present. Run with --clone to clone it."
fi

# Step 2: Transform circuit.circom
if [ -f "$BUG_DIR/circuits/circuit.circom" ]; then
    echo "Transforming circuits/circuit.circom -> circuit.circom"
    # Read the existing circuit.circom and transform include paths
    # Change include "./foo.circom" to include "circuits/foo.circom" (for -l resolution)
    sed 's|include "\./|include "circuits/|g' "$BUG_DIR/circuits/circuit.circom" > "$BUG_DIR/circuit.circom"
    echo "  Created circuit.circom (review includes manually)"
elif [ -f "$BUG_DIR/circuit.circom" ]; then
    echo "circuit.circom already exists, skipping transformation"
else
    echo "WARNING: No circuits/circuit.circom found — create circuit.circom manually"
fi

# Step 3: Rename input.json -> direct_input.json
if [ -f "$BUG_DIR/input.json" ] && [ ! -f "$BUG_DIR/direct_input.json" ]; then
    echo "Renaming input.json -> direct_input.json"
    mv "$BUG_DIR/input.json" "$BUG_DIR/direct_input.json"
elif [ -f "$BUG_DIR/direct_input.json" ]; then
    echo "direct_input.json already exists, skipping rename"
else
    echo "WARNING: No input.json found — create direct_input.json manually"
fi

# Step 4: Generate shell scripts from templates

echo "Generating shell scripts..."

cat > "$BUG_DIR/zkbugs_vars.sh" << 'VARS_EOF'
#!/bin/bash
SCRIPT_PATH=$(realpath "$0")
BUG_DIR=$(dirname "$SCRIPT_PATH")
ROOT_PATH=$(dirname "$(dirname "$(dirname "$(dirname "$(dirname "$(dirname "$SCRIPT_PATH")")")")")")
VARS_EOF

cat >> "$BUG_DIR/zkbugs_vars.sh" << EOF
CODEBASE_PATH="\$ROOT_PATH/$CODEBASE_REL"
CIRCOMLIB_PATH="\$ROOT_PATH/dataset/circom/dependencies/circomlib"
VKEY=verification_key.json

# Entrypoints: "original" uses the project's main circuits, "direct" uses the isolated wrapper
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

# Derive TARGET from the entrypoint filename
TARGET=\$(basename "\$CIRCOM_CIRCUIT" .circom)
R1CS="\$TARGET.r1cs"
ZKEY_INIT=\${TARGET}_0000.zkey
ZKEY_FINAL=\${TARGET}_0001.zkey
CIRCUITJS=\${TARGET}_js
CIRCUITWASM=\${CIRCUITJS}/\${TARGET}.wasm
WTNS=\$CIRCUITJS/witness.wtns
EOF
chmod +x "$BUG_DIR/zkbugs_vars.sh"

cat > "$BUG_DIR/zkbugs_compile.sh" << 'EOF'
#!/bin/bash
set -euo pipefail
source zkbugs_vars.sh

if ! command -v circom &> /dev/null; then
    echo "circom is not installed."
    echo "Please install it using the script: $ROOT_PATH/scripts/install_circom.sh"
    exit 1
fi

# Check if setup has been run (circomlib symlink exists)
CODEBASE_PARENT=$(dirname "$CODEBASE_PATH")
if [ ! -L "$CODEBASE_PARENT/node_modules/circomlib/circuits" ]; then
    echo "Setup has not been run. Please run ./zkbugs_setup.sh first."
    exit 1
fi

echo "Compiling the target circuit: $CIRCOM_CIRCUIT"
circom $CIRCOM_CIRCUIT --O0 --r1cs --wasm --sym -l $CODEBASE_PATH -l $CIRCOMLIB_PATH

echo "Compilation successful."
echo "  R1CS:  $R1CS"
echo "  WASM:  $CIRCUITWASM"
echo "  SYM:   $TARGET.sym"
EOF
chmod +x "$BUG_DIR/zkbugs_compile.sh"

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

# Check if setup has been run (circomlib symlink exists)
CODEBASE_PARENT=$(dirname "$CODEBASE_PATH")
if [ ! -L "$CODEBASE_PARENT/node_modules/circomlib/circuits" ]; then
    echo "Setup has not been run. Please run ./zkbugs_setup.sh first."
    exit 1
fi

echo "Compiling the target circuit: $CIRCOM_CIRCUIT"
circom $CIRCOM_CIRCUIT --O0 --r1cs --wasm --sym -l $CODEBASE_PATH -l $CIRCOMLIB_PATH

echo "Phase 2 of the ceremony producing zkey and verification key: ${ZKEY_FINAL}"
snarkjs powersoftau prepare phase2 ${PTAU_FILE} ${PTAU_FINAL} -v
snarkjs groth16 setup $R1CS ${PTAU_FINAL} ${ZKEY_INIT}
echo "zkbugs" | snarkjs zkey contribute ${ZKEY_INIT} ${ZKEY_FINAL} --name="1st Contributor Name" -v
snarkjs zkey export verificationkey ${ZKEY_FINAL} $VKEY
EOF
chmod +x "$BUG_DIR/zkbugs_compile_setup.sh"

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

cat > "$BUG_DIR/zkbugs_clean.sh" << 'EOF'
#!/bin/bash
set -euo pipefail

# Clean all possible build artifacts
rm -rf *.sym *_0001.zkey *.r1cs *_0000.zkey *_js \
    final.ptau proof.json verification_key.json public.json
EOF
chmod +x "$BUG_DIR/zkbugs_clean.sh"

echo "  Shell scripts generated."

# Step 5: Update zkbugs_config.json
echo "Updating zkbugs_config.json..."

python3 - "$CONFIG" "$CODEBASE_REL" << 'PYEOF'
import json, sys

config_path = sys.argv[1]
codebase_rel = sys.argv[2]

with open(config_path) as f:
    data = json.load(f)

key = list(data.keys())[0]
bug = data[key]

# Normalize commit
commit = bug.get("Commit", "")
if commit.startswith("0x"):
    bug["Commit"] = commit[2:]

# Add new fields
bug["Codebase"] = codebase_rel
bug["Entrypoint"] = ["TODO_ENTRYPOINT"]
bug["Direct Entrypoint"] = "circuit.circom"

# Add Input field
bug["Input"] = {
    "Original": "input.json",
    "Direct": "direct_input.json"
}

# Update Commands
commands = bug.get("Commands", {})
commands.pop("Reproduce", None)
commands.pop("Find Exploit", None)
commands["Compile"] = "./zkbugs_compile.sh"
if "Compile and Preprocess" not in commands:
    commands["Compile and Preprocess"] = "./zkbugs_compile_setup.sh"
if "Positive Test" not in commands:
    commands["Positive Test"] = "./zkbugs_positive_test.sh"
if "Clean" not in commands:
    commands["Clean"] = "./zkbugs_clean.sh"
if "Setup Environment" not in commands:
    commands["Setup Environment"] = "./zkbugs_setup.sh"
bug["Commands"] = commands

# Remove old fields
bug.pop("Short Description of the Exploit", None)

# Reorder keys for consistency
ordered = {}
key_order = [
    "Id", "Path", "Project", "Commit", "Fix Commit", "DSL",
    "Vulnerability", "Impact", "Root Cause", "Reproduced",
    "Codebase", "Entrypoint", "Direct Entrypoint",
    "Location", "Source", "Input", "Commands",
    "Short Description of the Vulnerability",
    "Proposed Mitigation", "Similar Bugs"
]
for k in key_order:
    if k in bug:
        ordered[k] = bug[k]
for k in bug:
    if k not in ordered:
        ordered[k] = bug[k]

data[key] = ordered

with open(config_path, "w") as f:
    json.dump(data, f, indent=4)
    f.write("\n")

PYEOF

echo "  Config updated."

# Step 6: Delete old files
echo "Removing old files..."
for f in "$BUG_DIR/circuits" "$BUG_DIR/detect.sage" "$BUG_DIR/exploitable_witness.json" \
         "$BUG_DIR/zkbugs_exploit.sh" "$BUG_DIR/zkbugs_find_exploit.sh"; do
    if [ -e "$f" ]; then
        trash "$f" 2>/dev/null || rm -rf "$f"
        echo "  Removed: $(basename "$f")"
    fi
done

# Step 7: Generate README.md
echo "Generating README.md..."

python3 - "$CONFIG" "$BUG_DIR" << 'PYEOF'
import json, sys

config_path = sys.argv[1]
bug_dir = sys.argv[2]

with open(config_path) as f:
    data = json.load(f)

key = list(data.keys())[0]
bug = data[key]

lines = []
lines.append(f"# {key}")
lines.append("")

simple_fields = [
    ("Id", "Id"), ("Project", "Project"), ("Commit", "Commit"),
    ("Fix Commit", "Fix Commit"), ("DSL", "DSL"),
    ("Vulnerability", "Vulnerability"), ("Impact", "Impact"),
    ("Root Cause", "Root Cause"), ("Reproduced", "Reproduced"),
    ("Codebase", "Codebase"),
]
for label, field in simple_fields:
    val = bug.get(field, "")
    lines.append(f"* {label}: {val}")

# Entrypoint
ep = bug.get("Entrypoint", [])
if isinstance(ep, list):
    lines.append(f"* Entrypoint: {', '.join(ep)}")
else:
    lines.append(f"* Entrypoint: {ep}")

lines.append(f"* Direct Entrypoint: {bug.get('Direct Entrypoint', '')}")

# Location
loc = bug.get("Location", {})
lines.append("* Location")
lines.append(f"  - Path: {loc.get('Path', '')}")
lines.append(f"  - Function: {loc.get('Function', '')}")
lines.append(f"  - Line: {loc.get('Line', '')}")

# Source
source = bug.get("Source", {})
for src_type, src_data in source.items():
    lines.append(f"* Source: {src_type}")
    if isinstance(src_data, dict):
        for k, v in src_data.items():
            lines.append(f"  - {k}: {v}")

# Input
inp = bug.get("Input", {})
lines.append("* Input")
lines.append(f"  - Original: {inp.get('Original', 'input.json')}")
lines.append(f"  - Direct: {inp.get('Direct', 'direct_input.json')}")

# Commands
lines.append("* Commands")
for cmd_name, cmd_val in bug.get("Commands", {}).items():
    lines.append(f"  - {cmd_name}: `{cmd_val}`")

lines.append("")
lines.append("## Running")
lines.append("")
lines.append("Scripts support two modes controlled by the `ZKBUGS_MODE` environment variable:")
lines.append("")
lines.append("- **`original`** (default): compiles the project's main circuit from the full codebase.")
lines.append("- **`direct`**: compiles an isolated wrapper (`circuit.circom`) that only instantiates the vulnerable template.")
lines.append("")
lines.append("```bash")
lines.append("# Setup (run once)")
lines.append("./zkbugs_setup.sh")
lines.append("")
lines.append("# Compile only (no zkey ceremony)")
lines.append("./zkbugs_compile.sh                        # original mode")
lines.append("ZKBUGS_MODE=direct ./zkbugs_compile.sh     # direct mode")
lines.append("")
lines.append("# Full setup with zkey ceremony + positive test (direct mode)")
lines.append("ZKBUGS_MODE=direct ./zkbugs_compile_setup.sh")
lines.append("ZKBUGS_MODE=direct ./zkbugs_positive_test.sh")
lines.append("")
lines.append("# Clean build artifacts")
lines.append("./zkbugs_clean.sh")
lines.append("```")

vuln_desc = bug.get("Short Description of the Vulnerability", "")
if vuln_desc:
    lines.append("")
    lines.append("## Short Description of the Vulnerability")
    lines.append("")
    lines.append(vuln_desc)

mitigation = bug.get("Proposed Mitigation", "")
if mitigation:
    lines.append("")
    lines.append("## Proposed Mitigation")
    lines.append("")
    lines.append(mitigation)

lines.append("")

with open(f"{bug_dir}/README.md", "w") as f:
    f.write("\n".join(lines))

PYEOF

echo "  README.md generated."

# Print TODO summary
echo ""
echo "=== Migration complete. Manual TODOs: ==="
echo "  1. Set CIRCOM_CIRCUIT_ORIGINAL in zkbugs_vars.sh (replace TODO_ENTRYPOINT)"
echo "  2. Set original ptau in zkbugs_vars.sh (replace TODO_PTAU)"
echo "  3. Update Entrypoint in zkbugs_config.json (replace TODO_ENTRYPOINT)"
echo "  4. Review circuit.circom include paths and add missing dependencies"
echo "  5. Update Location.Line in zkbugs_config.json to match line in full source"
echo "  6. Verify: ZKBUGS_MODE=direct ./zkbugs_compile.sh"
echo "  7. Verify: ./zkbugs_compile.sh (original mode)"

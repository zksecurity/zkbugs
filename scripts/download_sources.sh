#!/bin/bash
# -e intentionally omitted: some clones/patches may fail gracefully
set -uo pipefail

# Download and set up all project codebases for the zkbugs dataset.
# Clones repos at the vulnerable commit, removes .git, and applies patches.
#
# Usage: scripts/download_sources.sh [--force]
#   --force  Re-download even if codebase directory exists

SCRIPT_DIR=$(dirname "$(realpath "$0")")
ROOT_DIR=$(dirname "$SCRIPT_DIR")
PATCHES_DIR="$SCRIPT_DIR/patches"
CODEBASES_DIR="$ROOT_DIR/dataset/codebases/circom"
CIRCOMLIB_DEP="$ROOT_DIR/dataset/circom/dependencies/circomlib"

# Cross-platform sed -i (macOS requires '' arg, GNU/Linux does not)
if sed --version 2>/dev/null | grep -q GNU; then
    SED_I="sed -i"
else
    SED_I="sed -i ''"
fi

sedi() {
    eval "$SED_I" '"$@"'
}

# Portable prepend pragma to a file
add_pragma() {
    local file="$1"
    local tmp="${file}.tmp"
    printf 'pragma circom 2.0.0;\n\n' | cat - "$file" > "$tmp" && mv "$tmp" "$file"
}

# Create a relative symlink at $2 pointing to $1. Portable on macOS and Linux
# (BSD ln has no -r flag, so we compute the relative path via python3).
# Target ($1) must exist; parent directory of the link ($2) must exist.
link_rel() {
    local target="$1"
    local linkpath="$2"
    local rel
    rel=$(python3 -c 'import os,sys; print(os.path.relpath(sys.argv[1], start=os.path.dirname(sys.argv[2])))' "$target" "$linkpath")
    ln -sfn "$rel" "$linkpath"
}

FORCE=false
[ "${1:-}" = "--force" ] && FORCE=true

echo "=== zkbugs: Download and setup codebases ==="

# Collect unique (project_url, commit, codebase_path) from all bug configs
ENTRIES=$(python3 -c "
import json, glob, os
seen = set()
for cfg in sorted(glob.glob('$ROOT_DIR/dataset/circom/*/*/*/zkbugs_config.json')):
    if 'dependencies' in cfg:
        continue
    d = json.load(open(cfg))
    k = list(d.keys())[0]
    b = d[k]
    url = b.get('Project', '')
    commit = b.get('Commit', '')
    codebase = b.get('Codebase', '')
    if not url or not commit or not codebase:
        continue
    # Normalize URL (strip /releases/tag/...)
    if '/releases/' in url:
        url = '/'.join(url.split('/')[:5])
    key = f'{url}|{commit}|{codebase}'
    if key not in seen:
        seen.add(key)
        print(key)
")

TOTAL=$(echo "$ENTRIES" | wc -l | tr -d ' ')
COUNT=0

echo "$ENTRIES" | while IFS='|' read -r URL COMMIT CODEBASE_REL; do
    COUNT=$((COUNT + 1))
    CODEBASE_PATH="$ROOT_DIR/$CODEBASE_REL"

    # Extract org/project/commit for display
    ORG=$(echo "$URL" | sed 's|.*/\([^/]*\)/[^/]*$|\1|')
    PROJ=$(echo "$URL" | sed 's|.*/||')
    SHORT=$(echo "$COMMIT" | head -c 10)

    echo ""
    echo "[$COUNT/$TOTAL] $ORG/$PROJ @ $SHORT"

    if [ -d "$CODEBASE_PATH" ] && ! $FORCE; then
        echo "  Already exists, skipping (use --force to re-download)"
        continue
    fi

    # Clone
    echo "  Cloning $URL..."
    mkdir -p "$(dirname "$CODEBASE_PATH")"
    if $FORCE && [ -d "$CODEBASE_PATH" ]; then
        rm -r "$CODEBASE_PATH"
    fi
    GIT_TERMINAL_PROMPT=0 git clone --quiet "$URL" "$CODEBASE_PATH" 2>&1 | tail -1 || {
        echo "  WARNING: Clone failed for $URL (repo may be private/deleted)"
        echo "  Bugs using this repo rely on local circuit files instead."
        continue
    }

    # Checkout commit
    cd "$CODEBASE_PATH"
    if ! git cat-file -t "$COMMIT" >/dev/null 2>&1; then
        # Commit might be unreachable (force-pushed). Try fetching it directly.
        echo "  Commit not in default clone, fetching directly..."
        git fetch --quiet origin "$COMMIT" 2>/dev/null || true
    fi
    if ! git cat-file -t "$COMMIT" >/dev/null 2>&1; then
        echo "  ERROR: Commit $COMMIT not found (may have been force-pushed away)"
        cd "$ROOT_DIR"
        rm -r "$CODEBASE_PATH"
        continue
    fi
    FULL_HASH=$(git rev-parse "$COMMIT")
    git checkout --quiet "$FULL_HASH" || {
        echo "  ERROR: Failed to checkout $FULL_HASH"
        cd "$ROOT_DIR"
        rm -r "$CODEBASE_PATH"
        continue
    }

    # If short hash was used and resolved to a different dir name, rename
    if [ "$FULL_HASH" != "$COMMIT" ] && [ ${#COMMIT} -lt 40 ]; then
        cd "$ROOT_DIR"
        NEW_PATH="$(dirname "$CODEBASE_PATH")/$FULL_HASH"
        if [ "$CODEBASE_PATH" != "$NEW_PATH" ] && [ ! -d "$NEW_PATH" ]; then
            mv "$CODEBASE_PATH" "$NEW_PATH"
            CODEBASE_PATH="$NEW_PATH"
            echo "  Resolved short hash -> $FULL_HASH"
        fi
        cd "$CODEBASE_PATH"
    fi

    echo "  Cloned and checked out."

    # Apply patch if exists (before removing .git so git apply works)
    PATCH_NAME="${ORG}_${PROJ}_${SHORT}.patch"
    if [ -f "$PATCHES_DIR/$PATCH_NAME" ] && [ -s "$PATCHES_DIR/$PATCH_NAME" ]; then
        echo "  Applying patch: $PATCH_NAME"
        cd "$CODEBASE_PATH"
        git apply "$PATCHES_DIR/$PATCH_NAME" 2>/dev/null || \
            echo "  WARNING: Patch failed, manual fix may be needed"
        cd "$ROOT_DIR"
    fi

    # Remove .git
    rm -r "$CODEBASE_PATH/.git"
done

echo ""
echo "=== Setting up dependencies ==="

# Set up circomlib symlinks where needed
setup_circomlib_symlink() {
    local TARGET_DIR="$1"
    if [ ! -L "$TARGET_DIR" ] && [ ! -d "$TARGET_DIR" ]; then
        mkdir -p "$(dirname "$TARGET_DIR")"
        link_rel "$CIRCOMLIB_DEP/circuits" "$TARGET_DIR"
        echo "  Symlinked circomlib -> $TARGET_DIR"
    fi
}

# Circomlib symlinks for projects that use node_modules/circomlib
for combo in \
    "succinctlabs/telepathy-circuits/9c84fb0f38531718296d9b611f8bd6107f61a9b8" \
    "succinctlabs/telepathy-circuits/b0c839cef30c3c25ef41d1ad3000081784766934"
do
    PARENT="$CODEBASES_DIR/$(dirname "$combo")"
    setup_circomlib_symlink "$PARENT/node_modules/circomlib/circuits"
done

for combo in \
    "darkforest-eth/darkforest-v0.3/1c83685e22e0463d5481c83e21616745b3204c9c"
do
    CB="$CODEBASES_DIR/$combo"
    setup_circomlib_symlink "$CB/client/node_modules/circomlib/circuits"
done

for combo in \
    "personaelabs/spartan-ecdsa/3386b30d9b5b62d8a60735cbeab42bfe42e80429" \
    "0xbok/circom-bigint/436665bf01728ae8c581fdb39e8428cb6b835c37"
do
    CB="$CODEBASES_DIR/$combo"
    setup_circomlib_symlink "$CB/node_modules/circomlib/circuits"
done

for combo in \
    "iden3/circuits/7a1e04de3e5f3a9f0cfb27a43c9f41c986c1b9ed"
do
    CB="$CODEBASES_DIR/$combo"
    setup_circomlib_symlink "$CB/node_modules/circomlib/circuits"
done

for combo in \
    "tangle-network/protocol-solidity/848d073bb17f0aaffc6d39f594cc59efedeaec89"
do
    CB="$CODEBASES_DIR/$combo"
    setup_circomlib_symlink "$CB/node_modules/circomlib/circuits"
done

for combo in \
    "semaphore-protocol/semaphore/27320f17233b18de477a74919084fba76513470f"
do
    CB="$CODEBASES_DIR/$combo"
    mkdir -p "$CB/packages/circuits/node_modules/circomlib"
    link_rel "$CIRCOMLIB_DEP/circuits" "$CB/packages/circuits/node_modules/circomlib/circuits"
    # Also at packages/node_modules for ../node_modules references from circuits/
    mkdir -p "$CB/packages/node_modules/circomlib"
    link_rel "$CIRCOMLIB_DEP/circuits" "$CB/packages/node_modules/circomlib/circuits"
done

for combo in \
    "zkopru-network/zkopru/1f5c880d47b6913f848861667b8de6b88dcfe10d" \
    "zkopru-network/zkopru/4236fc8a5cbf73b7f3860d87a1a447eea8d7abd4"
do
    CB="$CODEBASES_DIR/$combo"
    setup_circomlib_symlink "$CB/packages/node_modules/circomlib/circuits"
    setup_circomlib_symlink "$CB/packages/circuits/node_modules/circomlib/circuits"
done

# Unirep circomlib symlink (inside circuits dir)
CB="$CODEBASES_DIR/Unirep/Unirep/0985a28c38c8b2e7b7a9e80f43e63179fdd08b89"
if [ -d "$CB" ]; then
    mkdir -p "$CB/packages/circuits/circuits/circomlib"
    link_rel "$CIRCOMLIB_DEP/circuits" "$CB/packages/circuits/circuits/circomlib/circuits"
fi

# Install npm packages for selfxyz
echo "  Installing npm packages for selfxyz..."
for commit in \
    4f18c75041bb47c1862169eef82c22067642a83a \
    3905a30aeb19016d22c5493b8b34ade2d118da4e \
    59c16d6e924c946970665504d883ced46981e5c1 \
    629dfdad1a867eb82ccba6857a545f3ef838e123
do
    CB="$CODEBASES_DIR/selfxyz/self/$commit/circuits"
    [ -d "$CB" ] || continue
    if [ ! -d "$CB/node_modules/@openpassport" ]; then
        mkdir -p /tmp/selfxyz-deps 2>/dev/null
        cd /tmp/selfxyz-deps
        if [ ! -d node_modules/@openpassport ]; then
            npm init -y 2>&1 > /dev/null
            npm install "@openpassport/zk-email-circuits@6.1.2" \
                "@zk-kit/binary-merkle-root.circom@1" \
                "https://github.com/0xbok/circom-bigint" \
                "@selfxyz/aa-circuits@0.0.1" \
                --ignore-scripts 2>&1 > /dev/null
            # Create anon-aadhaar-circuits alias
            cp -r node_modules/@selfxyz/aa-circuits node_modules/anon-aadhaar-circuits 2>/dev/null
            # Comment out component main in anon-aadhaar test files
            find node_modules/anon-aadhaar-circuits -name "*.circom" -exec sed -i.bak 's/^component main/\/\/ component main/' {} + 2>/dev/null
            find node_modules/anon-aadhaar-circuits -name "*.circom.bak" -delete 2>/dev/null
        fi
        cd "$ROOT_DIR"
        mkdir -p "$CB/node_modules"
        cp -r /tmp/selfxyz-deps/node_modules/@openpassport "$CB/node_modules/" 2>/dev/null
        cp -r /tmp/selfxyz-deps/node_modules/@zk-kit "$CB/node_modules/" 2>/dev/null
        cp -r /tmp/selfxyz-deps/node_modules/circom-bigint "$CB/node_modules/" 2>/dev/null
        cp -r /tmp/selfxyz-deps/node_modules/anon-aadhaar-circuits "$CB/node_modules/" 2>/dev/null
    fi
done

# Install npm packages for semaphore
CB="$CODEBASES_DIR/semaphore-protocol/semaphore/27320f17233b18de477a74919084fba76513470f"
if [ -d "$CB" ] && [ ! -d "$CB/packages/circuits/node_modules/@zk-kit" ]; then
    mkdir -p /tmp/semaphore-deps 2>/dev/null
    cd /tmp/semaphore-deps
    if [ ! -d node_modules/@zk-kit ]; then
        npm init -y 2>&1 > /dev/null
        npm install "circomlib@2.0.5" "@zk-kit/binary-merkle-root.circom@2.0.0" \
            --ignore-scripts 2>&1 > /dev/null
    fi
    cd "$ROOT_DIR"
    cp -r /tmp/semaphore-deps/node_modules/@zk-kit "$CB/packages/circuits/node_modules/" 2>/dev/null
fi

echo ""
echo "=== Applying codebase-specific fixes ==="

# Fix telepathy fp12.circom: remove signal assignments to template parameter p
for commit in 9c84fb0f38531718296d9b611f8bd6107f61a9b8 b0c839cef30c3c25ef41d1ad3000081784766934; do
    FP12="$CODEBASES_DIR/succinctlabs/telepathy-circuits/$commit/circuits/pairing/fp12.circom"
    if [ -f "$FP12" ]; then
        sedi '/adders\[i\]\[j\]\.p\[m\] <== p\[m\];/d' "$FP12"
        sedi 's/for(var j=0; j<k; j++) pow2\[i\]\.p\[j\] <== p\[j\];/\/\/ p is a template parameter, not a signal/' "$FP12"
    fi
    # Fix BigMultShortLong 2-param calls
    for f in extra_field_circuits.circom extra_curve.circom; do
        FILE="$CODEBASES_DIR/succinctlabs/telepathy-circuits/$commit/circuits/pairing/$f"
        [ -f "$FILE" ] || continue
        python3 -c "
import re
with open('$FILE') as fh:
    content = fh.read()
def fix_bm(m):
    args = m.group(1)
    if args.count(',') == 1: return f'BigMultShortLong({args}, 2*n + 10)'
    return m.group(0)
def fix_bmu(m):
    args = m.group(1)
    if args.count(',') == 2: return f'BigMultShortLongUnequal({args}, 2*n + 10)'
    return m.group(0)
content = re.sub(r'(?<!template )BigMultShortLong\(([^)]+)\)', fix_bm, content)
content = re.sub(r'(?<!template )BigMultShortLongUnequal\(([^)]+)\)', fix_bmu, content)
with open('$FILE', 'w') as fh:
    fh.write(content)
" 2>/dev/null
    done
done
echo "  Fixed telepathy fp12 and BigMultShortLong"

# Fix selfxyz vc_and_disclose_aadhaar.circom: comment out component main block
CB="$CODEBASES_DIR/selfxyz/self/3905a30aeb19016d22c5493b8b34ade2d118da4e"
FILE="$CB/circuits/circuits/disclose/vc_and_disclose_aadhaar.circom"
if [ -f "$FILE" ]; then
    python3 -c "
with open('$FILE') as f:
    lines = f.readlines()
in_main = False
new_lines = []
for line in lines:
    s = line.strip()
    if s.startswith('component main') and not s.startswith('//'):
        in_main = True
    if in_main:
        if not s.startswith('//'):
            new_lines.append('// ' + line)
        else:
            new_lines.append(line)
        if 'VC_AND_DISCLOSE' in s and ';' in s:
            in_main = False
    else:
        new_lines.append(line)
with open('$FILE', 'w') as f:
    f.writelines(new_lines)
"
    echo "  Fixed selfxyz vc_and_disclose_aadhaar component main"
fi

# Fix semaphore: comment out component main
CB="$CODEBASES_DIR/semaphore-protocol/semaphore/27320f17233b18de477a74919084fba76513470f"
FILE="$CB/packages/circuits/semaphore.circom"
if [ -f "$FILE" ]; then
    sedi 's/^component main/\/\/ component main/' "$FILE"
    echo "  Fixed semaphore component main"
fi

# Fix maci: install circomlib in node_modules
CB="$CODEBASES_DIR/privacy-scaling-explorations/maci/2db5f625b67a6b810bd851950d7a42c26189088b"
if [ -d "$CB" ] && [ ! -L "$CB/circuits/node_modules/circomlib/circuits" ]; then
    mkdir -p "$CB/circuits/node_modules/circomlib"
    link_rel "$CIRCOMLIB_DEP/circuits" "$CB/circuits/node_modules/circomlib/circuits"
    echo "  Fixed maci circomlib symlink"
fi
# Fix maci: signal private input -> signal input, add pragma
if [ -d "$CB" ]; then
    find "$CB/circuits" -name "*.circom" -not -path "*/node_modules/*" -exec sed -i.bak 's/signal private input/signal input/g' {} + 2>/dev/null
    find "$CB/circuits" -name "*.circom.bak" -not -path "*/node_modules/*" -delete 2>/dev/null
    for f in $(grep -rL "pragma circom" "$CB/circuits/circom/" --include="*.circom" 2>/dev/null); do
        add_pragma "$f" 2>/dev/null
    done
    # Fix missing semicolons in include statements
    find "$CB/circuits/circom" -name "*.circom" -exec sed -i.bak 's/include "\(.*\)\.circom"$/include "\1.circom";/' {} + 2>/dev/null
    find "$CB/circuits/circom" -name "*.circom.bak" -delete 2>/dev/null
    # Fix specific missing semicolon in verifySignature.circom
    sedi 's/leftRightValid\.in\[1\] <== 2$/leftRightValid.in[1] <== 2;/' \
        "$CB/circuits/circom/verifySignature.circom" 2>/dev/null
    echo "  Fixed maci circom 2.x syntax"
fi

# Fix darkforest: add pragma, semicolons (range_proof, init, move)
CB="$CODEBASES_DIR/darkforest-eth/darkforest-v0.3/1c83685e22e0463d5481c83e21616745b3204c9c"
for FILE in "$CB/circuits/range_proof/circuit.circom" \
            "$CB/circuits/init/circuit.circom" \
            "$CB/circuits/move/circuit.circom"; do
    [ -f "$FILE" ] || continue
    if ! grep -q "pragma circom" "$FILE"; then
        add_pragma "$FILE"
    fi
    sedi 's/include "\(.*\)\.circom"$/include "\1.circom";/' "$FILE"
    sedi 's/signal private input/signal input/g' "$FILE"
done
# range_proof specific
sedi 's/lowerBound\.out === 0$/lowerBound.out === 0;/' "$CB/circuits/range_proof/circuit.circom" 2>/dev/null
sedi 's/upperBound\.out === 0$/upperBound.out === 0;/' "$CB/circuits/range_proof/circuit.circom" 2>/dev/null
# init specific
sedi 's/comp\.in\[0\] <== xSq + ySq$/comp.in[0] <== xSq + ySq;/' "$CB/circuits/init/circuit.circom" 2>/dev/null
sedi 's/comp\.in\[1\] <== rSq$/comp.in[1] <== rSq;/' "$CB/circuits/init/circuit.circom" 2>/dev/null
# move specific
sedi 's/comp2\.in\[0\] <== x2Sq + y2Sq$/comp2.in[0] <== x2Sq + y2Sq;/' "$CB/circuits/move/circuit.circom" 2>/dev/null
sedi 's/comp2\.in\[1\] <== rSq$/comp2.in[1] <== rSq;/' "$CB/circuits/move/circuit.circom" 2>/dev/null
sedi 's/signal secondDistSquare$/signal secondDistSquare;/' "$CB/circuits/move/circuit.circom" 2>/dev/null
echo "  Fixed darkforest circom 2.x syntax (range_proof, init, move)"

# Fix iden3/circomlib @ 324b8bf8: mimcsponge pragma, sized array, signal syntax
CB="$CODEBASES_DIR/iden3/circomlib/324b8bf8cc4a80357354752deb6c2ae5be22e5f5"
FILE="$CB/circuits/mimcsponge.circom"
if [ -f "$FILE" ] && ! grep -q "pragma circom" "$FILE"; then
    add_pragma "$FILE"
    sedi 's/var c = \[/var c[220] = [/' "$FILE"
    sedi 's/xR\[i\] = (i==0)/xR[i] <-- (i==0)/' "$FILE"
    sedi 's/outs\[0\] = S\[nInputs/outs[0] <-- S[nInputs/' "$FILE"
    echo "  Fixed iden3/circomlib mimcsponge"
fi

# Fix zkopru (both commits): signal private, pragma, semicolons
for commit in 1f5c880d47b6913f848861667b8de6b88dcfe10d 4236fc8a5cbf73b7f3860d87a1a447eea8d7abd4; do
    CB="$CODEBASES_DIR/zkopru-network/zkopru/$commit"
    [ -d "$CB/packages/circuits" ] || continue
    find "$CB/packages/circuits" -name "*.circom" -exec sed -i.bak 's/signal private input/signal input/g' {} + 2>/dev/null
    find "$CB/packages/circuits" -name "*.circom.bak" -delete 2>/dev/null
    for f in $(grep -rL "pragma circom" "$CB/packages/circuits/" --include="*.circom" 2>/dev/null); do
        add_pragma "$f" 2>/dev/null
    done
    find "$CB/packages/circuits" -name "*.circom" -exec sed -i.bak 's/include "\(.*\)\.circom"$/include "\1.circom";/' {} + 2>/dev/null
    find "$CB/packages/circuits" -name "*.circom.bak" -delete 2>/dev/null
    # Fix specific missing semicolons
    for f in "$CB/packages/circuits/lib/ownership_proof.circom" \
             "$CB/packages/circuits/lib/inclusion_proof.circom"; do
        [ -f "$f" ] || continue
        sedi 's/EdDSAPoseidonVerifier()$/EdDSAPoseidonVerifier();/' "$f"
        sedi 's/left\[level\]\.out$/left[level].out;/' "$f"
        sedi 's/right\[level\]\.out$/right[level].out;/' "$f"
    done
done
echo "  Fixed zkopru circom 2.x syntax"

echo ""
echo "=== Generating original entrypoints ==="

# Generate Unirep circuit files (dynamically generated in original project)
CB="$CODEBASES_DIR/Unirep/Unirep/0985a28c38c8b2e7b7a9e80f43e63179fdd08b89"
if [ -d "$CB" ]; then
    # EpochKeyLite entrypoint
    mkdir -p "$CB/packages/circuits/generated"
    cat > "$CB/packages/circuits/generated/epochKeyLite.circom" << 'CIRCEOF'
pragma circom 2.0.0;
include "../circuits/epochKeyLite.circom";
component main { public [ sig_data ] } = EpochKeyLite(3);
CIRCEOF
    # BigLessThan entrypoint
    cat > "$CB/packages/circuits/generated/bigComparators.circom" << 'CIRCEOF'
pragma circom 2.0.0;
include "../circuits/bigComparators.circom";
component main = BigLessThan();
CIRCEOF
    echo "  Generated Unirep circuit entrypoints"
fi

# Generate semaphore entrypoint (component main was commented out)
CB="$CODEBASES_DIR/semaphore-protocol/semaphore/27320f17233b18de477a74919084fba76513470f"
if [ -d "$CB" ] && [ ! -f "$CB/packages/circuits/generated/semaphore_main.circom" ]; then
    mkdir -p "$CB/packages/circuits/generated"
    cat > "$CB/packages/circuits/generated/semaphore_main.circom" << 'CIRCEOF'
pragma circom 2.0.0;
include "../semaphore.circom";
component main {public [signalHash, externalNullifier]} = Semaphore(20);
CIRCEOF
    echo "  Generated semaphore entrypoint"
fi

# Generate selfxyz vc_and_disclose_aadhaar entrypoint (component main was commented out)
CB="$CODEBASES_DIR/selfxyz/self/3905a30aeb19016d22c5493b8b34ade2d118da4e"
if [ -d "$CB" ]; then
    mkdir -p "$CB/circuits/circuits/disclose/generated"
    cat > "$CB/circuits/circuits/disclose/generated/vc_and_disclose_aadhaar_main.circom" << 'CIRCEOF'
pragma circom 2.1.9;
include "../vc_and_disclose_aadhaar.circom";
component main { public [attestation_id,currentYear,currentMonth,currentDay,ofac_name_dob_smt_root,ofac_name_yob_smt_root,merkle_root,scope,user_identifier] } = VC_AND_DISCLOSE_Aadhaar(40, 33, 64, 64);
CIRCEOF
    echo "  Generated selfxyz vc_and_disclose_aadhaar entrypoint"
fi

echo ""
echo "=== Done ==="
echo "Run './scripts/test_all_circom.sh --compile-only' to verify."

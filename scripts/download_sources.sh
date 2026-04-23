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

# === BEGIN AUTO-ENTRIES ===
# Collect unique (project_url, commit, codebase_path) from all bug configs.
# This block is referenced by prompts/_bug_processing.md — do not remove the
# marker comments.
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
# === END AUTO-ENTRIES ===

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

# === BEGIN DEPENDENCY SETUP ===
# Add circomlib symlinks, npm installs, and project-specific fixes below.
# This section is referenced by prompts/_bug_processing.md.

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
    "Rate-Limiting-Nullifier/circom-rln/022b690b5615d1e26874013cf216136875d8f3ab"
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
    "zkemail/zk-email-verify/f2fb77c6ab49f4e85c424c3334ce69c018648fa7" \
    "sismo-core/hydra-s2-zkps/2b79ab31ebf5547cf73d0441a236446e8ddf501c"
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

# Panther Protocol zSwap circuits include `../../node_modules/circomlib/...`
# from `circuits/circuits/**/*.circom`, resolving to `circuits/node_modules`.
for combo in \
    "pantherfoundation/panther-core/06a818632053719b56ace37ef12c9b31904af1e2"
do
    CB="$CODEBASES_DIR/$combo"
    setup_circomlib_symlink "$CB/circuits/node_modules/circomlib/circuits"
done

# Unirep circomlib symlink (inside circuits dir)
CB="$CODEBASES_DIR/Unirep/Unirep/0985a28c38c8b2e7b7a9e80f43e63179fdd08b89"
if [ -d "$CB" ]; then
    mkdir -p "$CB/packages/circuits/circuits/circomlib"
    link_rel "$CIRCOMLIB_DEP/circuits" "$CB/packages/circuits/circuits/circomlib/circuits"
fi

# Arianee circomlib symlink. The circom files reference
# ../../node_modules/circomlib/circuits/... from packages/privacy-circuits/src/circom/*/,
# so node_modules must live at packages/privacy-circuits/src/.
CB="$CODEBASES_DIR/Arianee/arianee-sdk/b7da01e0c81b9cccdc257040997c3500eb59db4f"
if [ -d "$CB" ]; then
    mkdir -p "$CB/packages/privacy-circuits/src/node_modules/circomlib"
    ln -sf "$CIRCOMLIB_DEP/circuits" "$CB/packages/privacy-circuits/src/node_modules/circomlib/circuits" 2>/dev/null
fi

# Install npm packages for zksync-social-login-circuit (needs @zk-email/circuits and circomlib)
# Guard on a concrete .circom file — dir existence alone is unreliable (a prior
# partial install can leave empty lib/helpers/utils dirs that cp -r propagates).
CB="$CODEBASES_DIR/Moonsong-Labs/zksync-social-login-circuit/27cda6e74492fbad4aa3ca37ff5084ed391b534b"
SENTINEL="$CB/node_modules/@zk-email/circuits/lib/base64.circom"
if [ -d "$CB" ] && [ ! -f "$SENTINEL" ]; then
    rm -r "$CB/node_modules/@zk-email" 2>/dev/null
    mkdir -p /tmp/zksync-sso-deps 2>/dev/null
    cd /tmp/zksync-sso-deps
    if [ ! -f node_modules/@zk-email/circuits/lib/base64.circom ]; then
        rm -r node_modules/@zk-email 2>/dev/null
        npm init -y 2>&1 > /dev/null
        npm install "@zk-email/circuits@6.3.2" "circomlib@2.0.5" \
            --ignore-scripts 2>&1 > /dev/null
    fi
    cd "$ROOT_DIR"
    mkdir -p "$CB/node_modules"
    cp -r /tmp/zksync-sso-deps/node_modules/@zk-email "$CB/node_modules/" 2>/dev/null
    cp -r /tmp/zksync-sso-deps/node_modules/circomlib "$CB/node_modules/" 2>/dev/null
    echo "  Installed @zk-email/circuits and circomlib for zksync-social-login-circuit"
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

# zk-email ecosystem: ether-email-auth and zk-regex circuits import
# `@zk-email/zk-regex-circom/circuits/...`. Point that package name at the
# zk-regex packages/circom directory via node_modules symlinks.
ZK_REGEX_CB="$CODEBASES_DIR/zkemail/zk-regex/531575345558ba938675d725bd54df45c866ef74"
if [ -d "$ZK_REGEX_CB/packages/circom" ]; then
    mkdir -p "$ZK_REGEX_CB/node_modules/@zk-email"
    ln -sfn "$ZK_REGEX_CB/packages/circom" \
        "$ZK_REGEX_CB/node_modules/@zk-email/zk-regex-circom"
fi
ETHER_EMAIL_AUTH_CB="$CODEBASES_DIR/zkemail/ether-email-auth/8a62db1e676aedbb20a403be95fffebef12b97e4"
if [ -d "$ETHER_EMAIL_AUTH_CB/packages/circuits" ] && [ -d "$ZK_REGEX_CB/packages/circom" ]; then
    mkdir -p "$ETHER_EMAIL_AUTH_CB/node_modules/@zk-email"
    ln -sfn "$ZK_REGEX_CB/packages/circom" \
        "$ETHER_EMAIL_AUTH_CB/node_modules/@zk-email/zk-regex-circom"
fi

# ether-email-auth also needs @zk-email/circuits@6.1.5 for email_auth.circom to compile.
# Guard on the sentinel email-verifier.circom file (dir existence alone is unreliable —
# a partial install can leave empty subdirs that cp -r propagates).
ETHER_SENTINEL="$ETHER_EMAIL_AUTH_CB/node_modules/@zk-email/circuits/email-verifier.circom"
if [ -d "$ETHER_EMAIL_AUTH_CB" ] && [ ! -f "$ETHER_SENTINEL" ]; then
    rm -r "$ETHER_EMAIL_AUTH_CB/node_modules/@zk-email/circuits" 2>/dev/null
    mkdir -p /tmp/ether-email-auth-deps 2>/dev/null
    cd /tmp/ether-email-auth-deps
    if [ ! -f node_modules/@zk-email/circuits/email-verifier.circom ]; then
        rm -r node_modules/@zk-email/circuits 2>/dev/null
        npm init -y 2>&1 > /dev/null
        npm install "@zk-email/circuits@6.1.5" --ignore-scripts 2>&1 > /dev/null
    fi
    cd "$ROOT_DIR"
    mkdir -p "$ETHER_EMAIL_AUTH_CB/node_modules/@zk-email"
    cp -r /tmp/ether-email-auth-deps/node_modules/@zk-email/circuits \
        "$ETHER_EMAIL_AUTH_CB/node_modules/@zk-email/" 2>/dev/null
    echo "  Installed @zk-email/circuits@6.1.5 for ether-email-auth"
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

# Fix sismo hydra-s2-zkps: comment out component main so the direct wrapper can
# include the template without a duplicate main component.
CB="$CODEBASES_DIR/sismo-core/hydra-s2-zkps/2b79ab31ebf5547cf73d0441a236446e8ddf501c"
FILE="$CB/circuits/hydra-s2.circom"
if [ -f "$FILE" ]; then
    sedi 's/^component main/\/\/ component main/' "$FILE"
    echo "  Fixed sismo hydra-s2 component main"
fi

# Fix Arianee: comment out the trailing `component main` in the two top-level
# circuits so the direct wrappers can `include` them without a main collision.
CB="$CODEBASES_DIR/Arianee/arianee-sdk/b7da01e0c81b9cccdc257040997c3500eb59db4f"
for FILE in \
    "$CB/packages/privacy-circuits/src/circom/creditVerifier/creditVerifier.circom" \
    "$CB/packages/privacy-circuits/src/circom/ownershipVerifier/ownershipVerifier.circom"
do
    if [ -f "$FILE" ]; then
        sedi 's/^component main/\/\/ component main/' "$FILE"
    fi
done
if [ -d "$CB" ]; then
    echo "  Fixed Arianee component main (creditVerifier, ownershipVerifier)"
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

# Fix worm-privacy/proof-of-burn: populate submodule circomlib, strip dead includes
CB="$CODEBASES_DIR/worm-privacy/proof-of-burn/0802485d24fed18fe063e51bcbb0bc830585855f"
if [ -d "$CB" ]; then
    # circomlib is a git submodule at circuits/circomlib — not populated by a plain clone
    if [ -z "$(ls -A "$CB/circuits/circomlib" 2>/dev/null)" ]; then
        rmdir "$CB/circuits/circomlib" 2>/dev/null
        ln -sf "$CIRCOMLIB_DEP" "$CB/circuits/circomlib"
    fi
    # spend.circom at this commit includes two files that were deleted earlier
    # in history (padding.circom, hashbytes.circom) — strip them so the file compiles
    SPEND="$CB/circuits/spend.circom"
    if [ -f "$SPEND" ]; then
        sedi '/include ".\/utils\/padding.circom";/d' "$SPEND"
        sedi '/include ".\/utils\/hashbytes.circom";/d' "$SPEND"
    fi
    echo "  Fixed worm-privacy/proof-of-burn: circomlib symlink + stripped dead includes"
fi

# Generate sismo hydra-s2 entrypoint (component main was commented out)
CB="$CODEBASES_DIR/sismo-core/hydra-s2-zkps/2b79ab31ebf5547cf73d0441a236446e8ddf501c"
if [ -d "$CB" ] && [ ! -f "$CB/circuits/generated/hydra-s2_main.circom" ]; then
    mkdir -p "$CB/circuits/generated"
    cat > "$CB/circuits/generated/hydra-s2_main.circom" << 'CIRCEOF'
pragma circom 2.1.2;
include "../hydra-s2.circom";
component main {public [commitmentMapperPubKey, registryTreeRoot, vaultNamespace, vaultIdentifier, requestIdentifier, proofIdentifier, destinationIdentifier, statementValue, extraData, accountsTreeValue, statementComparator, sourceVerificationEnabled, destinationVerificationEnabled]} = hydraS2(20, 20);
CIRCEOF
    echo "  Generated sismo hydra-s2 entrypoint"
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

# Fix aptos-labs/keyless-zk-proofs: circomlib symlink + generated Base64DecodedLength entrypoint
CB="$CODEBASES_DIR/aptos-labs/keyless-zk-proofs/fd160220a88a5becf0f91ea1a5425fdd537c7399"
if [ -d "$CB" ]; then
    # Project uses `include "circomlib/circuits/…"` style. Placing circomlib at the
    # codebase root makes that resolve via the existing `-l $CODEBASE_PATH` flag.
    if [ ! -e "$CB/circomlib" ]; then
        ln -sf "$CIRCOMLIB_DEP" "$CB/circomlib"
    fi
    # Thin entrypoint that instantiates the vulnerable template via the real
    # helpers/misc.circom (so the original mode exercises the project's source).
    mkdir -p "$CB/circuit/templates/generated"
    cat > "$CB/circuit/templates/generated/base64_decoded_length_main.circom" << 'CIRCEOF'
pragma circom 2.1.3;
include "../helpers/misc.circom";
component main = Base64DecodedLength(8);
CIRCEOF
    echo "  Generated aptos-labs/keyless-zk-proofs Base64DecodedLength entrypoint"
fi

# Generate siv-org/verifiable-private-overrides entrypoints for ExtractStringFromPoint / EmitIfInRange
CB="$CODEBASES_DIR/siv-org/verifiable-private-overrides/7bda2311d7a33dcab611cfea0c67707b0b65c24c"
if [ -d "$CB" ]; then
    mkdir -p "$CB/circuits/generated"
    cat > "$CB/circuits/generated/extract_string_from_point_main.circom" << 'CIRCEOF'
pragma circom 2.2.2;
include "../ExtractStringFromPoint.circom";
component main = ExtractStringFromPoint();
CIRCEOF
    cat > "$CB/circuits/generated/emit_if_in_range_main.circom" << 'CIRCEOF'
pragma circom 2.2.2;
include "../ExtractStringFromPoint.circom";
component main = EmitIfInRange(5);
CIRCEOF
    echo "  Generated siv-org/verifiable-private-overrides entrypoints"
fi

# Fix banyancomputer/hot-proofs-blake3-circom: circomlib symlink + CheckDepth entrypoint
CB="$CODEBASES_DIR/banyancomputer/hot-proofs-blake3-circom/76b83107eb00c8f886bde82172eaa3cdd5d57f25"
if [ -d "$CB" ]; then
    # Project uses `include "circomlib/circuits/…"` — resolve via `-l $CODEBASE_PATH`
    if [ ! -e "$CB/circomlib" ]; then
        ln -sf "$CIRCOMLIB_DEP" "$CB/circomlib"
    fi
    # Thin entrypoint that instantiates Blake3NovaTreePath_CheckDepth through
    # the project's real blake3_nova.circom.
    mkdir -p "$CB/circuits/main"
    cat > "$CB/circuits/main/check_depth_main.circom" << 'CIRCEOF'
pragma circom 2.1.6;
include "../blake3_nova.circom";
component main = Blake3NovaTreePath_CheckDepth();
CIRCEOF
    echo "  Generated banyancomputer/hot-proofs-blake3-circom CheckDepth entrypoint"
fi

# Generate inference-labs-inc/subnet-2-circom entrypoints for Clamp / Subtract
CB="$CODEBASES_DIR/inference-labs-inc/subnet-2-circom/d310309c141d36504b3486cebd96ed70ef3a4fdf"
if [ -d "$CB" ]; then
    mkdir -p "$CB/src/generated"
    cat > "$CB/src/generated/clamp_main.circom" << 'CIRCEOF'
pragma circom 2.0.0;
include "../clampTensor.circom";
component main = Clamp(8);
CIRCEOF
    cat > "$CB/src/generated/subtract_main.circom" << 'CIRCEOF'
pragma circom 2.0.0;
include "../subtractTensor.circom";
component main = Subtract();
CIRCEOF
    echo "  Generated inference-labs-inc/subnet-2-circom entrypoints"
fi

# Generate Arianee entrypoints (trailing `component main` is commented out above).
CB="$CODEBASES_DIR/Arianee/arianee-sdk/b7da01e0c81b9cccdc257040997c3500eb59db4f"
if [ -d "$CB" ]; then
    mkdir -p "$CB/packages/privacy-circuits/src/circom/creditVerifier/generated"
    cat > "$CB/packages/privacy-circuits/src/circom/creditVerifier/generated/creditVerifier_main.circom" << 'CIRCEOF'
pragma circom 2.1.8;
include "../creditVerifier.circom";
component main { public [pubRoot, pubCreditType, pubNullifierHash] } = CreditVerifier(30);
CIRCEOF
    mkdir -p "$CB/packages/privacy-circuits/src/circom/ownershipVerifier/generated"
    cat > "$CB/packages/privacy-circuits/src/circom/ownershipVerifier/generated/ownershipVerifier_main.circom" << 'CIRCEOF'
pragma circom 2.1.8;
include "../ownershipVerifier.circom";
component main { public [pubCommitmentHash, pubIntentHash, pubNonce] } = OwnershipVerifier();
CIRCEOF
    echo "  Generated Arianee creditVerifier and ownershipVerifier entrypoints"
fi

# === END DEPENDENCY SETUP ===

echo ""
echo "=== Done ==="
echo "Run './scripts/test_all_circom.sh --compile-only' to verify."

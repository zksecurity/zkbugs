#!/bin/bash
set -euo pipefail

# Print machine-readable JSON for a circom bug's build variables.
# Usage: print_bug_vars.sh <bug_dir> [--mode direct|original]
#
# Sources the bug's zkbugs_vars.sh and emits JSON on stdout.
# All paths are absolute. Exits non-zero if zkbugs_vars.sh is missing.

if [ $# -lt 1 ]; then
    echo "Usage: $0 <bug_dir> [--mode direct|original]" >&2
    exit 1
fi

BUG_DIR="$(cd "$1" && pwd)"

MODE="${ZKBUGS_MODE:-original}"
if [ "${2:-}" = "--mode" ] && [ -n "${3:-}" ]; then
    MODE="$3"
fi

if [ ! -f "$BUG_DIR/zkbugs_vars.sh" ]; then
    echo "Error: $BUG_DIR/zkbugs_vars.sh not found" >&2
    exit 1
fi

# Source zkbugs_vars.sh in a subshell where $0 points to a file inside
# the bug directory. zkbugs_vars.sh uses realpath("$0") to derive
# BUG_DIR and ROOT_PATH, so $0 must resolve inside the bug dir.
cd "$BUG_DIR"
exec bash -c '
export ZKBUGS_MODE="$1"
source ./zkbugs_vars.sh

CB_EXISTS="False"
[ -d "$CODEBASE_PATH" ] && CB_EXISTS="True"

python3 << PYEOF
import json, sys
flags = $( python3 -c "import json,sys; print(json.dumps(sys.argv[1:]))" "${CIRCOM_LINK_FLAGS[@]}" )
doc = {
    "mode": "$ZKBUGS_MODE",
    "circuit": "$CIRCOM_CIRCUIT",
    "link_flags": flags,
    "input": "$BUG_DIR/$INPUTJSON",
    "ptau": "$PTAU_FILE",
    "target": "$TARGET",
    "codebase": "$CODEBASE_PATH",
    "codebase_exists": $CB_EXISTS,
}
json.dump(doc, sys.stdout, indent=2)
print()
PYEOF
' "$BUG_DIR/zkbugs_compile.sh" "$MODE"

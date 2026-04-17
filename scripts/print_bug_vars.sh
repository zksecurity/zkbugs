#!/bin/bash
# Print a JSON description of a circom bug's compile contract.
#
# Usage: print_bug_vars.sh <bug_dir> [--mode direct|original]
#
# Sources the bug's zkbugs_vars.sh under the requested ZKBUGS_MODE and emits a
# JSON object on stdout with absolute paths for circuit, input, ptau, codebase
# and a flat link_flags list matching the CIRCOM_LINK_FLAGS bash array.

set -euo pipefail

usage() {
    cat >&2 <<'USAGE'
Usage: print_bug_vars.sh <bug_dir> [--mode direct|original]

Prints a JSON description of a circom bug's compile contract.
Default mode is "direct".
USAGE
}

MODE="direct"
BUG_DIR_ARG=""

while [ $# -gt 0 ]; do
    case "$1" in
        --mode)
            if [ $# -lt 2 ]; then
                echo "error: --mode requires an argument" >&2
                exit 2
            fi
            MODE="$2"
            shift 2
            ;;
        -h|--help) usage; exit 0 ;;
        --) shift; break ;;
        -*)
            echo "error: unknown flag: $1" >&2
            usage
            exit 2
            ;;
        *)
            if [ -z "$BUG_DIR_ARG" ]; then
                BUG_DIR_ARG="$1"
                shift
            else
                echo "error: unexpected argument: $1" >&2
                exit 2
            fi
            ;;
    esac
done

if [ "$MODE" != "direct" ] && [ "$MODE" != "original" ]; then
    echo "error: --mode must be 'direct' or 'original' (got '$MODE')" >&2
    exit 2
fi

if [ -z "$BUG_DIR_ARG" ]; then
    usage
    exit 2
fi

if [ ! -d "$BUG_DIR_ARG" ]; then
    echo "error: bug_dir not found: $BUG_DIR_ARG" >&2
    exit 1
fi

BUG_DIR_ABS=$(cd "$BUG_DIR_ARG" && pwd)
VARS_FILE="$BUG_DIR_ABS/zkbugs_vars.sh"

if [ ! -f "$VARS_FILE" ]; then
    echo "error: zkbugs_vars.sh missing in $BUG_DIR_ABS" >&2
    exit 1
fi

# Python body used by the inner bash to serialize the final JSON. Exported so
# the inner bash inherits it and can invoke python3 -c "$_PRINT_BUG_VARS_PY".
export _PRINT_BUG_VARS_PY='
import json, os, sys
out = {
    "mode": os.environ["_OUT_MODE"],
    "circuit": os.environ["_OUT_CIRCUIT"],
    "link_flags": sys.argv[1:],
    "input": os.environ["_OUT_INPUT"],
    "ptau": os.environ["_OUT_PTAU"],
    "target": os.environ["_OUT_TARGET"],
    "codebase": os.environ["_OUT_CODEBASE"],
    "codebase_exists": os.environ["_OUT_CODEBASE_EXISTS"] == "true",
}
print(json.dumps(out, indent=2))
'

# Run zkbugs_vars.sh inside a sub-bash where $0 is set to the absolute path of
# the vars file. zkbugs_vars.sh derives BUG_DIR from realpath "$0", so setting
# $0 correctly makes the sourced script work regardless of the caller's cwd.
cd "$BUG_DIR_ABS"
ZKBUGS_MODE="$MODE" bash -c '
    set -u
    # shellcheck disable=SC1091
    source ./zkbugs_vars.sh
    if ! declare -p CIRCOM_LINK_FLAGS >/dev/null 2>&1; then
        echo "error: CIRCOM_LINK_FLAGS not defined by zkbugs_vars.sh" >&2
        exit 3
    fi
    if [[ "${INPUTJSON:-}" = /* ]]; then
        input_abs="$INPUTJSON"
    else
        input_abs="$BUG_DIR/${INPUTJSON:-}"
    fi
    target="${TARGET:-$(basename "$CIRCOM_CIRCUIT" .circom)}"
    codebase_exists=false
    [ -d "$CODEBASE_PATH" ] && codebase_exists=true
    export _OUT_MODE="$ZKBUGS_MODE"
    export _OUT_CIRCUIT="$CIRCOM_CIRCUIT"
    export _OUT_INPUT="$input_abs"
    export _OUT_PTAU="$PTAU_FILE"
    export _OUT_TARGET="$target"
    export _OUT_CODEBASE="$CODEBASE_PATH"
    export _OUT_CODEBASE_EXISTS="$codebase_exists"
    python3 -c "$_PRINT_BUG_VARS_PY" "${CIRCOM_LINK_FLAGS[@]}"
' "$VARS_FILE"

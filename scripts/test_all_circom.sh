#!/bin/bash
set -uo pipefail

# Test all circom bugs.
# Usage: scripts/test_all_circom.sh [--compile-only] [--skip-large] [--mode direct|original|both] [--verbose]
#
# --compile-only  Only test compilation, skip zkey ceremony and proof
# --skip-large    Skip bugs that need large Hermez ptau files
# --mode MODE     Test mode: direct (default), original, or both
# --verbose       Print full error output on failure

COMPILE_ONLY=false
SKIP_LARGE=false
VERBOSE=false
MODE="direct"

for arg in "$@"; do
    case "$arg" in
        --compile-only) COMPILE_ONLY=true ;;
        --skip-large) SKIP_LARGE=true ;;
        --verbose) VERBOSE=true ;;
        --mode) ;;  # value handled below
        direct|original|both)
            MODE="$arg" ;;
    esac
done

# Handle --mode <value> pattern
while [ $# -gt 0 ]; do
    if [ "$1" = "--mode" ] && [ $# -gt 1 ]; then
        MODE="$2"
        shift 2
    else
        shift
    fi
done

ROOT=$(dirname "$(dirname "$(realpath "$0")")")
cd "$ROOT"

# Print error details based on verbosity
print_error() {
    local result="$1"
    local clean_result
    clean_result=$(echo "$result" | sed 's/\x1b\[[0-9;]*m//g')
    if $VERBOSE; then
        echo "$clean_result" | grep -v "^$" | sed 's/^/  /'
    else
        echo "  $(echo "$clean_result" | grep -iE "error|circuit too big|Error" | head -1)"
    fi
}

echo "Mode: $MODE"
echo ""

pass=0; compile_ok=0; compile_fail=0; setup_fail=0; test_fail=0; skip=0; total=0
TOTAL_START=$(date +%s)

for d in dataset/circom/*/*/*/; do
    [ -f "$d/zkbugs_compile.sh" ] || continue
    echo "$d" | grep -q "dependencies" && continue

    bugname=$(basename "$d")
    total=$((total + 1))

    # Skip large circuits if requested
    if $SKIP_LARGE; then
        ptau=$(grep "powersOfTau28_hez_final" "$d/zkbugs_vars.sh" 2>/dev/null)
        if [ -n "$ptau" ]; then
            echo "[$(date '+%H:%M:%S')] [$total] SKIP_LARGE: $bugname"
            skip=$((skip + 1))
            continue
        fi
    fi

    BUG_START=$(date +%s)

    cd "$d"
    ./zkbugs_setup.sh 2>&1 > /dev/null

    # Determine which modes to test
    MODES_TO_TEST=""
    case "$MODE" in
        direct)   MODES_TO_TEST="direct" ;;
        original) MODES_TO_TEST="original" ;;
        both)     MODES_TO_TEST="direct original" ;;
    esac

    compile_passed=true
    for m in $MODES_TO_TEST; do
        if $COMPILE_ONLY; then
            echo -n "[$(date '+%H:%M:%S')] [$total] Testing ($m): $bugname ... "
        fi
        result=$(ZKBUGS_MODE=$m ./zkbugs_compile.sh 2>&1)
        if ! echo "$result" | grep -q "Everything went okay"; then
            if ! $COMPILE_ONLY; then
                echo -n "[$(date '+%H:%M:%S')] [$total] Testing ($m): $bugname ... "
            fi
            elapsed=$(( $(date +%s) - BUG_START ))
            echo "COMPILE_FAIL (${elapsed}s)"
            print_error "$result"
            compile_passed=false
            break
        fi
        ./zkbugs_clean.sh 2>&1 > /dev/null

        if $COMPILE_ONLY; then
            elapsed=$(( $(date +%s) - BUG_START ))
            echo "COMPILE_OK (${elapsed}s)"
        fi
    done

    if ! $compile_passed; then
        compile_fail=$((compile_fail + 1))
        ./zkbugs_clean.sh 2>&1 > /dev/null
        cd "$ROOT"
        continue
    fi
    compile_ok=$((compile_ok + 1))

    if $COMPILE_ONLY; then
        ./zkbugs_clean.sh 2>&1 > /dev/null
        cd "$ROOT"
        continue
    fi

    # Full test always uses direct mode (original circuits are too large for zkey)
    echo -n "[$(date '+%H:%M:%S')] [$total] Testing: $bugname ... "

    # Skip if no valid input
    if [ ! -f direct_input.json ] || [ "$(cat direct_input.json 2>/dev/null)" = "{}" ]; then
        elapsed=$(( $(date +%s) - BUG_START ))
        echo "SKIP_NO_INPUT (${elapsed}s)"
        skip=$((skip + 1))
        ./zkbugs_clean.sh 2>&1 > /dev/null
        cd "$ROOT"
        continue
    fi

    # Setup (zkey ceremony)
    result=$(ZKBUGS_MODE=direct ./zkbugs_compile_setup.sh 2>&1)
    if ! echo "$result" | grep -q "EXPORT VERIFICATION KEY FINISHED"; then
        elapsed=$(( $(date +%s) - BUG_START ))
        echo "SETUP_FAIL (${elapsed}s)"
        print_error "$result"
        setup_fail=$((setup_fail + 1))
        ./zkbugs_clean.sh 2>&1 > /dev/null
        cd "$ROOT"
        continue
    fi

    # Positive test (witness + proof + verify)
    result=$(ZKBUGS_MODE=direct ./zkbugs_positive_test.sh 2>&1)
    if echo "$result" | grep -q "OK!"; then
        elapsed=$(( $(date +%s) - BUG_START ))
        echo "PASS (${elapsed}s)"
        pass=$((pass + 1))
    else
        elapsed=$(( $(date +%s) - BUG_START ))
        echo "TEST_FAIL (${elapsed}s)"
        print_error "$result"
        test_fail=$((test_fail + 1))
    fi

    ./zkbugs_clean.sh 2>&1 > /dev/null
    cd "$ROOT"
done

TOTAL_ELAPSED=$(( $(date +%s) - TOTAL_START ))
MINUTES=$((TOTAL_ELAPSED / 60))
SECONDS=$((TOTAL_ELAPSED % 60))

echo ""
echo "=== Results (${MINUTES}m ${SECONDS}s) ==="
echo "Mode:           $MODE"
echo "Total bugs:     $total"
echo "Compile OK:     $compile_ok"
if [ "$compile_fail" -gt 0 ]; then
    echo "Compile FAIL:   $compile_fail"
fi
if ! $COMPILE_ONLY; then
    echo "Positive PASS:  $pass"
    if [ "$setup_fail" -gt 0 ]; then
        echo "SETUP_FAIL:     $setup_fail"
    fi
    if [ "$test_fail" -gt 0 ]; then
        echo "TEST_FAIL:      $test_fail"
    fi
    if [ "$skip" -gt 0 ]; then
        echo "SKIP:           $skip"
    fi
fi

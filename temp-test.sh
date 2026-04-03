#!/bin/bash
set -uo pipefail

# Temp script to test only the previously failing bugs.

ROOT=$(dirname "$(realpath "$0")")
cd "$ROOT"

BUGS=(
    "dataset/circom/selfxyz/self/zksecurity_an_attacker_can_craft_a_fake_non_inclusion_proof_for_a_given_key_due_to_an_aliasing_bug_in_the_smt_verifier"
    "dataset/circom/selfxyz/self/zksecurity_missing_byte_range_checks_allows_packed_data_pollution"
    "dataset/circom/semaphore-protocol/semaphore/veridise_no_zero_value_validation"
    "dataset/circom/zkopru-network/zkopru/leastauthority_previously_correct_ownership_proof_disabled_via_code_changes"
    "dataset/circom/privacy-scaling-explorations/maci/hashcloak_data_are_not_fully_verified_during_state_update"
    "dataset/circom/succinctlabs/telepathy-circuits/trailofbits_prover_can_lock_user_funds_by_including_ill-formed_bigints_in_public_key_commitment"
)

pass=0; fail=0; i=0

for d in "${BUGS[@]}"; do
    i=$((i + 1))
    bugname=$(basename "$d")
    BUG_START=$(date +%s)
    echo -n "[$(date '+%H:%M:%S')] [$i/${#BUGS[@]}] Testing: $bugname ... "

    cd "$ROOT/$d"
    ./zkbugs_setup.sh 2>&1 > /dev/null

    # Compile + setup
    result=$(ZKBUGS_MODE=direct ./zkbugs_compile_setup.sh 2>&1)
    if ! echo "$result" | grep -q "EXPORT VERIFICATION KEY FINISHED"; then
        elapsed=$(( $(date +%s) - BUG_START ))
        echo "SETUP_FAIL (${elapsed}s)"
        echo "  $(echo "$result" | sed 's/\x1b\[[0-9;]*m//g' | grep -iE "error|circuit too big" | head -1)"
        fail=$((fail + 1))
        ./zkbugs_clean.sh 2>&1 > /dev/null
        cd "$ROOT"
        continue
    fi

    # Positive test
    result=$(ZKBUGS_MODE=direct ./zkbugs_positive_test.sh 2>&1)
    if echo "$result" | grep -q "OK!"; then
        elapsed=$(( $(date +%s) - BUG_START ))
        echo "PASS (${elapsed}s)"
        pass=$((pass + 1))
    else
        elapsed=$(( $(date +%s) - BUG_START ))
        echo "TEST_FAIL (${elapsed}s)"
        echo "  $(echo "$result" | sed 's/\x1b\[[0-9;]*m//g' | grep -E "Error" | head -1)"
        fail=$((fail + 1))
    fi

    ./zkbugs_clean.sh 2>&1 > /dev/null
    cd "$ROOT"
done

echo ""
echo "=== Results: PASS=$pass FAIL=$fail ==="

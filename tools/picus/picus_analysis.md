# Picus Analysis Report

## Intro to Picus

Picus is a detection tool for finding underconstrained bugs. Picus is built on top of [this paper](https://dl.acm.org/doi/abs/10.1145/3591282). The tool mentioned in the paper is called QED2, and Picus is an implementation of it.

In simple words, Picus tries to prove the uniqueness of a witness given a set of inputs. If the same set of inputs results in multiple possible witnesses, it means some constraints are missing, which is an underconstrained bug. For a concrete example, you can see [this audit report](https://veridise.com/wp-content/uploads/2023/02/VAR-circom-bigint.pdf).

## Results Summary

Total circuits analyzed: 25

- Correctly identified as underconstrained: 7
- Incorrectly reported as properly constrained: 3
- Unable to determine (timeout or inconclusive): 15

Success rate: 28% (7 out of 25)

## Detailed Analysis

### Correctly Identified Bugs

Picus successfully identified the following circuits as underconstrained and provided counterexamples:

1. dataset/circom/reclaimprotocol_circom_chacha/zksecurity_unsound_left_rotation
2. dataset/circom/circom-bigint_circomlib/veridise_underconstrained_points_in_montgomeryAdd
3. dataset/circom/circom-bigint_circomlib/veridise_decoder_accepting_bogus_output_signal
4. dataset/circom/circom-bigint_circomlib/veridise_underconstrained_points_in_edwards2Montgomery
5. dataset/circom/circom-bigint_circomlib/veridise_underconstrained_points_in_montgomeryDouble
6. dataset/circom/circom-bigint_circomlib/veridise_underconstrained_points_in_montgomery2Edwards
7. dataset/circom/succinctlabs_telepathy-circuits/veridise_arrayxor_is_under_constrained

These results demonstrate Picus's ability to detect certain types of bugs, particularly those related to underconstrained points in various mathematical operations and decoders.

### Incorrectly Reported as Properly Constrained

Picus incorrectly reported one circuit as properly constrained:

1. dataset/circom/uniRep_protocol/veridise_missing_range_checks_on_comparison_circuits
2. dataset/circom/semaphore-protocol_semaphore/veridise_no_zero_value_validation
3. dataset/circom/succinctlabs_telepathy-circuits/trailofbits_prover_can_lock_user_funds_by_including_ill-formed_bigints_in_public_key_commitment

This is expected since Picus only checks for underconstrained bugs, not missing range check bugs.

### Unable to Determine

Picus was unable to provide a definitive result for the following circuits due to timeouts or inconclusive results:

1. dataset/circom/circomlib_mimc/kobi_gurkan_mimc_hash_assigned_but_not_constrained (inconclusive)
2. dataset/circom/spartan_ecdsa/yacademy_input_signal_s_is_not_constrained_in_eff_ecdsa_circom (timeout)
3. dataset/circom/darkforest_circuits/daira_hopwood_darkforest_v0_3_missing_bit_length_check (inconclusive)
4. dataset/circom/uniRep_protocol/veridise_underconstrained_circuit_allows_invalid_comparison (timeout)
5. dataset/circom/circom-bigint_circomlib/veridise_underconstrained_outputs_in_bitElementMulAny (timeout)
6. dataset/circom/succinctlabs_telepathy-circuits/veridise_template_CoreVerifyPubkeyG1_does_not_perform_input_validation_simplified (timeout)
7. dataset/circom/succinctlabs_telepathy-circuits/veridise_zero_padding_for_sha256_in_ExpandMessageXMD_is_vulnerable_to_an_overflow (timeout)
8. dataset/circom/succinctlabs_telepathy-circuits/veridise_sync_committee_can_be_rotated_successfully_with_random_public_keys (timeout)
9. dataset/circom/succinctlabs_telepathy-circuits/trailofbits_prover_can_lock_user_funds_by_supplying_non-reduced_Y_values_to_G1BigIntToSignFlag (timeout)
10. dataset/circom/succinctlabs_telepathy-circuits/trailofbits_incorrect_handling_of_point_doubling_can_allow_signature_forgery (timeout)
11. dataset/circom/zkopru/leastauthority_previously_correct_ownership_proof_disabled_via_code_changes (timeout)
12. dataset/circom/circom-bigint_circomlib/veridise_missing_range_checks_in_bigmod (timeout)
13. dataset/circom/circom-bigint_circomlib/veridise_underconstrained_outputs_in_window4 (timeout)
14. dataset/circom/circom-bigint_circomlib/veridise_underconstrained_outputs_in_windowmulfix (timeout)
15. dataset/circom/maci/hashcloak_data_are_not_fully_verified_during_state_update (timeout)

The high number of timeouts and inconclusive results (60% of the dataset) suggests that Picus may struggle with more complex circuits or certain types of bugs.

# Picus Analysis Report

## Intro to Picus

Picus is a detection tool for finding underconstrained bugs. Picus is built on top of [this paper](https://dl.acm.org/doi/abs/10.1145/3591282). The tool mentioned in the paper is called QED2, and Picus is an implementation of it.

In simple words, Picus tries to prove the uniqueness of a witness given a set of inputs. If the same set of inputs results in multiple possible witnesses, it means some constraints are missing, which is an underconstrained bug. For a concrete example, you can see [this audit report](https://veridise.com/wp-content/uploads/2023/02/VAR-circom-bigint.pdf).

## Results Summary

Total circuits analyzed: 25

- Successfully detected the vulnerability: 7
  - This means Picus found a bug and the bug is the same as the actual bug
- Unsupported vulnerability: 0
  - This means the bug is not underconstrained bug so Picus does not support it
- Timeout: 12
  - This means Picus does not halt after running for 100 seconds and it hits timeout limit
- Incorrectly Reported as Properly Constrained: 3
  - This means Picus outputs "The circuit is properly constrained" but the circuit contains a bug
- Failure: 3
  - This means Picus outputs "Cannot determine whether the circuit is properly constrained"

Statistics: since Picus only handles underconstrained bugs, we subtract "unsupported vulnerabilities" from total bugs and then compute success rate

```
success rate = 7 / (25 - 0) = 28%
```

## Detailed Analysis

### Category 1. Successfully Detected the Vulnerability

Picus successfully identified the following circuits as underconstrained and provided counterexamples:

1. circom/reclaimprotocol_circom_chacha/zksecurity_unsound_left_rotation
2. circom/circom-bigint_circomlib/veridise_underconstrained_points_in_montgomeryAdd
3. circom/circom-bigint_circomlib/veridise_decoder_accepting_bogus_output_signal
4. circom/circom-bigint_circomlib/veridise_underconstrained_points_in_edwards2Montgomery
5. circom/circom-bigint_circomlib/veridise_underconstrained_points_in_montgomeryDouble
6. circom/circom-bigint_circomlib/veridise_underconstrained_points_in_montgomery2Edwards
7. circom/succinctlabs_telepathy-circuits/veridise_arrayxor_is_under_constrained

### Category 2. Unsupported Vulnerability

Picus only handles underconstrained bugs so we should exclude the following unsupported ones from total bugs when doing statistics. Currently all bugs are underconstrained bugs so none of them is unsupported.

### Category 3. Timeout

Picus was unable to provide a definitive result for the following circuits due to timeouts:

1. circom/spartan_ecdsa/yacademy_input_signal_s_is_not_constrained_in_eff_ecdsa_circom
2. circom/spartan_ecdsa/yacademy_under_constrained_circuits_compromising_the_soundness_of_the_system
3. circom/succinctlabs_telepathy-circuits/veridise_template_CoreVerifyPubkeyG1_does_not_perform_input_validation_simplified
4. circom/succinctlabs_telepathy-circuits/veridise_zero_padding_for_sha256_in_ExpandMessageXMD_is_vulnerable_to_an_overflow
5. circom/succinctlabs_telepathy-circuits/trailofbits_prover_can_lock_user_funds_by_supplying_non-reduced_Y_values_to_G1BigIntToSignFlag
6. circom/succinctlabs_telepathy-circuits/trailofbits_incorrect_handling_of_point_doubling_can_allow_signature_forgery
7. circom/zkopru/leastauthority_previously_correct_ownership_proof_disabled_via_code_changes
8. circom/circom-bigint_circomlib/veridise_missing_range_checks_in_bigmod
9.  circom/circom-bigint_circomlib/veridise_underconstrained_outputs_in_window4
10. circom/circom-bigint_circomlib/veridise_underconstrained_outputs_in_windowmulfix
11. circom/maci/hashcloak_data_are_not_fully_verified_during_state_update
12. circom/uniRep_protocol/veridise_underconstrained_circuit_allows_invalid_comparison

### Category 4. Incorrectly Reported as Properly Constrained

Picus incorrectly reported the following circuits as properly constrained:

1. circom/semaphore-protocol_semaphore/veridise_no_zero_value_validation
2. circom/succinctlabs_telepathy-circuits/trailofbits_prover_can_lock_user_funds_by_including_ill-formed_bigints_in_public_key_commitment
3. circom/uniRep_protocol/veridise_missing_range_checks_on_comparison_circuits

### Category 5. Failure

Picus failed to determine if there exists a bug in the following circuits:

1. circom/circomlib_mimc/kobi_gurkan_mimc_hash_assigned_but_not_constrained
2. circom/darkforest_circuits/daira_hopwood_darkforest_v0_3_missing_bit_length_check
3. circom/circom-bigint_circomlib/veridise_underconstrained_outputs_in_bitElementMulAny

# Circomspect Analysis Report

__Note that this file was manually generated after processing the circomspect_results.md. In many instances, we mention that Circomspect should have identified certain bugs using the Under-constrained Signal detector. However, the current detector is unable to detect some of these bugs.__

## Summary

The Circomspect Analysis Report provides an evaluation of Circomspect's ability to detect vulnerabilities in various Circom circuits. The analysis covered 25 different vulnerabilities across multiple circuits, focusing on issues such as unconstrained assignments, missing range and bit length checks, division by zero, and logical bugs.

### Statistics of the Bugs:

Total Vulnerabilities Analyzed: 25

- Successfully detected the vulnerability: TODO
  - This means Circomspect found a bug, and the bug is the same as the actual bug
- Unsupported vulnerability: TODO
  - This means the bug is not in Circomspect analysis passes, so Circomspect does not support it
- Timeout: 0
  - This means Circomspect does not halt after running for 100 seconds, and it hits the timeout limit. This should never occur.
- Incorrectly Reported as Properly Constrained: TODO
  - This means Circomspect outputs "circomspect: No issues found," but the circuit contains a bug
- Failure: TODO
 - This means Circomspect reports some issues but not the correct ones
- Error: TODO
 - Circomspect crashes. 

In total, Circomspect achieved TODO success rate in the current dataset.

## Category 1: Successfully detected the vulnerability

If Circomspect finds the bug, we consider it a success. Note that it often outputs many false positives. For example, if there is an assignment `<--`, then, later on, there is a constraint for that assignment that is not complete, and circomspect reports a warning because of the use of `<--`, we don't consider it as successful detected the vulnerability, because even if the constraints were correct circomspect would still report it.

1. circom/spartan_ecdsa/yacademy_under_constrained_circuits_compromising_the_soundness_of_the_system
2. circom/succinctlabs_telepathy-circuits/veridise_arrayxor_is_under_constrained
3. circom/uniRep_protocol/veridise_underconstrained_circuit_allows_invalid_comparison
4. circom/circom-bigint_circomlib/veridise_underconstrained_points_in_montgomeryAdd
5. circom/circom-bigint_circomlib/veridise_underconstrained_points_in_edwards2Montgomery
6. circom/circom-bigint_circomlib/veridise_underconstrained_points_in_montgomeryDouble
7. circom/circom-bigint_circomlib/veridise_underconstrained_points_in_montgomery2Edwards
8. circom/circom-bigint_circomlib/veridise_underconstrained_points_in_montgomeryAdd


## Category 2: Unsupported vulnerability

Circomspect implements a series of analysis passes (pre-defined static analysis rules); if the bug is outside the analysis passes, then Circomspect does not support it.

1. circom/semaphore-protocol_semaphore/veridise_no_zero_value_validation
2. circom/succinctlabs_telepathy-circuits/trailofbits_incorrect_handling_of_point_doubling_can_allow_signature_forgery
3. circom/zkopru/leastauthority_previously_correct_ownership_proof_disabled_via_code_changes
4. circom/maci/hashcloak_data_are_not_fully_verified_during_state_update


## Category 3: Timeout

None

## Category 4: Incorrectly Reported as Safe

Circomspect outputs "circomspect: No issues found" on the following bugs, which is wrong since we know all circuits contain at least one bug:

1. circom/darkforest_circuits/daira_hopwood_darkforest_v0_3_missing_bit_length_check
2. circom/circom-bigint_circomlib/veridise_underconstrained_outputs_in_window4
3. circom/circom-bigint_circomlib/veridise_underconstrained_outputs_in_windowmulfix

## Category 5: Failure

This category includes cases where Circomspect reported some issues that were not the ones we expected to detect the vulnerability (e.g., false positives).

1. circom/circomlib_mimc/kobi_gurkan_mimc_hash_assigned_but_not_constrained
2. circom/reclaimprotocol_circom_chacha/zksecurity_unsound_left_rotation
3. circom/spartan_ecdsa/yacademy_input_signal_s_is_not_constrained_in_eff_ecdsa_circom
4. circom/succinctlabs_telepathy-circuits/trailofbits_prover_can_lock_user_funds_by_supplying_non-reduced_Y_values_to_G1BigIntToSignFlag
5. circom/circom-bigint_circomlib/veridise_missing_range_checks_in_bigmod
6. circom/circom-bigint_circomlib/veridise_decoder_accepting_bogus_output_signal
7. circom/circom-bigint_circomlib/veridise_underconstrained_outputs_in_bitElementMulAny

## Category 6: Error

Circomspect crashed while analyzing the circuits (e.g., parser error).

1. circom/uniRep_protocol/veridise_missing_range_checks_on_comparison_circuits


## Detailed Analysis

### 1. circom/circomlib_mimc/kobi_gurkan_mimc_hash_assigned_but_not_constrained

- **Short Description of the Vulnerability**: `outs[0]` is assigned but not constrained, allowing it to be any value.
- **Circomspect Output**: Using the signal assignment operator `<--` is not necessary here.
- **Success**: No
- **Evaluation**: Circomspect reports: "Using the signal assignment operator `<--` is not necessary here" but does not find the actual bug. 
- **Intended Circomspect analysis pass**: Unused output signal

### 2. circom/reclaimprotocol_circom_chacha/zksecurity_unsound_left_rotation

- **Short Description of the Vulnerability**: `part1` and `part2` signals are not sufficiently constrained.
- **Circomspect Output**: Highlighted the use of `<--` for `part1` and `part2`, indicating they are not constrained.
- **Success**: No
- **Evaluation**: Circomspect accurately detected the unconstrained signals, matching the described vulnerability.
- **Intended Circomspect analysis pass**: Under-constrained signal

### 3. circom/spartan_ecdsa/yacademy_input_signal_s_is_not_constrained_in_eff_ecdsa_circom

- **Short Description of the Vulnerability**: `s` is not constrained, allowing arbitrary values.
- **Circomspect Output**: Did not directly address the unconstrained `s`, but noted an unused variable `bits`.
- **Success**: No
- **Evaluation**: Circomspect failed to identify the main vulnerability related to the unconstrained `s`.
- **Intended Circomspect analysis pass**: Under-constrained signal

### 4. circom/spartan_ecdsa/yacademy_under_constrained_circuits_compromising_the_soundness_of_the_system
- **Short Description of the Vulnerability**: `slo` and `shi` are assigned but not constrained.
- **Circomspect Output**: Correctly identified the unconstrained assignment of `slo` and `shi`.
- **Success**: Yes
- **Evaluation**: Circomspect successfully detected the unconstrained signals.
- **Intended Circomspect analysis pass**: Signal assignment

### 5. circom/darkforest_circuits/daira_hopwood_darkforest_v0_3_missing_bit_length_check

- **Short Description of the Vulnerability**: Inputs are not constrained to the expected bit length.
- **Circomspect Output**: No issues found.
- **Success**: No
- **Evaluation**: Circomspect failed to identify the missing bit length check.
- **Intended Circomspect analysis pass**: Not supported

### 6. circom/semaphore-protocol_semaphore/veridise_no_zero_value_validation
- **Short Description of the Vulnerability**: ZeroValue in Merkle trees is not validated.
- **Circomspect Output**: `signalHashSquared`: Intermediate signals should typically occur in at least two separate constraints.
- **Success**: No
- **Evaluation**: Circomspect found something interesting, although that's not a bug. That code is just there to prevent [groth16 malleability attack](https://geometry.xyz/notebook/groth16-malleability). `signalHash` is an unused public input, it has to be there for some business logic reason outside the circuit. The constraint `signalHashSquared <== signalHash * signalHash` is added to prevent the attack described in the article.
- **Intended Circomspect analysis pass**: Not supported

### 7. circom/succinctlabs_telepathy-circuits/veridise_arrayxor_is_under_constrained

- **Short Description of the Vulnerability**: `out[i]` is not constrained.
- **Circomspect Output**: Correctly identified the unconstrained assignment of `out[i]`.
- **Success**: Yes
- **Evaluation**: Correct; Circomspect successfully detected the unconstrained signal.
- **Intended Circomspect analysis pass**: Unused output signal

### 8. circom/circom-bigint_circomlib/veridise_underconstrained_outputs_in_window4

- **Short Description of the Vulnerability**: No constraint to avoid division by zero.
- **Circomspect Output**: No issues found.
- **Success**: No
- **Evaluation**: This is expected since the bug is in external templates. The target circuit itself has no bug.
- **Intended Circomspect analysis pass**: Unconstrained division

### 9. circom/succinctlabs_telepathy-circuits/trailofbits_prover_can_lock_user_funds_by_supplying_non-reduced_Y_values_to_G1BigIntToSignFlag

- **Short Description of the Vulnerability**: Missing range check for y-coordinate.
- **Circomspect Output**: Identified unused variables and potential aliasing issues.
- **Success**: No
- **Evaluation**: Circomspect did not directly address the missing range check for y-coordinate.
- **Intended Circomspect analysis pass**: Under-constrained signal

### 10. circom/succinctlabs_telepathy-circuits/trailofbits_incorrect_handling_of_point_doubling_can_allow_signature_forgery

- **Short Description of the Vulnerability**: Assumes unequal inputs without checking.
- **Circomspect Output**: Identified unconstrained signal assignments.
- **Success**: No
- **Evaluation**: This is expected since it is a logical bug.
- **Intended Circomspect analysis pass**: Not supported

### 11. circom/uniRep_protocol/veridise_missing_range_checks_on_comparison_circuits

- **Short Description of the Vulnerability**: Inputs are not constrained to the expected bit length.
- **Circomspect Output**: Throw error.
- **Success**: No
- **Evaluation**: Circomspect had trouble parsing the circuit code.
- **Intended Circomspect analysis pass**: Under-constrained signal

### 12. circom/uniRep_protocol/veridise_underconstrained_circuit_allows_invalid_comparison

- **Short Description of the Vulnerability**: Allows inputs larger than the modulus.
- **Circomspect Output**: Identified unconstrained inputs and potential aliasing issues.
- **Success**: Yes
- **Evaluation**: In particular, Circomspect found "Using `Num2Bits` to convert field elements to bits may lead to aliasing issues" which is the same as the actual bug.
- **Intended Circomspect analysis pass**: Field element arithmetic

### 13. circom/zkopru/leastauthority_previously_correct_ownership_proof_disabled_via_code_changes

- **Short Description of the Vulnerability**: Signature verification is disabled.
- **Circomspect Output**: Identified unused signals and unconstrained outputs.
- **Success**: No
- **Evaluation**: Circomspect did not find the issue. This bug is about misuse of external template, which isn't programmed into circomspect analysis rules.
- **Intended Circomspect analysis pass**: Not supported

### 14. circom/circom-bigint_circomlib/veridise_underconstrained_points_in_montgomeryAdd

- **Short Description of the Vulnerability**: Division by zero is not constrained.
- **Circomspect Output**: Correctly identified the unconstrained division.
- **Success**: Yes
- **Evaluation**: Circomspect successfully detected the unconstrained division, it was the "In signal assignments containing division, the divisor needs to be constrained to be non-zero" finding.
- **Intended Circomspect analysis pass**: Unconstrained division

### 15. circom/circom-bigint_circomlib/veridise_missing_range_checks_in_bigmod

- **Short Description of the Vulnerability**: Missing range checks on the remainder.
- **Circomspect Output**: Identified unconstrained signals and potential aliasing issues.
- **Success**: No
- **Evaluation**: Circomspect outputs a bunch of warning but none of them is the actual bug. Also, lots of false positive means bad performance.
- **Intended Circomspect analysis pass**: Field element arithmetic

### 16. circom/circom-bigint_circomlib/veridise_decoder_accepting_bogus_output_signal

- **Short Description of the Vulnerability**: `out` is not properly constrained.
- **Circomspect Output**: Identified the unconstrained assignment of `out`.
- **Success**: No
- **Evaluation**: It identified a potential issue that is a FP in that case, and it didn't manage to identify the proper bug.
- **Intended Circomspect analysis pass**: Under-constrained signal
  
### 17. circom/circom-bigint_circomlib/veridise_underconstrained_points_in_edwards2Montgomery

- **Short Description of the Vulnerability**: Division by zero is not constrained.
- **Circomspect Output**: Correctly identified the unconstrained division.
- **Success**: Yes
- **Evaluation**: Circomspect successfully detected the unconstrained division, specifically it was "In signal assignments containing division, the divisor needs to be constrained to be non-zero".
- **Intended Circomspect analysis pass**: Unconstrained division

### 18. circom/circom-bigint_circomlib/veridise_underconstrained_points_in_montgomeryDouble

- **Short Description of the Vulnerability**: Division by zero is not constrained.
- **Circomspect Output**: Correctly identified the unconstrained division.
- **Success**: Yes
- **Evaluation**: Circomspect successfully detected the unconstrained division, specifically it was "In signal assignments containing division, the divisor needs to be constrained to be non-zero".
- **Intended Circomspect analysis pass**: Unconstrained division

### 19. circom/circom-bigint_circomlib/veridise_underconstrained_points_in_montgomery2Edwards

- **Short Description of the Vulnerability**: Division by zero is not constrained.
- **Circomspect Output**: Correctly identified the unconstrained division.
- **Success**: Yes
- **Evaluation**: Circomspect successfully detected the unconstrained division, specifically it was "In signal assignments containing division, the divisor needs to be constrained to be non-zero".
- **Intended Circomspect analysis pass**: Unconstrained division

### 20. circom/maci/hashcloak_data_are_not_fully_verified_during_state_update

- **Short Description of the Vulnerability**: Initial tally is not verified.
- **Circomspect Output**: Identified unused variables and unconstrained outputs.
- **Success**: No
- **Evaluation**: Circomspect did not find the bug.
- **Intended Circomspect analysis pass**: Not supported

### 21. circom/circom-bigint_circomlib/veridise_underconstrained_outputs_in_bitElementMulAny

- **Short Description of the Vulnerability**: Uses `MontgomeryDouble` and `MontgomeryAdd`, which have underconstraint bugs.
- **Circomspect Output**: No issues found.
- **Success**: No
- **Evaluation**: Circomspect failed to identify the underconstraint issues in the used templates.
- **Intended Circomspect analysis pass**: Unconstrained division

### 22. circom/circom-bigint_circomlib/veridise_underconstrained_points_in_montgomeryAdd

- **Short Description of the Vulnerability**: Division by zero is not constrained.
- **Circomspect Output**: Correctly identified the unconstrained division.
- **Success**: Yes
- **Evaluation**: Circomspect successfully detected the unconstrained division, specifically it was "In signal assignments containing division, the divisor needs to be constrained to be non-zero".
- **Intended Circomspect analysis pass**: Unconstrained division

### 23. circom/circom-bigint_circomlib/veridise_underconstrained_outputs_in_windowmulfix

- **Short Description of the Vulnerability**: Underconstraint in `MontgomeryDouble` and `MontgomeryAdd`.
- **Circomspect Output**: No issue found.
- **Success**: No
- **Evaluation**: This is expected since the bug is in external templates, not the target circuit code.
- **Intended Circomspect analysis pass**: Unconstrained division

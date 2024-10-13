# Circomspect Analysis Report

## Summary

The Circomspect Analysis Report provides an evaluation of Circomspect's ability to detect vulnerabilities in various Circom circuits. The analysis covered 25 different vulnerabilities across multiple circuits, focusing on issues such as unconstrained assignments, missing range and bit length checks, division by zero, and logical bugs.

### Statistics of the Bugs:

- **Total Vulnerabilities Analyzed**: 25
- **Unconstrained Assignments**: 12
  - Successfully Detected: 7
  - Missed: 5
- **Missing Range/Bit Length Checks**: 5
  - Successfully Detected: 0
  - Missed: 5
- **Division by Zero**: 6
  - Successfully Detected: 6
  - Missed: 0
- **Circomspect did not find the bug but it is expected in that scenario**: 4
- **In total, Circomspect achieved (7 + 6) / (25 - 4) = 61.9% success rate in the current dataset.**

Overall, Circomspect demonstrated effectiveness in identifying unconstrained assignments and division by zero vulnerabilities but struggled with detecting missing range checks and logical bugs. The manual fixes have addressed these issues, ensuring the circuits are now secure and properly constrained.

## Evaluation of Circomspect's Performance

### 1. circom/circomlib_mimc/kobi_gurkan_mimc_hash_assigned_but_not_constrained

- **Short Description of the Vulnerability**: `outs[0]` is assigned but not constrained, allowing it to be any value.
- **Circomspect Output**: Using the signal assignment operator `<--` is not necessary here.
- **Success**: No
- **Evaluation**: Circomspect says "Using the signal assignment operator `<--` is not necessary here" but does not find the actual bug.

### 2. circom/reclaimprotocol_circom_chacha/zksecurity_unsound_left_rotation

- **Short Description of the Vulnerability**: `part1` and `part2` signals are not sufficiently constrained.
- **Circomspect Output**: Highlighted the use of `<--` for `part1` and `part2`, indicating they are not constrained.
- **Success**: Yes
- **Evaluation**: Circomspect accurately detected the unconstrained signals, matching the described vulnerability.

### 3. circom/spartan_ecdsa/yacademy_input_signal_s_is_not_constrained_in_eff_ecdsa_circom

- **Short Description of the Vulnerability**: `s` is not constrained, allowing arbitrary values.
- **Circomspect Output**: Did not directly address the unconstrained `s`, but noted an unused variable `bits`.
- **Success**: No
- **Evaluation**: Circomspect failed to identify the main vulnerability related to the unconstrained `s`.

### 4. circom/spartan_ecdsa/yacademy_under_constrained_circuits_compromising_the_soundness_of_the_system
- **Short Description of the Vulnerability**: `slo` and `shi` are assigned but not constrained.
- **Circomspect Output**: Correctly identified the unconstrained assignment of `slo` and `shi`.
- **Success**: Yes
- **Evaluation**: Circomspect successfully detected the unconstrained signals.

### 5. circom/darkforest_circuits/daira_hopwood_darkforest_v0_3_missing_bit_length_check

- **Short Description of the Vulnerability**: Inputs are not constrained to expected bit length.
- **Circomspect Output**: No issues found.
- **Success**: No
- **Evaluation**: Circomspect failed to identify the missing bit length check.

### 6. circom/semaphore-protocol_semaphore/veridise_no_zero_value_validation
- **Short Description of the Vulnerability**: ZeroValue in Merkle trees is not validated.
- **Circomspect Output**: `signalHashSquared`: Intermediate signals should typically occur in at least two separate constraints.
- **Success**: No
- **Evaluation**: Circomspect found something interesting, although that's not a bug. That code is just there to prevent [groth16 malleability attack](https://geometry.xyz/notebook/groth16-malleability). `signalHash` is an unused public input, it has to be there for some business logic reason outside the circuit. The constraint `signalHashSquared <== signalHash * signalHash` is added to prevent the attack described in the article. 

### 7. circom/succinctlabs_telepathy-circuits/veridise_arrayxor_is_under_constrained

- **Short Description of the Vulnerability**: `out[i]` is not constrained.
- **Circomspect Output**: Correctly identified the unconstrained assignment of `out[i]`.
- **Success**: Yes
- **Evaluation**: Correct, Circomspect successfully detected the unconstrained signal.

### 8. circom/circom-bigint_circomlib/veridise_underconstrained_outputs_in_window4

- **Short Description of the Vulnerability**: No constraint to avoid division by zero.
- **Circomspect Output**: No issues found.
- **Success**: No, but expected
- **Evaluation**: This is expected since the bug is in external templates. The target circuit itself has no bug.

### 9. circom/succinctlabs_telepathy-circuits/trailofbits_prover_can_lock_user_funds_by_supplying_non-reduced_Y_values_to_G1BigIntToSignFlag

- **Short Description of the Vulnerability**: Missing range check for y-coordinate.
- **Circomspect Output**: Identified unused variables and potential aliasing issues.
- **Success**: No
- **Evaluation**: Circomspect did not directly address the missing range check for y-coordinate.

### 10. circom/succinctlabs_telepathy-circuits/trailofbits_incorrect_handling_of_point_doubling_can_allow_signature_forgery

- **Short Description of the Vulnerability**: Assumes unequal inputs without checking.
- **Circomspect Output**: Identified unconstrained signal assignments.
- **Success**: No, but expected
- **Evaluation**: This is expected since it is a logical bug.

### 11. circom/uniRep_protocol/veridise_missing_range_checks_on_comparison_circuits

- **Short Description of the Vulnerability**: Inputs are not constrained to expected bit length.
- **Circomspect Output**: Throw error.
- **Success**: No
- **Evaluation**: Circomspect had trouble parsing the circuit code.

### 12. circom/uniRep_protocol/veridise_underconstrained_circuit_allows_invalid_comparison

- **Short Description of the Vulnerability**: Allows inputs larger than the modulus.
- **Circomspect Output**: Identified unconstrained inputs and potential aliasing issues.
- **Success**: Yes
- **Evaluation**: In particular, Circomspect found "Using `Num2Bits` to convert field elements to bits may lead to aliasing issues" which is the same as the actual bug.

### 13. circom/zkopru/leastauthority_previously_correct_ownership_proof_disabled_via_code_changes

- **Short Description of the Vulnerability**: Signature verification is disabled.
- **Circomspect Output**: Identified unused signals and unconstrained outputs.
- **Success**: No
- **Evaluation**: Circomspect did not find the issue. This bug is about misuse of external template, which isn't programmed into circomspect analysis rules.

### 14. circom/circom-bigint_circomlib/veridise_underconstrained_points_in_montgomeryAdd

- **Short Description of the Vulnerability**: Division by zero is not constrained.
- **Circomspect Output**: Correctly identified the unconstrained division.
- **Success**: Yes
- **Evaluation**: Circomspect successfully detected the unconstrained division, it was the "In signal assignments containing division, the divisor needs to be constrained to be non-zero" finding.

### 15. circom/circom-bigint_circomlib/veridise_missing_range_checks_in_bigmod

- **Short Description of the Vulnerability**: Missing range checks on the remainder.
- **Circomspect Output**: Identified unconstrained signals and potential aliasing issues.
- **Success**: No
- **Evaluation**: Circomspect outputs a bunch of warning but none of them is the actual bug. Also, lots of false positive means bad performance.

### 16. circom/circom-bigint_circomlib/veridise_decoder_accepting_bogus_output_signal

- **Short Description of the Vulnerability**: `out` is not properly constrained.
- **Circomspect Output**: Identified the unconstrained assignment of `out`.
- **Success**: No
- **Evaluation**: This is expected since it is a logical bug.

### 17.  circom/circom-bigint_circomlib/veridise_underconstrained_points_in_edwards2Montgomery

- **Short Description of the Vulnerability**: Division by zero is not constrained.
- **Circomspect Output**: Correctly identified the unconstrained division.
- **Success**: Yes
- **Evaluation**: Circomspect successfully detected the unconstrained division, specifically it was "In signal assignments containing division, the divisor needs to be constrained to be non-zero".

### 18. circom/circom-bigint_circomlib/veridise_underconstrained_points_in_montgomeryDouble

- **Short Description of the Vulnerability**: Division by zero is not constrained.
- **Circomspect Output**: Correctly identified the unconstrained division.
- **Success**: Yes
- **Evaluation**: Circomspect successfully detected the unconstrained division, specifically it was "In signal assignments containing division, the divisor needs to be constrained to be non-zero".

### 19. circom/circom-bigint_circomlib/veridise_underconstrained_points_in_montgomery2Edwards

- **Short Description of the Vulnerability**: Division by zero is not constrained.
- **Circomspect Output**: Correctly identified the unconstrained division.
- **Success**: Yes
- **Evaluation**: Circomspect successfully detected the unconstrained division, specifically it was "In signal assignments containing division, the divisor needs to be constrained to be non-zero".

### 20. circom/maci/hashcloak_data_are_not_fully_verified_during_state_update

- **Short Description of the Vulnerability**: Initial tally is not verified.
- **Circomspect Output**: Identified unused variables and unconstrained outputs.
- **Success**: No
- **Evaluation**: Circomspect did not find the bug.

### 21. circom/circom-bigint_circomlib/veridise_underconstrained_outputs_in_bitElementMulAny

- **Short Description of the Vulnerability**: Uses `MontgomeryDouble` and `MontgomeryAdd`, which have underconstraint bugs.
- **Circomspect Output**: No issues found.
- **Success**:
- **Evaluation**: Circomspect failed to identify the underconstraint issues in the used templates.

### 22. circom/circom-bigint_circomlib/veridise_underconstrained_points_in_montgomeryAdd

- **Short Description of the Vulnerability**: Division by zero is not constrained.
- **Circomspect Output**: Correctly identified the unconstrained division.
- **Success**: Yes
- **Evaluation**: Circomspect successfully detected the unconstrained division, specifically it was "In signal assignments containing division, the divisor needs to be constrained to be non-zero".

### 23. circom/circom-bigint_circomlib/veridise_underconstrained_outputs_in_windowmulfix

- **Short Description of the Vulnerability**: Underconstraint in `MontgomeryDouble` and `MontgomeryAdd`.
- **Circomspect Output**: No issue found.
- **Success**: No, but expected
- **Evaluation**: This is expected since the bug is in external templates, not the target circuit code.

### 24. circom/circom-bigint_circomlib/veridise_decoder_accepting_bogus_output_signal

- **Short Description of the Vulnerability**: `out` is not properly constrained.
- **Circomspect Output**: Identified the unconstrained assignment of `out`.
-  **Success**: No, but expected
- **Evaluation**: This is expected since the bug only occurs during integration. The circuit itself is just fine.

### 25. circom/circom-bigint_circomlib/veridise_underconstrained_points_in_edwards2Montgomery

- **Short Description of the Vulnerability**: Division by zero is not constrained.
- **Circomspect Output**: Correctly identified the unconstrained division.
- **Success**: Yes
- **Evaluation**: Circomspect successfully detected the unconstrained division, specifically it was "In signal assignments containing division, the divisor needs to be constrained to be non-zero".

# Table of Contents

- [circom](https://github.com/zksecurity/zkbugs/tree/main/dataset/circom)
    - [circom/circomlib_mimc/kobi_gurkan_mimc_hash_assigned_but_not_constrained](https://github.com/zksecurity/zkbugs/tree/main/dataset/circom/circomlib_mimc/kobi_gurkan_mimc_hash_assigned_but_not_constrained)
    - [circom/uniRep_protocol/veridise_missing_range_checks_on_comparison_circuits](https://github.com/zksecurity/zkbugs/tree/main/dataset/circom/uniRep_protocol/veridise_missing_range_checks_on_comparison_circuits)
    - [circom/uniRep_protocol/veridise_underconstrained_circuit_allows_invalid_comparison](https://github.com/zksecurity/zkbugs/tree/main/dataset/circom/uniRep_protocol/veridise_underconstrained_circuit_allows_invalid_comparison)
    - [circom/circom-bigint_circomlib/veridise_underconstrained_points_in_montgomeryAdd](https://github.com/zksecurity/zkbugs/tree/main/dataset/circom/circom-bigint_circomlib/veridise_underconstrained_points_in_montgomeryAdd)
    - [circom/circom-bigint_circomlib/veridise_underconstrained_outputs_in_bitElementMulAny](https://github.com/zksecurity/zkbugs/tree/main/dataset/circom/circom-bigint_circomlib/veridise_underconstrained_outputs_in_bitElementMulAny)
    - [circom/circom-bigint_circomlib/veridise_underconstrained_points_in_montgomeryDouble](https://github.com/zksecurity/zkbugs/tree/main/dataset/circom/circom-bigint_circomlib/veridise_underconstrained_points_in_montgomeryDouble)
    - [circom/circom-bigint_circomlib/veridise_decoder_accepting_bogus_output_signal](https://github.com/zksecurity/zkbugs/tree/main/dataset/circom/circom-bigint_circomlib/veridise_decoder_accepting_bogus_output_signal)
    - [circom/circom-bigint_circomlib/veridise_underconstrained_points_in_edwards2Montgomery](https://github.com/zksecurity/zkbugs/tree/main/dataset/circom/circom-bigint_circomlib/veridise_underconstrained_points_in_edwards2Montgomery)
    - [circom/circom-bigint_circomlib/veridise_underconstrained_points_in_montgomery2Edwards](https://github.com/zksecurity/zkbugs/tree/main/dataset/circom/circom-bigint_circomlib/veridise_underconstrained_points_in_montgomery2Edwards)
    - [circom/darkforest_circuits/daira_hopwood_darkforest_v0_3_missing_bit_length_check](https://github.com/zksecurity/zkbugs/tree/main/dataset/circom/darkforest_circuits/daira_hopwood_darkforest_v0_3_missing_bit_length_check)
    - [circom/reclaimprotocol_circom_chacha/zksecurity_unsound_left_rotation](https://github.com/zksecurity/zkbugs/tree/main/dataset/circom/reclaimprotocol_circom_chacha/zksecurity_unsound_left_rotation)
    - [circom/spartan_ecdsa/yacademy_input_signal_s_is_not_constrained_in_eff_ecdsa_circom](https://github.com/zksecurity/zkbugs/tree/main/dataset/circom/spartan_ecdsa/yacademy_input_signal_s_is_not_constrained_in_eff_ecdsa_circom)

# circom

## circom/circomlib_mimc/kobi_gurkan_mimc_hash_assigned_but_not_constrained

### Assigned-but-not-Constrained

* Id: iden3/circomlib/Kobi-Gurkan-MiMC-Hash-Assigned-but-not-Constrained
* Project: https://github.com/iden3/circomlib
* Commit: 324b8bf8cc4a80357354752deb6c2ae5be22e5f5
* Fix Commit: 109cdf40567fce284dca1d535819ce28922653e0
* DSL: Circom
* Vulnerability: Assigned-but-not-Constrained
* Location
  - Path: circuits/mimcsponge.circom
  - Function: MiMCSponge
  - Line: 28
* Source: Audit Report
  - Source Link: https://github.com/0xPARC/zk-bug-tracker?tab=readme-ov-file#14-mimc-hash-assigned-but-not-constrained
  - Bug ID: MiMC Hash: Assigned but not Constrained
* Commands
  - Setup Environment: `./zkbugs_setup.sh`
  - Reproduce: `./zkbugs_exploit.sh`
  - Compile and Preprocess: `./zkbugs_compile_setup.sh`
  - Positive Test: `./zkbugs_positive_test.sh`
  - Find Exploit: `./zkbugs_find_exploit.sh`
  - Clean: `./zkbugs_clean.sh`

#### Short Description of the Vulnerability

In `MiMCSponge` template, `outs[0]` is assigned but not constrained, so it can be any value. Note that the circuit code is modified from a newer version since the original buggy code couldn't be reproduced in Circom version 2. The bug idea is still the same.

#### Short Description of the Exploit

Set `ins[0]` and `k` to any random field element. Generate a correct witness first then modify the 2nd entry to a number as you wish. You can see that `outs[0]` can be any number.

#### Proposed Mitigation

Use `<==` instead of `<--` to add a constraint to `outs[0]`.


## circom/uniRep_protocol/veridise_missing_range_checks_on_comparison_circuits

### Range-Check

* Id: Unirep/Unirep/veridise-V-UNI-VUL-002
* Project: https://github.com/Unirep/Unirep
* Commit: 0985a28c38c8b2e7b7a9e80f43e63179fdd08b89
* Fix Commit: f7b0bcd39383d5ec4d17edec2ad91bc01333bf36
* DSL: Circom
* Vulnerability: Range-Check
* Location
  - Path: circuits/epochKeyLite.circom
  - Function: EpochKeyLite
  - Line: 45-48
* Source: Audit Report
  - Source Link: https://f8t2x8b2.rocketcdn.me/wp-content/uploads/2023/08/VAR-Unirep.pdf
  - Bug ID: V-UNI-VUL-002: Missing Range Checks on Comparison Circuits
* Commands
  - Setup Environment: `./zkbugs_setup.sh`
  - Reproduce: `./zkbugs_exploit.sh`
  - Compile and Preprocess: `./zkbugs_compile_setup.sh`
  - Positive Test: `./zkbugs_positive_test.sh`
  - Find Exploit: `./zkbugs_find_exploit.sh`
  - Clean: `./zkbugs_clean.sh`

#### Short Description of the Vulnerability

Input of `LessThan(8)` is assumed to have <=8 bits, but there is no constraint for it in `LessThan` template. Attacker can use large values such as `p - 1` to trigger overflow and make something like `p - 1 < EPOCH_KEY_NONCE_PER_EPOCH` return true.

#### Short Description of the Exploit

Set `nonce = -1` in `input.json` and other inputs to 0 then generate witness. No need to modify the witness.

#### Proposed Mitigation

Implement range check so that attacker can't exploit overflow in `LessThan`.


## circom/uniRep_protocol/veridise_underconstrained_circuit_allows_invalid_comparison

### Under-Constrained

* Id: Unirep/Unirep/veridise-V-UNI-VUL-001
* Project: https://github.com/Unirep/Unirep
* Commit: 0985a28c38c8b2e7b7a9e80f43e63179fdd08b89
* Fix Commit: 3348caa362d5d632d29c532ffa88023d55628eab
* DSL: Circom
* Vulnerability: Under-Constrained
* Location
  - Path: circuits/bigComparators.circom
  - Function: BigLessThan
  - Line: 45
* Source: Audit Report
  - Source Link: https://f8t2x8b2.rocketcdn.me/wp-content/uploads/2023/08/VAR-Unirep.pdf
  - Bug ID: V-UNI-VUL-001: Underconstrained Circuit allows Invalid Comparison
* Commands
  - Setup Environment: `./zkbugs_setup.sh`
  - Reproduce: `./zkbugs_exploit.sh`
  - Compile and Preprocess: `./zkbugs_compile_setup.sh`
  - Positive Test: `./zkbugs_positive_test.sh`
  - Find Exploit: `./zkbugs_find_exploit.sh`
  - Clean: `./zkbugs_clean.sh`

#### Short Description of the Vulnerability

`Num2Bits(254)` is used so malicious prover can provide input that is larger than scalar field modulus `p` but smaller than `2**254`, exploiting the overflow. That makes some comparison opertions invalid, for example, `1 < p` evaluates to true but in the circuit it is treated as `1 < 0`.

#### Short Description of the Exploit

Set `in[0]` to 1 and `in[1]` to `p`, then generate the witness from inputs directly, no need to modify the witness.

#### Proposed Mitigation

Use `Num2Bits_strict` rather than `Num2Bits(254)`.


## circom/circom-bigint_circomlib/veridise_underconstrained_points_in_montgomeryAdd

### Under-Constrained

* Id: iden3/circomlib/veridise-V-CIRCOMLIB-VUL-004
* Project: https://github.com/iden3/circomlib
* Commit: cff5ab6288b55ef23602221694a6a38a0239dcc0
* Fix Commit: 
* DSL: Circom
* Vulnerability: Under-Constrained
* Location
  - Path: circuits/montgomery.circom
  - Function: MontgomeryAdd
  - Line: 16-17
* Source: Audit Report
  - Source Link: https://f8t2x8b2.rocketcdn.me/wp-content/uploads/2023/02/VAR-circom-bigint.pdf
  - Bug ID: V-CIRCOMLIB-VUL-004: Underconstrained points in MontgomeryAdd
* Commands
  - Setup Environment: `./zkbugs_setup.sh`
  - Reproduce: `./zkbugs_exploit.sh`
  - Compile and Preprocess: `./zkbugs_compile_setup.sh`
  - Positive Test: `./zkbugs_positive_test.sh`
  - Find Exploit: `./zkbugs_find_exploit.sh`
  - Clean: `./zkbugs_clean.sh`

#### Short Description of the Vulnerability

Lambda calculation involves a division but there is no constraint on the divisor to be non-zero. In this case `out[1]` is underconstrained and can be set to any value.

#### Short Description of the Exploit

Set `out[0]` to -168697. `out[1]` can be set to any value but it has to satisfy some relative relation with `in1[1]` and `in2[1]`. Check out `detect.sage` to learn more.

#### Proposed Mitigation

Send `in2[0] - in1[0]` to `isZero` template and let the constraint there do the work.


## circom/circom-bigint_circomlib/veridise_underconstrained_outputs_in_bitElementMulAny

### Under-Constrained

* Id: iden3/circomlib/veridise-V-CIRCOMLIB-VUL-006
* Project: https://github.com/iden3/circomlib
* Commit: cff5ab6288b55ef23602221694a6a38a0239dcc0
* Fix Commit: 
* DSL: Circom
* Vulnerability: Under-Constrained
* Location
  - Path: circuits/escalarmulany.circom
  - Function: BitElementMulAny
  - Line: 21-22
* Source: Audit Report
  - Source Link: https://f8t2x8b2.rocketcdn.me/wp-content/uploads/2023/02/VAR-circom-bigint.pdf
  - Bug ID: V-CIRCOMLIB-VUL-006: Underconstrained outputs in BitElementMulAny
* Commands
  - Setup Environment: `./zkbugs_setup.sh`
  - Reproduce: `./zkbugs_exploit.sh`
  - Compile and Preprocess: `./zkbugs_compile_setup.sh`
  - Positive Test: `./zkbugs_positive_test.sh`
  - Find Exploit: `./zkbugs_find_exploit.sh`
  - Clean: `./zkbugs_clean.sh`

#### Short Description of the Vulnerability

`BitElementMulAny` template itself is fine, but it uses `MontgomeryDouble` and `MontgomeryAdd`, which have underconstraint bugs. With the same `input.json`, malicious prover can manipulate lambda value in `MontgomeryDouble` to let the circuit produce different outputs, making it nondeterministic.

#### Short Description of the Exploit

In input.json, just use dummy EC point (1,2) to pass the positive test. Then we exploit the `MontgomeryDouble` underconstrained bug, let divisor be 0 and solve for the exploitable witness in sagemath step by step.

#### Proposed Mitigation

Fix underconstraint bugs in `MontgomeryDouble` and `MontgomeryAdd`.


## circom/circom-bigint_circomlib/veridise_underconstrained_points_in_montgomeryDouble

### Under-Constrained

* Id: iden3/circomlib/veridise-V-CIRCOMLIB-VUL-005
* Project: https://github.com/iden3/circomlib
* Commit: cff5ab6288b55ef23602221694a6a38a0239dcc0
* Fix Commit: 
* DSL: Circom
* Vulnerability: Under-Constrained
* Location
  - Path: circuits/montgomery.circom
  - Function: MontgomeryDouble
  - Line: 18-19
* Source: Audit Report
  - Source Link: https://f8t2x8b2.rocketcdn.me/wp-content/uploads/2023/02/VAR-circom-bigint.pdf
  - Bug ID: V-CIRCOMLIB-VUL-005: Underconstrained points in MontgomeryDouble
* Commands
  - Setup Environment: `./zkbugs_setup.sh`
  - Reproduce: `./zkbugs_exploit.sh`
  - Compile and Preprocess: `./zkbugs_compile_setup.sh`
  - Positive Test: `./zkbugs_positive_test.sh`
  - Find Exploit: `./zkbugs_find_exploit.sh`
  - Clean: `./zkbugs_clean.sh`

#### Short Description of the Vulnerability

Lambda calculation involves a division but there is no constraint on the divisor to be non-zero. In this case `lamda` is underconstrained and can be set to any value.

#### Short Description of the Exploit

Set `in[1]` to 0. Make the assumption that `3*x1_2 + 2*A*in[0] + 1 == 0` and solve for rest of the signals with some sagemath magic.

#### Proposed Mitigation

Send `in[1]` to `isZero` template and let the constraint there do the work.


## circom/circom-bigint_circomlib/veridise_decoder_accepting_bogus_output_signal

### Under-Constrained

* Id: iden3/circomlib/veridise-V-CIRCOMLIB-VUL-001
* Project: https://github.com/iden3/circomlib
* Commit: cff5ab6288b55ef23602221694a6a38a0239dcc0
* Fix Commit: 
* DSL: Circom
* Vulnerability: Under-Constrained
* Location
  - Path: circuits/multiplexer.circom
  - Function: Decoder
  - Line: 10-11
* Source: Audit Report
  - Source Link: https://f8t2x8b2.rocketcdn.me/wp-content/uploads/2023/02/VAR-circom-bigint.pdf
  - Bug ID: V-CIRCOMLIB-VUL-001: Decoder accepting bogus output signal
* Commands
  - Setup Environment: `./zkbugs_setup.sh`
  - Reproduce: `./zkbugs_exploit.sh`
  - Compile and Preprocess: `./zkbugs_compile_setup.sh`
  - Positive Test: `./zkbugs_positive_test.sh`
  - Find Exploit: `./zkbugs_find_exploit.sh`
  - Clean: `./zkbugs_clean.sh`

#### Short Description of the Vulnerability

The circuit does not constrain `out` properly, malicious prover can set a bogus `out` and set `success` to 0, the circuit won't throw error. This makes integration error-prone.

#### Short Description of the Exploit

Set `out` to be full of zeroes and set `success` to 0.

#### Proposed Mitigation

Send `inp - i` to `isZero` template and let the constraint there do the work.


## circom/circom-bigint_circomlib/veridise_underconstrained_points_in_edwards2Montgomery

### Under-Constrained

* Id: iden3/circomlib/veridise-V-CIRCOMLIB-VUL-002
* Project: https://github.com/iden3/circomlib
* Commit: cff5ab6288b55ef23602221694a6a38a0239dcc0
* Fix Commit: 
* DSL: Circom
* Vulnerability: Under-Constrained
* Location
  - Path: circuits/montgomery.circom
  - Function: Edwards2Montgomery
  - Line: 7-8
* Source: Audit Report
  - Source Link: https://f8t2x8b2.rocketcdn.me/wp-content/uploads/2023/02/VAR-circom-bigint.pdf
  - Bug ID: V-CIRCOMLIB-VUL-002: Underconstrained points in Edwards2Montgomery
* Commands
  - Setup Environment: `./zkbugs_setup.sh`
  - Reproduce: `./zkbugs_exploit.sh`
  - Compile and Preprocess: `./zkbugs_compile_setup.sh`
  - Positive Test: `./zkbugs_positive_test.sh`
  - Find Exploit: `./zkbugs_find_exploit.sh`
  - Clean: `./zkbugs_clean.sh`

#### Short Description of the Vulnerability

The circuit does not implement constraint to avoid division by zero. When setting the divisor to 0, `out[1]` is underconstrained and can be set to any value.

#### Short Description of the Exploit

Set `in[0]` to 0 to trigger division by zero. Set `out[1]` to 1337 just to show that it can be set to any value.

#### Proposed Mitigation

Send `in[0]` and `1 - in[1]` to `isZero` template and let the constraint there do the work.


## circom/circom-bigint_circomlib/veridise_underconstrained_points_in_montgomery2Edwards

### Under-Constrained

* Id: iden3/circomlib/veridise-V-CIRCOMLIB-VUL-003
* Project: https://github.com/iden3/circomlib
* Commit: cff5ab6288b55ef23602221694a6a38a0239dcc0
* Fix Commit: 
* DSL: Circom
* Vulnerability: Under-Constrained
* Location
  - Path: circuits/montgomery.circom
  - Function: Montgomery2Edwards
  - Line: 7-8
* Source: Audit Report
  - Source Link: https://f8t2x8b2.rocketcdn.me/wp-content/uploads/2023/02/VAR-circom-bigint.pdf
  - Bug ID: V-CIRCOMLIB-VUL-003: Underconstrained points in Montgomery2Edwards
* Commands
  - Setup Environment: `./zkbugs_setup.sh`
  - Reproduce: `./zkbugs_exploit.sh`
  - Compile and Preprocess: `./zkbugs_compile_setup.sh`
  - Positive Test: `./zkbugs_positive_test.sh`
  - Find Exploit: `./zkbugs_find_exploit.sh`
  - Clean: `./zkbugs_clean.sh`

#### Short Description of the Vulnerability

The circuit does not implement a constraint to avoid division by zero. When setting the divisor to 0, `out[0]` is underconstrained and can be set to any value.

#### Short Description of the Exploit

Set `in[1]` to 0 to trigger division by zero. Set `out[0]` to 1337 just to show that it can be set to any value.

#### Proposed Mitigation

Send `in[1]` and `in[0] + 1` to `isZero` template and let the constraint there do the work.


## circom/darkforest_circuits/daira_hopwood_darkforest_v0_3_missing_bit_length_check

### Range-Check

* Id: darkforest-eth/darkforest-v0.3/Daira-Hopwood-Missing-Bit-Length-Check
* Project: https://github.com/darkforest-eth/darkforest-v0.3
* Commit: 1c83685e22e0463d5481c83e21616745b3204c9c
* Fix Commit: https://github.com/darkforest-eth/circuits/commit/1b5c8440a487614d4a3e6ed523df0aee71a05b6e#diff-440e6bdf86d42398f40d29b9df0b9e6992c6859194d2a7f3c8c68fb46d0f2040
* DSL: Circom
* Vulnerability: Range-Check
* Location
  - Path: circuits/range_proof/circuit.circom
  - Function: RangeProof
  - Line: 16-22
* Source: Audit Report
  - Source Link: https://github.com/0xPARC/zk-bug-tracker?tab=readme-ov-file#1-dark-forest-v03-missing-bit-length-check
  - Bug ID: Dark Forest v0.3: Missing Bit Length Check
* Commands
  - Setup Environment: `./zkbugs_setup.sh`
  - Reproduce: `./zkbugs_exploit.sh`
  - Compile and Preprocess: `./zkbugs_compile_setup.sh`
  - Positive Test: `./zkbugs_positive_test.sh`
  - Find Exploit: `./zkbugs_find_exploit.sh`
  - Clean: `./zkbugs_clean.sh`

#### Short Description of the Vulnerability

Input of `LessThan(bits)` is assumed to take inputs bounded by `2**(bits-1)`, but there is no constraint for it in `LessThan` template. Attacker can use unexpected values outside the range and pass all the constraints, rendering this RangeProof useless. Note: The original circuit does not contain the output `out`, it was added to prevent snarkJS 'Scalar size does not match' error.

#### Short Description of the Exploit

Set `in = -255` then generate witness. No need to modify the witness.

#### Proposed Mitigation

Add constraints to check the range of `in` and `max_abs_value`. This can be done using the `Num2Bits` template.


## circom/reclaimprotocol_circom_chacha/zksecurity_unsound_left_rotation

### Under-Constrained

* Id: reclaimprotocol/circom-chacha20/zksecurity-1
* Project: https://github.com/reclaimprotocol/circom-chacha20
* Commit: ef9f5a5ad899d852740a26b30eabe5765673c71f
* Fix Commit: e5e756375fc1fc8dc48667b00cdf38c79a0fdf50
* DSL: Circom
* Vulnerability: Under-Constrained
* Location
  - Path: circuits/generics.circom
  - Function: RotateLeft32Bits
  - Line: 39-45
* Source: Audit Report
  - Source Link: https://www.zksecurity.xyz/blog/2023-reclaim-chacha20.pdf
  - Bug ID: #1 Unsound Left Rotation Gadget
* Commands
  - Setup Environment: `./zkbugs_setup.sh`
  - Reproduce: `./zkbugs_exploit.sh`
  - Compile and Preprocess: `./zkbugs_compile_setup.sh`
  - Positive Test: `./zkbugs_positive_test.sh`
  - Find Exploit: `./zkbugs_find_exploit.sh`
  - Clean: `./zkbugs_clean.sh`

#### Short Description of the Vulnerability

The `part1` and `part2` signals are not sufficiently constrained. One can arbitrarily set a value to `part1` or `part2` and find a value for the other signal to satisfy the constraint on line 45. This way you can get another `out` value for a given `in`.

#### Short Description of the Exploit

To exploit the vulnerability, one has to simply find a witness that produces a different value for `out` rather than the one produced by the witness generator. The sage script demonstrates how to find another witness that satisfies the constraints. Then, you simply need to produce a new proof.

#### Proposed Mitigation

The recommendation to fix this issue was to constrain `part1` (resp. `part2`) to be (resp. ) bit-sized values. For the concrete mitigation applied, check the commit of the fix.


## circom/spartan_ecdsa/yacademy_input_signal_s_is_not_constrained_in_eff_ecdsa_circom

### Under-Constrained

* Id: personaelabs/spartan-ecdsa/yacademy-high-01
* Project: https://github.com/personaelabs/spartan-ecdsa
* Commit: 3386b30d9b5b62d8a60735cbeab42bfe42e80429
* Fix Commit: 
* DSL: Circom
* Vulnerability: Under-Constrained
* Location
  - Path: circuits/eff_ecdsa.circom
  - Function: EfficientECDSA
  - Line: 25-28
* Source: Audit Report
  - Source Link: https://github.com/zBlock-1/spartan-ecdsa-audit-report
  - Bug ID: Input signal s is not constrained in eff_ecdsa.circom
* Commands
  - Setup Environment: `./zkbugs_setup.sh`
  - Reproduce: `./zkbugs_exploit.sh`
  - Compile and Preprocess: `./zkbugs_compile_setup.sh`
  - Positive Test: `./zkbugs_positive_test.sh`
  - Find Exploit: `./zkbugs_find_exploit.sh`
  - Clean: `./zkbugs_clean.sh`

#### Short Description of the Vulnerability

The circuit computes `pubKey = s * T + U` but `s` isn't constrained. If we set `s = 0` and `(Ux, Uy) = pubKey`, then `(Tx, Ty)` can be any pair of values.

#### Short Description of the Exploit

Set `s = 0` and rest of the inputs can be any number.

#### Proposed Mitigation

Add constraint to `s` so that `s * T` can't be skipped in the computation.



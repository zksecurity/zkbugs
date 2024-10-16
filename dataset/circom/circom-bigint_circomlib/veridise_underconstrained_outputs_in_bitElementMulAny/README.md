# Underconstrained outputs in BitElementMulAny

* Id: iden3/circomlib/veridise-V-CIRCOMLIB-VUL-006
* Project: https://github.com/iden3/circomlib
* Commit: cff5ab6288b55ef23602221694a6a38a0239dcc0
* Fix Commit: 
* DSL: Circom
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Unsafe Reuse of Circuit
* Reproduced: True
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

## Short Description of the Vulnerability

`BitElementMulAny` template itself is fine, but it uses `MontgomeryDouble` and `MontgomeryAdd`, which have underconstraint bugs. With the same `input.json`, malicious prover can manipulate lambda value in `MontgomeryDouble` to let the circuit produce different outputs, making it nondeterministic.

## Short Description of the Exploit

In input.json, just use dummy EC point (1,2) to pass the positive test. Then we exploit the `MontgomeryDouble` underconstrained bug, let divisor be 0 and solve for the exploitable witness in sagemath step by step.

## Proposed Mitigation

Fix underconstraint bugs in `MontgomeryDouble` and `MontgomeryAdd`.

## Similar Bugs

* circom-bigint_circomlib/veridise_decoder_accepting_bogus_output_signal
* circom-bigint_circomlib/veridise_underconstrained_points_in_edwards2Montgomery
* circom-bigint_circomlib/veridise_underconstrained_points_in_montgomery2Edwards
* circom-bigint_circomlib/veridise_underconstrained_points_in_montgomeryAdd
* circom-bigint_circomlib/veridise_underconstrained_points_in_montgomeryDouble

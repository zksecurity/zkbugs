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
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/veridise-circomlib.pdf
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

* iden3/circomlib/veridise_decoder_accepting_bogus_output_signal
* iden3/circomlib/veridise_underconstrained_points_in_edwards2Montgomery
* iden3/circomlib/veridise_underconstrained_points_in_montgomery2Edwards
* iden3/circomlib/veridise_underconstrained_points_in_montgomeryAdd
* iden3/circomlib/veridise_underconstrained_points_in_montgomeryDouble

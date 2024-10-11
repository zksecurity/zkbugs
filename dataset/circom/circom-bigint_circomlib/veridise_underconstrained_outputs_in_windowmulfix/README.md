# Underconstrained outputs in WindowMulFix

* Id: iden3/circomlib/veridise-V-CIRCOMLIB-VUL-008
* Project: https://github.com/iden3/circomlib
* Commit: cff5ab6288b55ef23602221694a6a38a0239dcc0
* Fix Commit: 
* DSL: Circom
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Unsafe Reuse of Circuit
* Reproduced: True
* Location
  - Path: circuits/escalarmulfix.circom
  - Function: WindowMulFix
  - Line: 70-131
* Source: Audit Report
  - Source Link: https://f8t2x8b2.rocketcdn.me/wp-content/uploads/2023/02/VAR-circom-bigint.pdf
  - Bug ID: V-CIRCOMLIB-VUL-008: Underconstrained outputs in WindowMulFix
* Commands
  - Setup Environment: `./zkbugs_setup.sh`
  - Reproduce: `./zkbugs_exploit.sh`
  - Compile and Preprocess: `./zkbugs_compile_setup.sh`
  - Positive Test: `./zkbugs_positive_test.sh`
  - Find Exploit: `./zkbugs_find_exploit.sh`
  - Clean: `./zkbugs_clean.sh`

## Short Description of the Vulnerability

`WindowMulFix` template itself is fine, but it uses `MontgomeryDouble` and `MontgomeryAdd`, which have underconstraint bugs. With the same `input.json`, malicious prover can manipulate lambda value in `MontgomeryDouble` to let the circuit produce different outputs, making it nondeterministic.

## Short Description of the Exploit

Here we exploit the `MontgomeryDouble` underconstrained bug, let divisor be 0 and solve for signals in sagemath step by step. The full witness is provided in veridise report.

## Proposed Mitigation

Fix underconstraint bugs in `MontgomeryDouble` and `MontgomeryAdd`.


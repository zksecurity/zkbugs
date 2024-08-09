# Under-Constrained

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

## Short Description of the Vulnerability

`BitElementMulAny` template itself is fine, but it uses `MontgomeryDouble` and `MontgomeryAdd`, which have underconstraint bugs. With the same `input.json`, malicious prover can manipulate lambda value in `MontgomeryDouble` to let the circuit produce different outputs, making it nondeterministic.

## Short Description of the Exploit

Similarly to the `MontgomeryDouble` bug, start from some assumption (for example, let divisor be 0) and solve for signals in sagemath step by step.

## Proposed Mitigation

Fix underconstraint bugs in `MontgomeryDouble` and `MontgomeryAdd`.

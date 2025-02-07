# Underconstrained outputs in Window4

* Id: iden3/circomlib/veridise-V-CIRCOMLIB-VUL-007
* Project: https://github.com/iden3/circomlib
* Commit: cff5ab6288b55ef23602221694a6a38a0239dcc0
* Fix Commit: 
* DSL: Circom
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Unsafe Reuse of Circuit
* Reproduced: True
* Location
  - Path: circuits/pederson.circom
  - Function: Window4
  - Line: 47-108
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/veridise-circomlib.pdf
  - Bug ID: V-CIRCOMLIB-VUL-007: Underconstrained outputs in Window4
* Commands
  - Setup Environment: `./zkbugs_setup.sh`
  - Reproduce: `./zkbugs_exploit.sh`
  - Compile and Preprocess: `./zkbugs_compile_setup.sh`
  - Positive Test: `./zkbugs_positive_test.sh`
  - Find Exploit: `./zkbugs_find_exploit.sh`
  - Clean: `./zkbugs_clean.sh`

## Short Description of the Vulnerability

`Window4` template itself is fine, but it uses `MontgomeryDouble` and `MontgomeryAdd`, which have underconstraint bugs. With the same `input.json`, malicious prover can manipulate lambda value in `MontgomeryDouble` to let the circuit produce different outputs, making it nondeterministic.

## Short Description of the Exploit

Here we exploit the `MontgomeryDouble` underconstrained bug, let divisor be 0 and solve for signals in sagemath step by step. The full witness is provided in veridise report.

## Proposed Mitigation

Fix underconstraint bugs in `MontgomeryDouble` and `MontgomeryAdd`.


# Under constrained circuits compromising the soundness of the system (Not Reproduce)

* Id: personaelabs/spartan-ecdsa/yacademy-high-03
* Project: https://github.com/personaelabs/spartan-ecdsa
* Commit: 3386b30d9b5b62d8a60735cbeab42bfe42e80429
* Fix Commit: 
* DSL: Circom
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Assigned but Unconstrained
* Reproduced: False
* Location
  - Path: circuits/mul.circom
  - Function: K
  - Line: 123-124
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/yacademy-spartan.md
  - Bug ID: Under constrained circuits compromising the soundness of the system
* Commands
  - Setup Environment: `./zkbugs_setup.sh`
  - Reproduce: `./zkbugs_exploit.sh`
  - Compile and Preprocess: `./zkbugs_compile_setup.sh`
  - Positive Test: `./zkbugs_positive_test.sh`
  - Find Exploit: `./zkbugs_find_exploit.sh`
  - Clean: `./zkbugs_clean.sh`

## Short Description of the Vulnerability

The signals `slo` and `shi` are assigned but not constrained

## Short Description of the Exploit

Modify `slo` or `shi`, then deduce all related intermediate signals and modify the witness.

## Proposed Mitigation

Use `<==` instead of `<--`.


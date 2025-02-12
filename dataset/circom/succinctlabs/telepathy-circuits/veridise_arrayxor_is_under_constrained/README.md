# ArrayXOR is under constrained

* Id: succinctlabs/telepathy-circuits/veridise-V-SUC-VUL-001
* Project: https://github.com/succinctlabs/telepathy-circuits
* Commit: 9c84fb0f38531718296d9b611f8bd6107f61a9b8
* Fix Commit: b0c839cef30c3c25ef41d1ad3000081784766934
* DSL: Circom
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Assigned but Unconstrained
* Reproduced: True
* Location
  - Path: circuits/hash_to_field.circom
  - Function: ArrayXOR
  - Line: 9
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/veridise-telepathy.pdf
  - Bug ID: V-SUC-VUL-001: ArrayXOR is under constrained
* Commands
  - Setup Environment: `./zkbugs_setup.sh`
  - Reproduce: `./zkbugs_exploit.sh`
  - Compile and Preprocess: `./zkbugs_compile_setup.sh`
  - Positive Test: `./zkbugs_positive_test.sh`
  - Find Exploit: `./zkbugs_find_exploit.sh`
  - Clean: `./zkbugs_clean.sh`

## Short Description of the Vulnerability

out[i]` is assigned with `<--` but not constrained with `<==`, so it can be set to any value.

## Short Description of the Exploit

Generate a correct witness first, then modify entry 2 to 5 to any field element.

## Proposed Mitigation

Change the code to `out[i] <== a[i] ^ b[i]`.


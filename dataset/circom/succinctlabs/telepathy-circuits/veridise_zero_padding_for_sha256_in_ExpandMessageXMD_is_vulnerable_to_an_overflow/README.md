# Zero Padding for Sha256 in ExpandMessageXMD is vulnerable to an overflow

* Id: succinctlabs/telepathy-circuits/veridise-V-SUC-VUL-003
* Project: https://github.com/succinctlabs/telepathy-circuits/
* Commit: 9c84fb0f38531718296d9b611f8bd6107f61a9b8
* Fix Commit: b0c839cef30c3c25ef41d1ad3000081784766934
* DSL: Circom
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Arithmetic Field Errors
* Reproduced: True
* Location
  - Path: circuits/hash_to_field.circom
  - Function: I2OSP
  - Line: 3-23
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/veridise-telepathy.pdf
  - Bug ID: V-SUC-VUL-003: Zero Padding for Sha256 in ExpandMessageXMD is vulnerable to an overflow
* Commands
  - Setup Environment: `./zkbugs_setup.sh`
  - Reproduce: `./zkbugs_exploit.sh`
  - Compile and Preprocess: `./zkbugs_compile_setup.sh`
  - Positive Test: `./zkbugs_positive_test.sh`
  - Find Exploit: `./zkbugs_find_exploit.sh`
  - Clean: `./zkbugs_clean.sh`

## Short Description of the Vulnerability

Template ExpandMessageXMD calls I2OSP(64) with `in` set to 0. In template I2OSP, numbers are represented in bigint format, a 64-byte chunk. This representation allows number much larger than scalar field modulus `p`, so attacker can compute `0 + k * p` and turn that into bigint representation and still pass the constraints.

## Short Description of the Exploit

Compute `0 + p` and turn that into bigint format. Also keep track of the accumulator `acc[64]`.

## Proposed Mitigation

Add assertion `assert(l < 31)` when using template I2OSP(l), so the largest possible number is 31 * 8 = 248 bit, which is less than scalar field modulus `p`.


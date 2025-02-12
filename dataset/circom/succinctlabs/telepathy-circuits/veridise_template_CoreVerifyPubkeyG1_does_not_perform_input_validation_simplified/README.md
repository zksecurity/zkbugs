# Template CoreVerifyPubkeyG1 does not perform input validation (Simplified)

* Id: succinctlabs/telepathy-circuits/veridise-V-SUC-VUL-002-simplified
* Project: https://github.com/succinctlabs/telepathy-circuits
* Commit: 9c84fb0f38531718296d9b611f8bd6107f61a9b8
* Fix Commit: b0c839cef30c3c25ef41d1ad3000081784766934
* DSL: Circom
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Unsafe Reuse of Circuit
* Reproduced: True
* Location
  - Path: circuits/bls_signature.circom
  - Function: CoreVerifyPubkeyG1ToyExample
  - Line: 77-95
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/veridise-telepathy.pdf
  - Bug ID: V-SUC-VUL-002: Template CoreVerifyPubkeyG1 does not perform input validation
* Commands
  - Setup Environment: `./zkbugs_setup.sh`
  - Reproduce: `./zkbugs_exploit.sh`
  - Compile and Preprocess: `./zkbugs_compile_setup.sh`
  - Positive Test: `./zkbugs_positive_test.sh`
  - Find Exploit: `./zkbugs_find_exploit.sh`
  - Clean: `./zkbugs_clean.sh`

## Short Description of the Vulnerability

This bug is in the circom-pairing BLS signature verification logic. pubkey, signature and hash are divided into 7-entry chunks of 55-bit data, and each entry is checked against according entry in `p`. When calling `BigLessThan()`, the output isn't verified therefore attacker can manipulate the input so that it overflows p.

## Short Description of the Exploit

The circuit had been simplified to demonstrate the bug, the attack idea is calculating a `delta` such that it makes the input overflow but still bounded by 2**55 - 1 to pass the range check inside `BigLessThan()`. In reality, attacker would bruteforce a special set of inputs satisfying a list of constraints. The details are explained in the PR comment.

## Proposed Mitigation

In each iteration of the for loop, add a constraint `lt[idx].out === 1` to make sure the input is indeed bounded by `p`.


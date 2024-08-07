# Under-Constrained

* Id: yi-sun/circom-pairing/veridise-missing-output-check-constraint
* Project: https://github.com/yi-sun/circom-pairing
* Commit: 741acb1a780bb0ec289b59e101d2aa6f1a5bd23b
* Fix Commit: c686f0011f8d18e0c11bd87e0a109e9478eb9e61
* DSL: Circom
* Vulnerability: Under-Constrained
* Location
  - Path: circuits/bls_signature.circom
  - Function: CoreVerifyPubkeyG1
  - Line: 78-93
* Source: Audit Report
  - Source Link: https://github.com/0xPARC/zk-bug-tracker?tab=readme-ov-file#3-circom-pairing-missing-output-check-constraint
  - Bug ID: Circom-Pairing: Missing Output Check Constraint
* Commands
  - Setup Environment: `./zkbugs_setup.sh`
  - Reproduce: `./zkbugs_exploit.sh`
  - Compile and Preprocess: `./zkbugs_compile_setup.sh`
  - Positive Test: `./zkbugs_positive_test.sh`
  - Find Exploit: `./zkbugs_find_exploit.sh`
  - Clean: `./zkbugs_clean.sh`

## Short Description of the Vulnerability

The circuit uses `BigLessThan` template to make sure all inputs are less than `q`, but the there is no constraint on the outputs. That renders the range check useless and malicious prover can use inputs larger than `q`. Note that the circuit had been modified for simplicity, but it doesn't hurt the idea behind the bug.

## Short Description of the Exploit

Generate random numbers between `q` and `2**55 - 1` and use them as inputs.

## Proposed Mitigation

Add constraints to check all outputs of `BigLessThan` template.

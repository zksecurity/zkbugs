# Missing Range Checks on Comparison Circuits

* Id: Unirep/Unirep/veridise-V-UNI-VUL-002
* Project: https://github.com/Unirep/Unirep
* Commit: 0985a28c38c8b2e7b7a9e80f43e63179fdd08b89
* Fix Commit: f7b0bcd39383d5ec4d17edec2ad91bc01333bf36
* DSL: Circom
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Unsafe Reuse of Circuit
* Reproduced: True
* Location
  - Path: circuits/epochKeyLite.circom
  - Function: EpochKeyLite
  - Line: 45-48
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/veridise-unirep.pdf
  - Bug ID: V-UNI-VUL-002: Missing Range Checks on Comparison Circuits
* Commands
  - Setup Environment: `./zkbugs_setup.sh`
  - Reproduce: `./zkbugs_exploit.sh`
  - Compile and Preprocess: `./zkbugs_compile_setup.sh`
  - Positive Test: `./zkbugs_positive_test.sh`
  - Find Exploit: `./zkbugs_find_exploit.sh`
  - Clean: `./zkbugs_clean.sh`

## Short Description of the Vulnerability

Input of `LessThan(8)` is assumed to have <=8 bits, but there is no constraint for it in `LessThan` template. Attacker can use large values such as `p - 1` to trigger overflow and make something like `p - 1 < EPOCH_KEY_NONCE_PER_EPOCH` return true.

## Short Description of the Exploit

Set `nonce = -1` in `input.json` and other inputs to 0 then generate witness. No need to modify the witness.

## Proposed Mitigation

Implement range check so that attacker can't exploit overflow in `LessThan`.

## Similar Bugs

* darkforest-eth/darkforest-v0.3/daira_hopwood_darkforest_v0_3_missing_bit_length_check

# Range-Check

* Id: darkforest-eth/darkforest-v0.3/Daira-Hopwood-Missing-Bit-Length-Check
* Project: https://github.com/darkforest-eth/darkforest-v0.3
* Commit: 1c83685e22e0463d5481c83e21616745b3204c9c
* Fix Commit: https://github.com/darkforest-eth/circuits/commit/1b5c8440a487614d4a3e6ed523df0aee71a05b6e#diff-440e6bdf86d42398f40d29b9df0b9e6992c6859194d2a7f3c8c68fb46d0f2040
* DSL: Circom
* Vulnerability: Range-Check
* Location
  - Path: circuits/range_proof/circuit.circom
  - Function: RangeProof
  - Line: 16-22
* Source: Audit Report
  - Source Link: https://github.com/0xPARC/zk-bug-tracker?tab=readme-ov-file#1-dark-forest-v03-missing-bit-length-check
  - Bug ID: Dark Forest v0.3: Missing Bit Length Check
* Commands
  - Setup Environment: `./zkbugs_setup.sh`
  - Reproduce: `./zkbugs_exploit.sh`
  - Compile and Preprocess: `./zkbugs_compile_setup.sh`
  - Positive Test: `./zkbugs_positive_test.sh`
  - Find Exploit: `./zkbugs_find_exploit.sh`
  - Clean: `./zkbugs_clean.sh`

## Short Description of the Vulnerability

Input of `LessThan(bits)` is assumed to take inputs bounded by `2**(bits-1)`, but there is no constraint for it in `LessThan` template. Attacker can use unexpected values outside the range and pass all the constraints, rendering this RangeProof useless. Note: The original circuit does not contain the output `out`, it was added to prevent snarkJS 'Scalar size does not match' error.

## Short Description of the Exploit

Set `in = -255` then generate witness. No need to modify the witness.

## Proposed Mitigation

Add constraints to check the range of `in` and `max_abs_value`. This can be done using the `Num2Bits` template.

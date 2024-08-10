# Under-Constrained

* Id: Unirep/Unirep/veridise-V-UNI-VUL-001
* Project: https://github.com/Unirep/Unirep
* Commit: 0985a28c38c8b2e7b7a9e80f43e63179fdd08b89
* Fix Commit: 3348caa362d5d632d29c532ffa88023d55628eab
* DSL: Circom
* Vulnerability: Range-Check
* Location
  - Path: circuits/bigComparators.circom
  - Function: BigLessThan
  - Line: 45
* Source: Audit Report
  - Source Link: https://f8t2x8b2.rocketcdn.me/wp-content/uploads/2023/08/VAR-Unirep.pdf
  - Bug ID: V-UNI-VUL-001: Underconstrained Circuit allows Invalid Comparison
* Commands
  - Setup Environment: `./zkbugs_setup.sh`
  - Reproduce: `./zkbugs_exploit.sh`
  - Compile and Preprocess: `./zkbugs_compile_setup.sh`
  - Positive Test: `./zkbugs_positive_test.sh`
  - Find Exploit: `./zkbugs_find_exploit.sh`
  - Clean: `./zkbugs_clean.sh`

## Short Description of the Vulnerability

`Num2Bits(254)` is used so malicious prover can provide input that is larger than scalar field modulus `p` but smaller than `2**254`, exploiting the overflow. That makes some comparison opertions invalid, for example, `1 < p` evaluates to true but in the circuit it is treated as `1 < 0`.

## Short Description of the Exploit

Set `in[0]` to 1 and `in[1]` to `p`, then generate the witness from inputs directly, no need to modify the witness.

## Proposed Mitigation

Use `Num2Bits_strict` rather than `Num2Bits(254)`.

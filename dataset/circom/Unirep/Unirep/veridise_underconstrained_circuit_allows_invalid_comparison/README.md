# Underconstrained Circuit allows Invalid Comparison

* Id: Unirep/Unirep/veridise-V-UNI-VUL-001
* Project: https://github.com/Unirep/Unirep
* Commit: 0985a28c38c8b2e7b7a9e80f43e63179fdd08b89
* Fix Commit: 3348caa362d5d632d29c532ffa88023d55628eab
* DSL: Circom
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Arithmetic Field Issues
* Reproduced: False
* Codebase: dataset/codebases/circom/Unirep/Unirep/0985a28c38c8b2e7b7a9e80f43e63179fdd08b89
* Original Entrypoint: packages/circuits/generated/bigComparators.circom
* Direct Entrypoint: circuit.circom
* Location
  - Path: circuits/bigComparators.circom
  - Function: BigLessThan
  - Line: 45
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/veridise-unirep.pdf
  - Bug ID: V-UNI-VUL-001: Underconstrained Circuit allows Invalid Comparison
* Input
  - Original: input.json
  - Direct: direct_input.json
* Commands
  - Setup Environment: `./zkbugs_setup.sh`
  - Compile and Preprocess: `./zkbugs_compile_setup.sh`
  - Positive Test: `./zkbugs_positive_test.sh`
  - Clean: `./zkbugs_clean.sh`
  - Compile: `./zkbugs_compile.sh`

## Running

Scripts support two modes controlled by the `ZKBUGS_MODE` environment variable:

- **`original`** (default): compiles the project's main circuit from the full codebase.
- **`direct`**: compiles an isolated wrapper (`circuit.circom`) that only instantiates the vulnerable template.

```bash
# Setup (run once)
./zkbugs_setup.sh

# Compile only (no zkey ceremony)
./zkbugs_compile.sh                        # original mode
ZKBUGS_MODE=direct ./zkbugs_compile.sh     # direct mode

# Full setup with zkey ceremony + positive test (direct mode)
ZKBUGS_MODE=direct ./zkbugs_compile_setup.sh
ZKBUGS_MODE=direct ./zkbugs_positive_test.sh

# Clean build artifacts
./zkbugs_clean.sh
```

## Short Description of the Vulnerability

`Num2Bits(254)` is used so malicious prover can provide input that is larger than scalar field modulus `p` but smaller than `2**254`, exploiting the overflow. That makes some comparison opertions invalid, for example, `1 < p` evaluates to true but in the circuit it is treated as `1 < 0`.

## Proposed Mitigation

Use `Num2Bits_strict` rather than `Num2Bits(254)`.

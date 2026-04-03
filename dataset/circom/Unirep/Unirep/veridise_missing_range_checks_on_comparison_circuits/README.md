# Missing Range Checks on Comparison Circuits

* Id: Unirep/Unirep/veridise-V-UNI-VUL-002
* Project: https://github.com/Unirep/Unirep
* Commit: 0985a28c38c8b2e7b7a9e80f43e63179fdd08b89
* Fix Commit: f7b0bcd39383d5ec4d17edec2ad91bc01333bf36
* DSL: Circom
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Unsafe Reuse of Circuit
* Reproduced: False
* Codebase: dataset/codebases/circom/Unirep/Unirep/0985a28c38c8b2e7b7a9e80f43e63179fdd08b89
* Original Entrypoint: packages/circuits/generated/epochKeyLite.circom
* Direct Entrypoint: circuit.circom
* Location
  - Path: circuits/epochKeyLite.circom
  - Function: EpochKeyLite
  - Line: 45-48
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/veridise-unirep.pdf
  - Bug ID: V-UNI-VUL-002: Missing Range Checks on Comparison Circuits
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

Input of `LessThan(8)` is assumed to have <=8 bits, but there is no constraint for it in `LessThan` template. Attacker can use large values such as `p - 1` to trigger overflow and make something like `p - 1 < EPOCH_KEY_NONCE_PER_EPOCH` return true.

## Proposed Mitigation

Implement range check so that attacker can't exploit overflow in `LessThan`.

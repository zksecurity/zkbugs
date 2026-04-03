# Zero Padding for Sha256 in ExpandMessageXMD is vulnerable to an overflow

* Id: succinctlabs/telepathy-circuits/veridise-V-SUC-VUL-003
* Project: https://github.com/succinctlabs/telepathy-circuits
* Commit: 9c84fb0f38531718296d9b611f8bd6107f61a9b8
* Fix Commit: b0c839cef30c3c25ef41d1ad3000081784766934
* DSL: Circom
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Arithmetic Field Issues
* Reproduced: False
* Codebase: dataset/codebases/circom/succinctlabs/telepathy-circuits/9c84fb0f38531718296d9b611f8bd6107f61a9b8
* Original Entrypoint: circuits/step.circom
* Direct Entrypoint: circuit.circom
* Location
  - Path: circuits/hash_to_field.circom
  - Function: I2OSP
  - Line: 3-23
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/veridise-telepathy.pdf
  - Bug ID: V-SUC-VUL-003: Zero Padding for Sha256 in ExpandMessageXMD is vulnerable to an overflow
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

Template ExpandMessageXMD calls I2OSP(64) with `in` set to 0. In template I2OSP, numbers are represented in bigint format, a 64-byte chunk. This representation allows number much larger than scalar field modulus `p`, so attacker can compute `0 + k * p` and turn that into bigint representation and still pass the constraints.

## Proposed Mitigation

Add assertion `assert(l < 31)` when using template I2OSP(l), so the largest possible number is 31 * 8 = 248 bit, which is less than scalar field modulus `p`.

# ArrayXOR is under constrained

* Id: succinctlabs/telepathy-circuits/veridise-V-SUC-VUL-001
* Project: https://github.com/succinctlabs/telepathy-circuits
* Commit: 9c84fb0f38531718296d9b611f8bd6107f61a9b8
* Fix Commit: b0c839cef30c3c25ef41d1ad3000081784766934
* DSL: Circom
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Assigned but Unconstrained
* Reproduced: False
* Codebase: dataset/codebases/circom/succinctlabs/telepathy-circuits/9c84fb0f38531718296d9b611f8bd6107f61a9b8
* Original Entrypoint: circuits/step.circom
* Direct Entrypoint: circuit.circom
* Location
  - Path: circuits/hash_to_field.circom
  - Function: ArrayXOR
  - Line: 231
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/veridise-telepathy.pdf
  - Bug ID: V-SUC-VUL-001: ArrayXOR is under constrained
* Input
  - Original: input.json
  - Direct: direct_input.json
* Commands
  - Setup Environment: `./zkbugs_setup.sh`
  - Compile: `./zkbugs_compile.sh`
  - Compile and Preprocess: `./zkbugs_compile_setup.sh`
  - Positive Test: `./zkbugs_positive_test.sh`
  - Clean: `./zkbugs_clean.sh`

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

`out[i]` is assigned with `<--` but not constrained with `<==`, so it can be set to any value.

## Proposed Mitigation

Change the code to `out[i] <== a[i] ^ b[i]`.

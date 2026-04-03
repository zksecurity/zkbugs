# Template CoreVerifyPubkeyG1 does not perform input validation (Simplified)

* Id: succinctlabs/telepathy-circuits/veridise-V-SUC-VUL-002-simplified
* Project: https://github.com/succinctlabs/telepathy-circuits
* Commit: 9c84fb0f38531718296d9b611f8bd6107f61a9b8
* Fix Commit: b0c839cef30c3c25ef41d1ad3000081784766934
* DSL: Circom
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Unsafe Reuse of Circuit
* Reproduced: False
* Codebase: dataset/codebases/circom/succinctlabs/telepathy-circuits/9c84fb0f38531718296d9b611f8bd6107f61a9b8
* Entrypoint: TODO_ENTRYPOINT
* Direct Entrypoint: circuit.circom
* Location
  - Path: circuits/bls_signature.circom
  - Function: CoreVerifyPubkeyG1ToyExample
  - Line: 77-95
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/veridise-telepathy.pdf
  - Bug ID: V-SUC-VUL-002: Template CoreVerifyPubkeyG1 does not perform input validation
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

This bug is in the circom-pairing BLS signature verification logic. pubkey, signature and hash are divided into 7-entry chunks of 55-bit data, and each entry is checked against according entry in `p`. When calling `BigLessThan()`, the output isn't verified therefore attacker can manipulate the input so that it overflows p.

## Proposed Mitigation

In each iteration of the for loop, add a constraint `lt[idx].out === 1` to make sure the input is indeed bounded by `p`.

# Input signal s is not constrained in eff_ecdsa.circom

* Id: personaelabs/spartan-ecdsa/yacademy-high-01
* Project: https://github.com/personaelabs/spartan-ecdsa
* Commit: 3386b30d9b5b62d8a60735cbeab42bfe42e80429
* Fix Commit: 
* DSL: Circom
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Missing Input Constraints
* Reproduced: False
* Codebase: dataset/codebases/circom/personaelabs/spartan-ecdsa/3386b30d9b5b62d8a60735cbeab42bfe42e80429
* Original Entrypoint: packages/circuits/instances/pubkey_membership.circom
* Direct Entrypoint: circuit.circom
* Location
  - Path: circuits/eff_ecdsa.circom
  - Function: EfficientECDSA
  - Line: 25-28
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/yacademy-spartan.md
  - Bug ID: Input signal s is not constrained in eff_ecdsa.circom
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

The circuit computes `pubKey = s * T + U` but `s` isn't constrained. If we set `s = 0` and `(Ux, Uy) = pubKey`, then `(Tx, Ty)` can be any pair of values.

## Proposed Mitigation

Add constraint to `s` so that `s * T` can't be skipped in the computation.

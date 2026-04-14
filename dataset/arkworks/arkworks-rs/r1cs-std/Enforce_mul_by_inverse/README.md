# Enforce mul_by_inverse

* Id: arkworks-rs/r1cs-std/Enforce_mul_by_inverse
* Project: https://github.com/arkworks-rs/r1cs-std
* Commit: 
* Fix Commit: 
* DSL: Arkworks
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Wrong Translation of Logic into Constraints
* Reproduced: False
* Codebase: 
* Original Entrypoint: (same as direct)
* Direct Entrypoint: 
* Location
  - Path: 
  - Function: 
  - Line: 
* Source: Audit Report
  - Source Link: https://github.com/arkworks-rs/r1cs-std/pull/70
  - Bug ID: Enforce mul_by_inverse
* Commands
  - Setup Environment: ``
  - Reproduce: ``
  - Compile and Preprocess: ``
  - Positive Test: ``
  - Find Exploit: ``
  - Clean: ``

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

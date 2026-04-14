# Unsoundness in variable comparison / non-unique binary decomposition

* Id: Consensys/gnark/Unsoundness_in_variable_comparison_/_non-unique_binary_decomposition
* Project: https://github.com/Consensys/gnark
* Commit: 
* Fix Commit: 
* DSL: gnark
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Missing Input Constraints
* Reproduced: False
* Codebase: 
* Original Entrypoint: (same as direct)
* Direct Entrypoint: 
* Location
  - Path: 
  - Function: 
  - Line: 
* Source: Audit Report
  - Source Link: https://github.com/Consensys/gnark/security/advisories/GHSA-498w-5j49-vqjg
  - Bug ID: Unsoundness in variable comparison / non-unique binary decomposition
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

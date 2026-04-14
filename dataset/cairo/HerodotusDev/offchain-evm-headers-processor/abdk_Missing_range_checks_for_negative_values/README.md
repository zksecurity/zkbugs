# Missing range checks for negative values

* Id: HerodotusDev/offchain-evm-headers-processor/abdk_Missing_range_checks_for_negative_values
* Project: https://github.com/HerodotusDev/offchain-evm-headers-processor
* Commit: 0xb14e74a5a67bd4882383993036658a57f871e12b
* Fix Commit: eb30c321f41880b35a7af069f7f52fd98d584616
* DSL: Cairo
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Arithmetic Field Issues
* Reproduced: False
* Codebase: 
* Original Entrypoint: (same as direct)
* Direct Entrypoint: 
* Location
  - Path: 
  - Function: 
  - Line: 
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/abdk-herodotus.pdf
  - Bug ID: Missing range checks for negative values
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

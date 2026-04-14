# Function doesn’t ensure that “y” is a power of two.

* Id: HerodotusDev/offchain-evm-headers-processor/abdk_Function_doesn’t_ensure_that_“y”_is_a_power_of_two.
* Project: https://github.com/HerodotusDev/offchain-evm-headers-processor
* Commit: 0xb14e74a5a67bd4882383993036658a57f871e12b
* Fix Commit: af97dae8be5cca025f42da9334596de50762c855
* DSL: Cairo
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
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/abdk-herodotus.pdf
  - Bug ID: Function doesn’t ensure that “y” is a power of two.
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

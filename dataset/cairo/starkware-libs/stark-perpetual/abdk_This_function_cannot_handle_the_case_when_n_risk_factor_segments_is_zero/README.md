# This function cannot handle the case when n_risk_factor_segments is zero.

* Id: starkware-libs/stark-perpetual/abdk_This_function_cannot_handle_the_case_when_n_risk_factor_segments_is_zero.
* Project: https://github.com/starkware-libs/stark-perpetual
* Commit: 0xe6189aa
* Fix Commit: 3eb3a26366f412cf8d0643f65e33d8b2eb5904fc
* DSL: Cairo
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Missing Input Constraints
* Reproduced: False
* Codebase: 
* Original Entrypoint: (same as direct)
* Direct Entrypoint: 
* Location
  - Path: execute_batch_utils.cairo
  - Function: validate_risk_factor_function
  - Line: 78
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/abdk-perpetual.pdf
  - Bug ID: This function cannot handle the case when n_risk_factor_segments is zero.
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

## Short Description of the Vulnerability

The bug occurs when the function 'execute_batch_utils.cairo' cannot process a scenario where the variable 'n_risk_factor_segments' is set to zero. This situation leads to unclear behavior that may affect the function's robustness or cause unexpected results. The recommendation is to consider explicitly forbidding this case through an assertion in the code to ensure stability and predictability.

## Proposed Mitigation

The recommended fix is to explicitly forbid the case where n_risk_factor_segments is zero via an assert.

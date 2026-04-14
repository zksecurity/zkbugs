# Soundness failure due to 0 value not enforced

* Id: lurk-lab/lurk-rs/inference_Soundness_failure_due_to_0_value_not_enforced
* Project: https://github.com/lurk-lab/lurk-rs
* Commit: 0x5c92c6a37856f43cb23bcfce59443da9d0ce0061
* Fix Commit: 
* DSL: Bellperson
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Assigned but Unconstrained
* Reproduced: False
* Codebase: 
* Original Entrypoint: (same as direct)
* Direct Entrypoint: 
* Location
  - Path: src/circuits
  - Function: selector_dot_product
  - Line: 
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/inference-lurk.pdf
  - Bug ID: Soundness failure due to 0 value not enforced
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

The bug "Soundness failure due to 0 value not enforced" occurred because the variable 'zero' in the selector_dot_product() function was allocated but not enforced to be zero. This variable was used as the default in pick(), allowing the final result to be manipulated. The issue was addressed in commit 4a61333 by passing a previously allocated zero variable from the global store, ensuring it remained unaltered throughout the operation.

## Proposed Mitigation

The bug identified as 'Soundness failure due to 0 value not enforced' was fixed by passing a previously allocated zero variable from the global store to ensure it correctly enforces the zero value. This adjustment was made as recorded in commit 4a61333.

# Multicase number of defaults not enforced

* Id: lurk-lab/lurk-rs/inference_Multicase_number_of_defaults_not_enforced
* Project: https://github.com/lurk-lab/lurk-rs
* Commit: 0x5c92c6a37856f43cb23bcfce59443da9d0ce0061
* Fix Commit: edcda9760a66088db78f64994513fa19d67caa79
* DSL: Bellperson
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Wrong Translation of Logic into Constraints
* Reproduced: False
* Codebase: 
* Original Entrypoint: (same as direct)
* Direct Entrypoint: 
* Location
  - Path: src/circuits
  - Function: apply_continuation
  - Line: 
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/inference-lurk.pdf
  - Bug ID: Multicase number of defaults not enforced
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

The bug "Multicase number of defaults not enforced" refers to an issue in the 'apply_continuation()' function in Lurk's circuit logic, where it incorrectly sized the default argument for the 'multi_case' function. This misalignment resulted in some constraints not being properly enforced. The problem was rectified by supplying the correct number of arguments and adding an assertion to detect incorrect usage in the future.

## Proposed Mitigation

The recommended fix for the bug 'Multicase number of defaults not enforced' is providing the correct number of arguments to the function and adding an assertion to detect incorrect usage in the future. This was implemented in commit edcda97.

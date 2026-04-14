# Soundness failure due toaccumulator 1 initial value not enforced

* Id: lurk-lab/lurk-rs/inference_Soundness_failure_due_toaccumulator_1_initial_value_not_enforced
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
  - Path: src/circuits/multi_case_aux
  - Function: multi_case_aux
  - Line: 
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/inference-lurk.pdf
  - Bug ID: Soundness failure due toaccumulator 1 initial value not enforced
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

The bug "Soundness failure due to accumulator 1 initial value not enforced" occurs because in the function multi_case_aux, the initial accumulator variable 'acc' is set to 1 but this value is not enforced. As a result, changing this value to 0 could manipulate the variable '_selected' to always be true, affecting the soundness of the program. This issue was corrected in a code update that involved passing a global store as input and utilizing a previously allocated 'true_num' variable.

## Proposed Mitigation

The recommended fix for the bug 'Soundness failure due to accumulator 1 initial value not enforced' is addressed by passing the global store as input and using the previously allocated true_num variable. This was implemented in commit 4a61333.

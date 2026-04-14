# Vectors not constrained to be of the same size

* Id: lurk-lab/lurk-rs/inference_Vectors_not_constrained_to_be_of_the_same_size
* Project: https://github.com/lurk-lab/lurk-rs
* Commit: 0x5c92c6a37856f43cb23bcfce59443da9d0ce0061
* Fix Commit: d2c7c69efec6b36dfcb55a0586c21df88f0a00b6
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
  - Function: multi_case
  - Line: 
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/inference-lurk.pdf
  - Bug ID: Vectors not constrained to be of the same size
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

The bug titled "Vectors not constrained to be of the same size" involves vectors in Lurk's circuit operations not being enforced to match in size, leading to potential runtime crashes or uncaught bugs. Measures including adding assertions for size consistency have been implemented to address these issues and prevent potential soundness or runtime problems.

## Proposed Mitigation

To fix the bug 'Vectors not constrained to be of the same size,' the recommended fix involves adding assertions in various functions to ensure vectors are the same size, preventing runtime crashes and uncaught bugs. This was implemented and validated through adjusted tests as per commit d2c7c69.

# Under-constrained outputs in reduce_sym

* Id: lurk-lab/lurk-rs/inference_Under-constrained_outputs_in_reduce_sym
* Project: https://github.com/lurk-lab/lurk-rs
* Commit: 0x5c92c6a37856f43cb23bcfce59443da9d0ce0061
* Fix Commit: 7236df555c2cfc7c37d290666d7d5167b3447032
* DSL: Bellperson
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Wrong Translation of Logic into Constraints
* Reproduced: False
* Codebase: 
* Original Entrypoint: (same as direct)
* Direct Entrypoint: 
* Location
  - Path: src/circuits/reduce_sym.rs
  - Function: reduce_sym
  - Line: 
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/inference-lurk.pdf
  - Bug ID: Under-constrained outputs in reduce_sym
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

The bug S-LRK-05 'Under-constrained outputs in reduce_sym' involves the reduction circuit not sufficiently constraining symbolic-expression outputs. Though the circuit is supposed to enforce outputs to be one of ten possible results, contingent on specific conditions, the constraints were initially weak or missing. This led to intermediate complexities, making the potential outcomes unconstrained under certain conditions. Upon review and refactoring, modifications were made to improve output constraints, enhance code clarity compared to specifications, and optimize the circuit design.

## Proposed Mitigation

The recommended fix for the bug 'Under-constrained outputs in reduce_sym' involves refactoring the function `reduce_sym` into three parts: computing all branch conditions and possible output values, assigning predicates that are true when their value should be returned, and adding constraints to enforce the outputs. This refactoring makes the code more understandable and comparable to the Rust specification while reducing the total number of constraints.

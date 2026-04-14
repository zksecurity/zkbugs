# Zero padding not enforced

* Id: lurk-lab/neptune/inference_Zero_padding_not_enforced
* Project: https://github.com/lurk-lab/neptune
* Commit: 0x5c92c6a37856f43cb23bcfce59443da9d0ce0061
* Fix Commit: 2415d641dcbdab17b3264d2254705a382c86ce73
* DSL: Bellperson
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Assigned but Unconstrained
* Reproduced: False
* Codebase: 
* Original Entrypoint: (same as direct)
* Direct Entrypoint: 
* Location
  - Path: filecoin-project/neptune/src/circuit2.rs
  - Function: poseidon_hash_allocated
  - Line: 
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/inference-lurk.pdf
  - Bug ID: Zero padding not enforced
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

The bug "Zero padding not enforced" refers to an issue in the function poseidon_hash_allocated() within the neptune library, where padding with newly allocated zero variables was not enforced to be zero in scenarios where hash_type is ConstantLength and the length is smaller than the arity. This flaw potentially allowed for hash manipulation that could still pass Poseidon validation checks. It was fixed by constraining the padding values to be zero using a new function enforce_zero().

## Proposed Mitigation

The recommended fix for the bug "Zero padding not enforced" is to ensure that zero padding values are constrained to be zero, using the function `enforce_zero()`. This fix was implemented in commit 2415d64.

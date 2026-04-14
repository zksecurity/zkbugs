# Equality between tag_value and the final tag_value_acc not checked

* Id: scroll-tech/zkevm-circuits/zellic_Equality_between_tag_value_and_the_final_tag_value_acc_not_checked
* Project: https://github.com/scroll-tech/zkevm-circuits
* Commit: 0x25dd32aa316ec842ffe79bb8efe9f05f86edc33e
* Fix Commit: 2e422878e0d78f769e08f0b1ad1275ee039362d5
* DSL: Halo2
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Assigned but Unconstrained
* Reproduced: False
* Codebase: 
* Original Entrypoint: (same as direct)
* Direct Entrypoint: 
* Location
  - Path: RLPCircuit/rlp_circuit_fsm.rs
  - Function: 
  - Line: 23
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/zellic-scroll-2.pdf
  - Bug ID: Equality between tag_value and the final tag_value_acc not checked
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

The bug "Equality between tag_value and the final tag_value_acc not checked" refers to a missing validation in the RLP circuit's state machine during the transition from the Bytes state to the DecodeTagStart state. There is no condition to ensure that the accumulated tag value (tag_value_acc) equals the final tag value (tag_value) when the tag index equals the tag length, which could result in incorrect values being stored in the RLP table. The recommendation is to implement a check to validate that tag_value and tag_value_acc are equal.

## Proposed Mitigation

Add a check to ensure that `tag_value` is equal to `tag_value_acc` before transitioning from the Bytes state to the DecodeTagStart state. This will verify that the accumulated tag value matches the expected value.

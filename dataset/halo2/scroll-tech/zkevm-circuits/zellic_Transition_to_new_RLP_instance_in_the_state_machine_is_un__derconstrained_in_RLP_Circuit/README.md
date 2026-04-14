# Transition to new RLP instance in the state machine is un- derconstrained in RLP Circuit

* Id: scroll-tech/zkevm-circuits/zellic_Transition_to_new_RLP_instance_in_the_state_machine_is_un-_derconstrained_in_RLP_Circuit
* Project: https://github.com/scroll-tech/zkevm-circuits
* Commit: 0x25dd32aa316ec842ffe79bb8efe9f05f86edc33e
* Fix Commit: 2e422878e0d78f769e08f0b1ad1275ee039362d5
* DSL: Halo2
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Wrong Translation of Logic into Constraints
* Reproduced: False
* Codebase: 
* Original Entrypoint: (same as direct)
* Direct Entrypoint: 
* Location
  - Path: rlp_circuit_fsm.rs
  - Function: 
  - Line: 21
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/zellic-scroll-2.pdf
  - Bug ID: Transition to new RLP instance in the state machine is un- derconstrained in RLP Circuit
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

The bug regarding the "Transition to new RLP instance in the state machine" is that the constraints for transitioning between RLP instances are too lenient. Specifically, it allows cases like (tx_id', format') = (tx_id - 1, format + 1), which may lead to the same transaction appearing multiple times in the state machine. Proper checks need to be implemented to ensure valid transitions.

## Proposed Mitigation

The recommended fix for the bug regarding the underconstraint of the transition to a new RLP instance in the state machine is to implement proper checks for the transition conditions, ensuring that (tx_id', format') cannot equal (tx_id - 1, format + 1) and that tag' must be either TxType or BeginList.

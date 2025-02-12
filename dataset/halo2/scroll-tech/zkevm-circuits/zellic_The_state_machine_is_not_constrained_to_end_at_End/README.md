# The state machine is not constrained to end at End (Not Reproduce)

* Id: scroll-tech/zkevm-circuits/zellic_The_state_machine_is_not_constrained_to_end_at_End
* Project: https://github.com/scroll-tech/zkevm-circuits
* Commit: 0x25dd32aa316ec842ffe79bb8efe9f05f86edc33e
* Fix Commit: 2e422878e0d78f769e08f0b1ad1275ee039362d5
* DSL: Halo2
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Wrong translation of logic into constraints
* Reproduced: False
* Location
  - Path: RLPCircuit/rlp_circuit_fsm.rs
  - Function: 
  - Line: 27
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/zellic-scroll-2.pdf
  - Bug ID: The state machine is not constrained to end at End
* Commands
  - Setup Environment: ``
  - Reproduce: ``
  - Compile and Preprocess: ``
  - Positive Test: ``
  - Find Exploit: ``
  - Clean: ``

## Short Description of the Vulnerability

The bug "The state machine is not constrained to end at End" indicates that there are no constraints preventing the state machine from concluding without reaching the End state. This lack of constraint could allow the machine to skip important checks related to gas costs and other calculations during the transaction processing, potentially compromising its integrity. The recommendation for remediation includes implementing a fixed column to ensure that the state is set to End when a certain condition is met, which has been acknowledged and fixed in a subsequent commit.

## Short Description of the Exploit



## Proposed Mitigation

The recommended fix for the bug "The state machine is not constrained to end at End" is to add a fixed column q_last, implement the assign logic, and add the constraint that the state is End if q_last is enabled.


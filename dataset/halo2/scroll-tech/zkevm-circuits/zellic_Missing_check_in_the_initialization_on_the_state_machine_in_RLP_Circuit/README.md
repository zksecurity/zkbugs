# Missing check in the initialization on the state machine in RLP Circuit (Not Reproduce)

* Id: scroll-tech/zkevm-circuits/zellic_Missing_check_in_the_initialization_on_the_state_machine_in_RLP_Circuit
* Project: https://github.com/scroll-tech/zkevm-circuits
* Commit: 0x25dd32aa316ec842ffe79bb8efe9f05f86edc33e
* Fix Commit: 2e422878e0d78f769e08f0b1ad1275ee039362d5
* DSL: Halo2
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Missing Input Constraints
* Reproduced: False
* Location
  - Path: rlp_circuit_fsm.rs
  - Function: 
  - Line: 19
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/zellic-scroll-2.pdf
  - Bug ID: Missing check in the initialization on the state machine in RLP Circuit
* Commands
  - Setup Environment: ``
  - Reproduce: ``
  - Compile and Preprocess: ``
  - Positive Test: ``
  - Find Exploit: ``
  - Clean: ``

## Short Description of the Vulnerability

The bug report identifies a critical issue in the RLP Circuit related to the state machine initialization, specifically a missing check that should ensure the initial state is set to "DecodeTagStart" and the initial transaction ID is set to 1. This oversight may allow the state machine to start decoding incorrectly, potentially leading to invalid RLP decodings. The issue has been acknowledged and a fix has been implemented.

## Short Description of the Exploit



## Proposed Mitigation

Add a check to ensure that the initial state of the state machine in the RLP Circuit is set to DecodeTagStart and that the initial tx_id is 1.


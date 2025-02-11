# Missing constraint for the first tx_id in Tx Circuit (Not Reproduce)

* Id: scroll-tech/zkevm-circuits/zellic_Missing_constraint_for_the_first_tx_id_in_Tx_Circuit
* Project: https://github.com/scroll-tech/zkevm-circuits
* Commit: 0x25dd32aa316ec842ffe79bb8efe9f05f86edc33e
* Fix Commit: 2e422878e0d78f769e08f0b1ad1275ee039362d5
* DSL: Halo2
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Missing Input Constraints
* Reproduced: False
* Location
  - Path: TxCircuit
  - Function: 
  - Line: 40
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/zellic-scroll-2.pdf
  - Bug ID: Missing constraint for the first tx_id in Tx Circuit
* Commands
  - Setup Environment: ``
  - Reproduce: ``
  - Compile and Preprocess: ``
  - Positive Test: ``
  - Find Exploit: ``
  - Clean: ``

## Short Description of the Vulnerability

The bug "Missing constraint for the first tx_id in Tx Circuit" refers to the absence of a check ensuring that the initial transaction ID (tx_id) starts at 1 in the Tx Circuit. While the transitions for tx_id have been implemented correctly, there is currently no enforcement that establishes the first tx_id as equal to 1, potentially allowing it to begin at any arbitrary value. It has been recommended to add this constraint to guarantee that the first tx_id is consistently set to 1.

## Short Description of the Exploit



## Proposed Mitigation

Add a constraint to check that the first tx_id is equal to 1 in the Tx Circuit. Remediation has already been acknowledged and implemented by Scroll in commit 2e422878.


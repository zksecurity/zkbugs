# Highest tx_id must be equal to cum_num_txs in Tx Circuit (Not Reproduce)

* Id: scroll-tech/zkevm-circuits/zellic_Highest_tx_id_must_be_equal_to_cum_num_txs_in_Tx_Circuit
* Project: https://github.com/scroll-tech/zkevm-circuits
* Commit: 0x25dd32aa316ec842ffe79bb8efe9f05f86edc33e
* Fix Commit: 2e422878e0d78f769e08f0b1ad1275ee039362d5
* DSL: Halo2
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Misimplementation of a Specification
* Reproduced: False
* Location
  - Path: TxCircuit/tx_circuit.rs
  - Function: 
  - Line: 66
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/zellic-scroll-2.pdf
  - Bug ID: Highest tx_id must be equal to cum_num_txs in Tx Circuit
* Commands
  - Setup Environment: ``
  - Reproduce: ``
  - Compile and Preprocess: ``
  - Positive Test: ``
  - Find Exploit: ``
  - Clean: ``

## Short Description of the Vulnerability

The bug 'Highest tx_id must be equal to cum_num_txs in Tx Circuit' indicates that in the Tx Circuit, while there is a check to ensure that tx_id is less than the cum_num_txs, there isn't a constraint enforcing that the highest tx_id must be equal to cum_num_txs. This could allow cum_num_txs to be much larger than the actual set of tx_ids, potentially leading to inconsistencies in transaction processing. It is recommended to add a constraint to verify that the last non-padding transaction's tx_id equates to cum_num_txs.

## Short Description of the Exploit



## Proposed Mitigation

Add a constraint to ensure that the tx_id of the last non-padding transaction in the Tx Circuit is equal to cum_num_txs.


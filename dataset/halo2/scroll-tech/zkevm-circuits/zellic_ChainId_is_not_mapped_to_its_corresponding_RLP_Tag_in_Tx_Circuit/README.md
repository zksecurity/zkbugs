# ChainId is not mapped to it’s corresponding RLP Tag in Tx Circuit (Not Reproduce)

* Id: scroll-tech/zkevm-circuits/zellic_ChainId_is_not_mapped_to_it’s_corresponding_RLP_Tag_in_Tx_Circuit
* Project: https://github.com/scroll-tech/zkevm-circuits
* Commit: 0x25dd32aa316ec842ffe79bb8efe9f05f86edc33e
* Fix Commit: 2e422878e0d78f769e08f0b1ad1275ee039362d5
* DSL: Halo2
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Missing Input Constraints
* Reproduced: False
* Location
  - Path: TxCircuit/tx_circuit.rs
  - Function: 
  - Line: 64
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/zellic-scroll-2.pdf
  - Bug ID: ChainId is not mapped to it’s corresponding RLP Tag in Tx Circuit
* Commands
  - Setup Environment: ``
  - Reproduce: ``
  - Compile and Preprocess: ``
  - Positive Test: ``
  - Find Exploit: ``
  - Clean: ``

## Short Description of the Vulnerability

The bug 'ChainId is not mapped to its corresponding RLP Tag in Tx Circuit' indicates that within the Tx Circuit, the ChainId field is incorrectly set to Null in the mapping of TxFieldTag values. This oversight means that the ChainId is omitted during lookups needed for verifying transaction signatures, potentially allowing a scenario where the ChainId value could be neglected for transaction signatures. It is recommended to add the appropriate mapping and ensure ChainId is included in RLP lookups.

## Short Description of the Exploit



## Proposed Mitigation

Recommend adding the mapping from TxFieldTag: ChainID to the RLPTag: ChainId and ensure the ChainID value in the TxTable is looked up in the RLPTable using this mapping.


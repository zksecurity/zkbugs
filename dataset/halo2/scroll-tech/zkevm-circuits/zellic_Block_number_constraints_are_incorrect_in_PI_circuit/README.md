# Block number constraints are incorrect in PI circuit (Not Reproduce)

* Id: scroll-tech/zkevm-circuits/zellic_Block_number_constraints_are_incorrect_in_PI_circuit
* Project: https://github.com/scroll-tech/zkevm-circuits
* Commit: 0x25dd32aa316ec842ffe79bb8efe9f05f86edc33e
* Fix Commit: 
* DSL: Halo2
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Wrong translation of logic into constraints
* Reproduced: False
* Location
  - Path: PICircuit/pi_circuit.rs
  - Function: 
  - Line: 36
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/zellic-scroll-2.pdf
  - Bug ID: Block number constraints are incorrect in PI circuit
* Commands
  - Setup Environment: ``
  - Reproduce: ``
  - Compile and Preprocess: ``
  - Positive Test: ``
  - Find Exploit: ``
  - Clean: ``

## Short Description of the Vulnerability

The bug "Block number constraints are incorrect in PI circuit" indicates that the index column for the block table, which is meant to correspond to block numbers, does not have properly enforced equality constraints. Specifically, the equality checks for the index values across rows are being executed incorrectly, allowing for potential discrepancies between the index and the actual block number. This flaw could lead to invalid results in the circuit that processes block numbers.

## Short Description of the Exploit



## Proposed Mitigation

To fix the incorrect block number constraints in the PI circuit, the declarations for index_cells and block_number_cell, as well as the equality constraints, should be moved outside of the for loop that processes the table assignments. This ensures that the constraints are applied correctly to the entire block table.


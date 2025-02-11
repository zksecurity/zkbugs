# The CallDataRLC value in the fixed assignments is not validated against the actual calldata in Tx Circuit (Not Reproduce)

* Id: scroll-tech/zkevm-circuits/zellic_The_CallDataRLC_value_in_the_fixed_assignments_is_not_validated_against_the_actual_calldata_in_Tx_Circuit
* Project: https://github.com/scroll-tech/zkevm-circuits
* Commit: 0x25dd32aa316ec842ffe79bb8efe9f05f86edc33e
* Fix Commit: 2e422878e0d78f769e08f0b1ad1275ee039362d5
* DSL: Halo2
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Assigned but Unconstrained
* Reproduced: False
* Location
  - Path: TxCircuit
  - Function: 
  - Line: 42
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/zellic-scroll-2.pdf
  - Bug ID: The CallDataRLC value in the fixed assignments is not validated against the actual calldata in Tx Circuit
* Commands
  - Setup Environment: ``
  - Reproduce: ``
  - Compile and Preprocess: ``
  - Positive Test: ``
  - Find Exploit: ``
  - Clean: ``

## Short Description of the Vulnerability

The bug refers to the lack of validation for the CallDataRLC value against the actual calldata in the Tx Circuit. This issue could lead to discrepancies where the calldata used may differ from what is expected, potentially undermining contract integrity. It has been identified as critical due to its high likelihood of occurrence.

## Short Description of the Exploit



## Proposed Mitigation

The recommended fix for the bug regarding the CallDataRLC value is to add a check to ensure the consistency between the CallDataRLC and the calldata part of the Tx Circuit layout via a lookup argument.


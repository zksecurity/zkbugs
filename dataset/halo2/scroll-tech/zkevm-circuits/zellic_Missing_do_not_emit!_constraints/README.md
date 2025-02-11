# Missing do_not_emit! constraints (Not Reproduce)

* Id: scroll-tech/zkevm-circuits/zellic_Missing_do_not_emit!_constraints
* Project: https://github.com/scroll-tech/zkevm-circuits
* Commit: 0x25dd32aa316ec842ffe79bb8efe9f05f86edc33e
* Fix Commit: 2e422878e0d78f769e08f0b1ad1275ee039362d5
* DSL: Halo2
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Wrong translation of logic into constraints
* Reproduced: False
* Location
  - Path: rlp_circuit_fsm.rs
  - Function: 
  - Line: 25
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/zellic-scroll-2.pdf
  - Bug ID: Missing do_not_emit! constraints
* Commands
  - Setup Environment: ``
  - Reproduce: ``
  - Compile and Preprocess: ``
  - Positive Test: ``
  - Find Exploit: ``
  - Clean: ``

## Short Description of the Vulnerability

The bug 'Missing do_not_emit! constraints' refers to the absence of necessary constraints in the RLP circuit's state transition from DecodeTagStart to LongList. Specifically, the do_not_emit! macro, which ensures that the output is marked as false for rows not representing a complete tag value, is not applied in this transition. This oversight can lead to the RlpFsmRlpTable having invalid rows with output incorrectly set to true, posing a critical security risk.

## Short Description of the Exploit



## Proposed Mitigation

Add the missing `do_not_emit!` constraints in the `DecodeTagStart => LongList` transition to ensure that `is_output` is set to false for rows that do not represent a full tag value.


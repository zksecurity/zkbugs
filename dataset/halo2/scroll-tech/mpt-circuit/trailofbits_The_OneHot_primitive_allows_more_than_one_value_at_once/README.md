# The OneHot primitive allows more than one value at once (Not Reproduce)

* Id: scroll-tech/mpt-circuit/trailofbits_The_OneHot_primitive_allows_more_than_one_value_at_once
* Project: https://github.com/scroll-tech/mpt-circuit
* Commit: 0xfc6c8a2972870e62e96cde480b3aa48c0cc1303d
* Fix Commit: 34af759e94f4b342507778145e7ae364a6d5566e
* DSL: Halo2
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Missing Input Constraints
* Reproduced: False
* Location
  - Path: constraint_builder/binary_column.rs
  - Function: 
  - Line: 29-37
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/trailofbits-scroll-2.pdf
  - Bug ID: The OneHot primitive allows more than one value at once
* Commands
  - Setup Environment: ``
  - Reproduce: ``
  - Compile and Preprocess: ``
  - Positive Test: ``
  - Find Exploit: ``
  - Clean: ``

## Short Description of the Vulnerability

The bug regarding the "OneHot" primitive indicates that it permits multiple values to be set simultaneously, despite its intended functionality to enforce exclusivity among its options. This lack of constraint allows a malicious prover to potentially manipulate key values within the Merkle path-checking state machine, compromising its integrity. A fix has since been implemented to enforce constraints ensuring that only one value can be active at a time.

## Short Description of the Exploit



## Proposed Mitigation

To fix the issue with the OneHot primitive allowing more than one value at once, enforce constraints that ensure each binary column value is Boolean, specifically by adding the condition 1 - v.or(!v) == 0.


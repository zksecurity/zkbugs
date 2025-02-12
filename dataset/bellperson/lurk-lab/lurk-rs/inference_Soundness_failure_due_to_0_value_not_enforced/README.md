# Soundness failure due to 0 value not enforced (Not Reproduce)

* Id: lurk-lab/lurk-rs/inference_Soundness_failure_due_to_0_value_not_enforced
* Project: https://github.com/lurk-lab/lurk-rs
* Commit: 0x5c92c6a37856f43cb23bcfce59443da9d0ce0061
* Fix Commit: 
* DSL: Bellperson
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Assigned but Unconstrained
* Reproduced: False
* Location
  - Path: src/circuits
  - Function: selector_dot_product
  - Line: 
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/inference-lurk.pdf
  - Bug ID: Soundness failure due to 0 value not enforced
* Commands
  - Setup Environment: ``
  - Reproduce: ``
  - Compile and Preprocess: ``
  - Positive Test: ``
  - Find Exploit: ``
  - Clean: ``

## Short Description of the Vulnerability

The bug "Soundness failure due to 0 value not enforced" occurred because the variable 'zero' in the selector_dot_product() function was allocated but not enforced to be zero. This variable was used as the default in pick(), allowing the final result to be manipulated. The issue was addressed in commit 4a61333 by passing a previously allocated zero variable from the global store, ensuring it remained unaltered throughout the operation.

## Short Description of the Exploit



## Proposed Mitigation

The bug identified as 'Soundness failure due to 0 value not enforced' was fixed by passing a previously allocated zero variable from the global store to ensure it correctly enforces the zero value. This adjustment was made as recorded in commit 4a61333.


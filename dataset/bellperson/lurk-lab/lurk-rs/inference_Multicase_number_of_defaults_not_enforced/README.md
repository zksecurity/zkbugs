# Multicase number of defaults not enforced (Not Reproduce)

* Id: lurk-lab/lurk-rs/inference_Multicase_number_of_defaults_not_enforced
* Project: https://github.com/lurk-lab/lurk-rs
* Commit: 0x5c92c6a37856f43cb23bcfce59443da9d0ce0061
* Fix Commit: edcda9760a66088db78f64994513fa19d67caa79
* DSL: Bellperson
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Wrong translation of logic into constraints
* Reproduced: False
* Location
  - Path: src/circuits
  - Function: apply_continuation
  - Line: 
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/inference-lurk.pdf
  - Bug ID: Multicase number of defaults not enforced
* Commands
  - Setup Environment: ``
  - Reproduce: ``
  - Compile and Preprocess: ``
  - Positive Test: ``
  - Find Exploit: ``
  - Clean: ``

## Short Description of the Vulnerability

The bug "Multicase number of defaults not enforced" refers to an issue in the 'apply_continuation()' function in Lurk's circuit logic, where it incorrectly sized the default argument for the 'multi_case' function. This misalignment resulted in some constraints not being properly enforced. The problem was rectified by supplying the correct number of arguments and adding an assertion to detect incorrect usage in the future.

## Short Description of the Exploit



## Proposed Mitigation

The recommended fix for the bug 'Multicase number of defaults not enforced' is providing the correct number of arguments to the function and adding an assertion to detect incorrect usage in the future. This was implemented in commit edcda97.


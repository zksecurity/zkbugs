# Zero padding not enforced (Not Reproduce)

* Id: lurk-lab/neptune/inference_Zero_padding_not_enforced
* Project: https://github.com/lurk-lab/neptune
* Commit: 0x5c92c6a37856f43cb23bcfce59443da9d0ce0061
* Fix Commit: 2415d641dcbdab17b3264d2254705a382c86ce73
* DSL: Bellperson
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Assigned but Unconstrained
* Reproduced: False
* Location
  - Path: filecoin-project/neptune/src/circuit2.rs
  - Function: poseidon_hash_allocated
  - Line: 
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/inference-lurk.pdf
  - Bug ID: Zero padding not enforced
* Commands
  - Setup Environment: ``
  - Reproduce: ``
  - Compile and Preprocess: ``
  - Positive Test: ``
  - Find Exploit: ``
  - Clean: ``

## Short Description of the Vulnerability

The bug "Zero padding not enforced" refers to an issue in the function poseidon_hash_allocated() within the neptune library, where padding with newly allocated zero variables was not enforced to be zero in scenarios where hash_type is ConstantLength and the length is smaller than the arity. This flaw potentially allowed for hash manipulation that could still pass Poseidon validation checks. It was fixed by constraining the padding values to be zero using a new function enforce_zero().

## Short Description of the Exploit



## Proposed Mitigation

The recommended fix for the bug "Zero padding not enforced" is to ensure that zero padding values are constrained to be zero, using the function `enforce_zero()`. This fix was implemented in commit 2415d64.


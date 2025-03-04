# Missing constraint in PIL leading to proving fake inclusion in the SMT (Not Reproduce)

* Id: 0xPolygonHermez/zkevm-proverjs/hexens_Missing_constraint_in_PIL_leading_to_proving_fake_inclusion_in_the_SMT
* Project: https://github.com/0xPolygonHermez/zkevm-proverjs
* Commit: 0x313dc
* Fix Commit: 40d1846b50aa6b9e006a85fde99261a8c5c7b8f2
* DSL: PIL
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Missing Input Constraints
* Reproduced: False
* Location
  - Path: storage.pil
  - Function: 
  - Line: 
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/hexens-polygonzkevm.pdf
  - Bug ID: Missing constraint in PIL leading to proving fake inclusion in the SMT
* Commands
  - Setup Environment: ``
  - Reproduce: ``
  - Compile and Preprocess: ``
  - Positive Test: ``
  - Find Exploit: ``
  - Clean: ``

## Short Description of the Vulnerability

The bug involves a missing binary constraint in the polynomial identity layer (PIL) of a storage state machine using Sparse Merkle Tree (SMT), which is crucial for proving (Key, Value) pair inclusions. Due to the absent constraint, it's theoretically possible to manipulate the key path traversal in the SMT proof process, enabling the proof of a fake key-value binding. This can lead to incorrect validations and potentially fraudulent activities. The PIL implementation overlooked enforcing that the key representation in traversing operations strictly adheres to binary values (0 or 1), inadvertently permitting other values that could jeopardize the integrity of tree traversal and proof verification operations. The remedy was to add a required binary constraint to ensure key traversal operations and their validations remain secure and accurate.

## Short Description of the Exploit



## Proposed Mitigation

The recommended fix for the bug 'Missing constraint in PIL leading to proving fake inclusion in the SMT' is to add the missing binary constraint.


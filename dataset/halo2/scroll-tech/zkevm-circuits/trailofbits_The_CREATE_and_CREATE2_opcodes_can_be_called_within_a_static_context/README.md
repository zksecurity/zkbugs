# The CREATE and CREATE2 opcodes can be called within a static context (Not Reproduce)

* Id: scroll-tech/zkevm-circuits/trailofbits_The_CREATE_and_CREATE2_opcodes_can_be_called_within_a_static_context
* Project: https://github.com/scroll-tech/zkevm-circuits
* Commit: 0xe8bcb23e1f303bd6e0dc52924b0ed85710b8a016
* Fix Commit: 66e8458ad6b55447e17de7f715e4395be943d682483be4a945b51f98a4cc50ae
* DSL: Halo2
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Misimplementation of a Specification
* Reproduced: False
* Location
  - Path: zkevm-circuits/src/evm_circuit/execution/create.rs
  - Function: 
  - Line: 39
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/trailofbits-scroll.pdf
  - Bug ID: The CREATE and CREATE2 opcodes can be called within a static context
* Commands
  - Setup Environment: ``
  - Reproduce: ``
  - Compile and Preprocess: ``
  - Positive Test: ``
  - Find Exploit: ``
  - Clean: ``

## Short Description of the Vulnerability

The bug involves the CREATE and CREATE2 opcodes being callable within a static context, which is not allowed according to the EVM specification. Currently, there are no constraints in place to prevent these state-changing operations from being executed when the context is static, potentially allowing for unintended state changes. This could enable malicious proofs leading to state divergence.

## Short Description of the Exploit



## Proposed Mitigation

Add a constraint to the CREATE and CREATE2 opcodes to validate that they are not called within a static call context, ensuring compliance with EVM specifications that prohibit state-changing operations during static calls. Additionally, implement tests for these opcodes when invoked within a STATICCALL context.


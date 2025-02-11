# The “invalid creation” error handling circuit is unconstrained (Not Reproduce)

* Id: scroll-tech/zkevm-circuits/trailofbits_The_“invalid_creation”_error_handling_circuit_is_unconstrained
* Project: https://github.com/scroll-tech/zkevm-circuits
* Commit: 0xfc6c8a2972870e62e96cde480b3aa48c0cc1303d
* Fix Commit: 799450ce1434270c27e98916817935586369d8c8
* DSL: Halo2
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Wrong translation of logic into constraints
* Reproduced: False
* Location
  - Path: evm_circuit/execution/error_invalid_creation_code.rs
  - Function: 
  - Line: 36
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/trailofbits-scroll-2.pdf
  - Bug ID: The “invalid creation” error handling circuit is unconstrained
* Commands
  - Setup Environment: ``
  - Reproduce: ``
  - Compile and Preprocess: ``
  - Positive Test: ``
  - Find Exploit: ``
  - Clean: ``

## Short Description of the Vulnerability

The "invalid creation" error handling circuit is unconstrained, which means it does not enforce the expected condition that the first byte of the actual memory should be 0xef. This lack of constraint allows a malicious prover to redirect EVM execution to a halt state after the CREATE opcode is executed, enabling potential exploitation. Immediate action is needed to bind the first byte witness to the relevant memory value to prevent this issue.

## Short Description of the Exploit



## Proposed Mitigation

Short-term, bind the first_byte witness value to the memory value to ensure it equals 0xef after the CREATE opcode is called. Long-term, generate malicious traces to add to the test suite for soundness verification whenever an issue is found.


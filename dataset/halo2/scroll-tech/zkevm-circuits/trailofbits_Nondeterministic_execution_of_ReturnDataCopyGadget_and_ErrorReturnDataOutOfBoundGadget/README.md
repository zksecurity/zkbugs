# Nondeterministic execution of ReturnDataCopyGadget and ErrorReturnDataOutOfBoundGadget (Not Reproduce)

* Id: scroll-tech/zkevm-circuits/trailofbits_Nondeterministic_execution_of_ReturnDataCopyGadget_and_ErrorReturnDataOutOfBoundGadget
* Project: https://github.com/scroll-tech/zkevm-circuits
* Commit: 0xe8bcb23e1f303bd6e0dc52924b0ed85710b8a016
* Fix Commit: 48172be100d36c89256fd55337997a56ba26d711
* DSL: Halo2
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Wrong translation of logic into constraints
* Reproduced: False
* Location
  - Path: zkevm-circuits/src/evm_circuit/execution/returndatacopy.rs
  - Function: 
  - Line: 52
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/trailofbits-scroll.pdf
  - Bug ID: Nondeterministic execution of ReturnDataCopyGadget and ErrorReturnDataOutOfBoundGadget
* Commands
  - Setup Environment: ``
  - Reproduce: ``
  - Compile and Preprocess: ``
  - Positive Test: ``
  - Find Exploit: ``
  - Clean: ``

## Short Description of the Vulnerability

The bug "Nondeterministic execution of ReturnDataCopyGadget and ErrorReturnDataOutOfBoundGadget" involves a failure in the constraints of the ReturnDataCopy opcode, allowing a malicious prover to execute the opcode even when in an error state with certain inputs. This can lead to a situation where the prover can arbitrarily choose to either successfully execute or halt, resulting in state divergence from the correct EVM execution. The recommendation is to implement constraints to ensure that successful execution states are disjoint from error execution states, safeguarding against exploitation.

## Short Description of the Exploit



## Proposed Mitigation

To resolve the nondeterministic execution of the ReturnDataCopyGadget and ErrorReturnDataOutOfBoundGadget, add constraints to ensure that the successful execution state is disjoint from the error execution state, preventing a malicious prover from selecting either path during execution. Additionally, investigate other error states to guarantee their disjoint nature with associated opcode implementations.


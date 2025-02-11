# Underconstrained warm status on CALL opcodes allows gas cost forgery (Not Reproduce)

* Id: scroll-tech/zkevm-circuits/trailofbits_Underconstrained_warm_status_on_CALL_opcodes_allows_gas_cost_forgery
* Project: https://github.com/scroll-tech/zkevm-circuits
* Commit: 0xe8bcb23e1f303bd6e0dc52924b0ed85710b8a016
* Fix Commit: e72a6a818cbda6c14cb551573432e59fe61ce109345dd4c088508a60c27979af
* DSL: Halo2
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Assigned but Unconstrained
* Reproduced: False
* Location
  - Path: zkevm-circuits/src/evm_circuit/execution/callop.rs
  - Function: 
  - Line: 129-138
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/trailofbits-scroll.pdf
  - Bug ID: Underconstrained warm status on CALL opcodes allows gas cost forgery
* Commands
  - Setup Environment: ``
  - Reproduce: ``
  - Compile and Preprocess: ``
  - Positive Test: ``
  - Find Exploit: ``
  - Clean: ``

## Short Description of the Vulnerability

The bug 'Underconstrained warm status on CALL opcodes allows gas cost forgery' highlights a vulnerability in the zkevm-circuits where a malicious prover can manipulate the status of an address (cold or warm) during the execution of CALL-like opcodes. This allows the prover to set an address as cold erroneously, which leads to incorrect gas cost calculations for subsequent calls, potentially resulting in state divergence and financial losses. The recommendation is to add constraints to ensure that the address becomes warm as required by the EVM specification.

## Short Description of the Exploit



## Proposed Mitigation

Add constraints to ensure that the callee address becomes warm on the CALL opcodes by constraining the variable controlling the warm status to true. Additionally, ensure initial values for access list reads reflect correct warm status as specified in the EVM documentation.


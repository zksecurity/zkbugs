# The RlpU64Gadget is underconstrained when is_lt_128 is false (Not Reproduce)

* Id: scroll-tech/zkevm-circuits/trailofbits_The_RlpU64Gadget_is_underconstrained_when_is_lt_128_is_false
* Project: https://github.com/scroll-tech/zkevm-circuits
* Commit: 0xe8bcb23e1f303bd6e0dc52924b0ed85710b8a016
* Fix Commit: 2a69a55562336a54ce2b1a13748db7cf807c8e2a
* DSL: Halo2
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Wrong translation of logic into constraints
* Reproduced: False
* Location
  - Path: zkevm-circuits/src/evm_circuit/util/math_gadget/rlp.rs
  - Function: 
  - Line: 67
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/trailofbits-scroll.pdf
  - Bug ID: The RlpU64Gadget is underconstrained when is_lt_128 is false
* Commands
  - Setup Environment: ``
  - Reproduce: ``
  - Compile and Preprocess: ``
  - Positive Test: ``
  - Find Exploit: ``
  - Clean: ``

## Short Description of the Vulnerability

The bug 'The RlpU64Gadget is underconstrained when is_lt_128 is false' indicates that the RlpU64Gadget circuit, which validates RLP-encoded values, lacks a constraint to ensure that when the is_lt_128 flag is false, the value is above 127. This oversight could allow a malicious prover to manipulate the value encoding, resulting in incorrect deserialization and potential state divergence in the zkEVM context. Recommendations include adding a constraint to verify that the value exceeds this threshold when is_lt_128 is false.

## Short Description of the Exploit



## Proposed Mitigation

To fix the bug 'The RlpU64Gadget is underconstrained when is_lt_128 is false', add a constraint to ensure that the value is above 127 when is_lt_128 is false. Long-term, implement negative tests to ensure that mismatched witness values and is_lt_128 do not satisfy the circuit constraints.


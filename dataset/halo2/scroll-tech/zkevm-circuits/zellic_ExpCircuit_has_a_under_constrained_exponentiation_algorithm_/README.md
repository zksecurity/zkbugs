# ExpCircuit has a under-constrained exponentiation algorithm  (Not Reproduce)

* Id: scroll-tech/zkevm-circuits/zellic_ExpCircuit_has_a_under-constrained_exponentiation_algorithm_
* Project: https://github.com/scroll-tech/zkevm-circuits
* Commit: 0xf3ebc6af0e5049d2f45259ef79741f9c7d7794e1
* Fix Commit: 9b46ddbf01393ad845e48dea77de55b9358074da
* DSL: Halo2
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Wrong translation of logic into constraints
* Reproduced: False
* Location
  - Path: zkevm-circuits/src/exp-circuit.rs
  - Function: 
  - Line: 19
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/zellic-scroll.pdf
  - Bug ID: ExpCircuit has a under-constrained exponentiation algorithm 
* Commands
  - Setup Environment: ``
  - Reproduce: ``
  - Compile and Preprocess: ``
  - Positive Test: ``
  - Find Exploit: ``
  - Clean: ``

## Short Description of the Vulnerability

The bug in the ExpCircuit involves an under-constrained exponentiation algorithm where checks do not ensure that the appropriate conditions related to the exponent (specifically its parity) are met, potentially allowing incorrect calculations with malicious witness values. Although this issue does not compromise security or correctness directly, it affects the algorithm's efficiency and could lead to incorrect results in certain circumstances. A recommendation is made to add checks to verify that the first argument to the parity check is correct based on the exponent's value.

## Short Description of the Exploit



## Proposed Mitigation

The recommended fix for the under-constrained exponentiation algorithm in ExpCircuit is to add a constraint to check that the first argument to the parity check MulAdd gadget is 2 when the parity is even (c=0).


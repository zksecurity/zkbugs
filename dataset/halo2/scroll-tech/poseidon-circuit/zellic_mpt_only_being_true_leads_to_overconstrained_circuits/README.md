# mpt_only being true leads to overconstrained circuits (Not Reproduce)

* Id: scroll-tech/poseidon-circuit/zellic_mpt_only_being_true_leads_to_overconstrained_circuits
* Project: https://github.com/scroll-tech/poseidon-circuit
* Commit: 0xf3ebc6af0e5049d2f45259ef79741f9c7d7794e1
* Fix Commit: 912f5ed2c6cacd64a0006e868e3cb4b624acc019
* DSL: Halo2
* Vulnerability: Over-Constrained
* Impact: Completeness
* Root Cause: Other Programming Errors
* Reproduced: False
* Location
  - Path: src/hash.rs
  - Function: 
  - Line: 11
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/zellic-scroll.pdf
  - Bug ID: mpt_only being true leads to overconstrained circuits
* Commands
  - Setup Environment: ``
  - Reproduce: ``
  - Compile and Preprocess: ``
  - Positive Test: ``
  - Find Exploit: ``
  - Clean: ``

## Short Description of the Vulnerability

The bug regarding 'mpt_only' being true leads to overconstrained circuits in the Poseidon hashing implementation means that when the mpt_only flag is set to true, the circuit incorrectly constrains certain input values to zero. This results in any hashing attempts with non-zero inputs failing the ZKP verification, potentially limiting the functionality of the circuit. The issue arises from an incorrect ordering in the logic that enables the custom row within the circuit.

## Short Description of the Exploit



## Proposed Mitigation

Change the order of the two logic statements related to mpt_only so that it correctly enables the custom gate logic. Specifically, update it as follows: if self.mpt_only { return Ok(1); } config.s_custom.enable(region, 1)?;


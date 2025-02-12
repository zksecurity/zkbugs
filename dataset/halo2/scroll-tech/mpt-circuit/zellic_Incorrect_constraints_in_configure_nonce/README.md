# Incorrect constraints in configure_nonce (Not Reproduce)

* Id: scroll-tech/mpt-circuit/zellic_Incorrect_constraints_in_configure_nonce
* Project: https://github.com/scroll-tech/mpt-circuit
* Commit: 0x25dd32aa316ec842ffe79bb8efe9f05f86edc33e
* Fix Commit: 9aeff02e4d86e9bbecd0e420ebd3ed13a824e094
* DSL: Halo2
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Wrong translation of logic into constraints
* Reproduced: False
* Location
  - Path: MPTCircuit/gadgets/mpt_update.rs
  - Function: 
  - Line: 56
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/zellic-scroll-2.pdf
  - Bug ID: Incorrect constraints in configure_nonce
* Commands
  - Setup Environment: ``
  - Reproduce: ``
  - Compile and Preprocess: ``
  - Positive Test: ``
  - Find Exploit: ``
  - Clean: ``

## Short Description of the Vulnerability

The bug "Incorrect constraints in configure_nonce" involves issues in the MPT circuit's configure_nonce function, where the checks for the new nonce size are incorrectly based on the old nonce value. This misconfiguration can lead to improper validations of nonce values, potentially allowing invalid nonces to be accepted, which may make accounts susceptible to denial-of-service attacks. The issue was acknowledged, and a fix has been implemented.

## Short Description of the Exploit



## Proposed Mitigation

Fix the typos in the range check for the nonce in `configure_nonce` to correctly check the new nonce size instead of the old nonce when the segment type is AccountLeaf3 and the path type is Common, as well as addressing range checks for the new nonce in other conditions.


# Insufficient zkVM validation of multi-step instruction modes (Not Reproduce)

* Id: risc0/risc0/ghsa-5c79-r6x7-3jx9
* Project: https://github.com/risc0/risc0
* Commit: a165a6e3443fbc2e4f7093d7552399cd56337928
* Fix Commit: 1e6ca468f3fb94ef6939b4f7875848312a708528
* DSL: risc0
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Missing Constraint
* Reproduced: False
* Location
  - Path: risc0/circuit/rv32im-sys/cxx/step_exec.cpp
  - Function: step_exec
  - Line: 6053-6063 (example of cross-cycle validation; 16+ similar blocks throughout file missing in buggy version)
* Source: GitHub Security Advisory
  - Source Link: https://github.com/risc0/risc0/security/advisories/GHSA-5c79-r6x7-3jx9
  - Bug ID: GHSA-5c79-r6x7-3jx9: Insufficient zkVM validation of multi-step instruction modes
* Commands
  - Setup Environment: `./zkbugs_setup.sh`
  - Reproduce: ``
  - Compile and Preprocess: ``
  - Positive Test: ``
  - Find Exploit: ``
  - Clean: `./zkbugs_clean.sh`

## Short Description of the Vulnerability

Certain RISC-V instructions require multiple zkVM cycles for execution. During the first cycle of a multi-cycle instruction, the zkVM sets a major_mode which tells the zkVM how to continue the instruction during the subsequent cycle. Prior to v1.1.0, the zkVM circuit lacked constraints to ensure that the major mode had definitively been set by the previous instruction, including missing nextMajor register, majorMux component, and extern functions (extern_isTrap, extern_setUserMode) for mode validation. This under-constrained circuit could potentially allow invalid proofs to verify.

## Short Description of the Exploit

Potential attack would require manipulating the major mode during multi-cycle RISC-V instruction execution without proper constraints to generate invalid proofs that successfully verify.

## Proposed Mitigation

Fixed in v1.1.0 (commit 1e6ca468f from Aug 2, 2024) by comprehensive circuit update adding: (1) nextMajor register to BodyStep, (2) majorMux and majorSelect components, (3) extern_isTrap and extern_setUserMode functions. Advisory published Sep 25, 2024 recommends >= v1.1.1. Official verifier contracts deprecated verification of <1.1.1 receipts as of October 31, 2024.


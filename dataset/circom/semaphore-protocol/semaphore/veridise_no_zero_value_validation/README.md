# No Zero Value Validation

* Id: semaphore-protocol/semaphore/veridise-V-SEM-VUL-001
* Project: https://github.com/semaphore-protocol/semaphore
* Commit: 27320f17233b18de477a74919084fba76513470f
* Fix Commit: 
* DSL: Circom
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Missing Input Constraints
* Reproduced: True
* Location
  - Path: circuits/semaphore.circom
  - Function: Semaphore
  - Line: 47-88
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/veridise-semaphore.pdf
  - Bug ID: V-SEM-VUL-001: No Zero Value Validation
* Commands
  - Setup Environment: `./zkbugs_setup.sh`
  - Reproduce: `./zkbugs_exploit.sh`
  - Compile and Preprocess: `./zkbugs_compile_setup.sh`
  - Positive Test: `./zkbugs_positive_test.sh`
  - Find Exploit: `./zkbugs_find_exploit.sh`
  - Clean: `./zkbugs_clean.sh`

## Short Description of the Vulnerability

The bug in the Semaphore protocol involves the use of a zeroValue in incremental Merkle trees, which acts as an implicit group member. This zeroValue cannot be removed, and its addition does not trigger a MemberAdded event, making it invisible in membership records. This allows the group creator guaranteed access, which can be problematic if the admin changes. Additionally, if common values like 0 are compromised, they could be used to gain unauthorized access to groups.

## Short Description of the Exploit

generateInput.js gives all necessary inputs for the incremental merkle tree. In real-world attack, identityNullifier and identityTrapdoor should be correct values corresponding to `zeroValue` membership in the incremental merkle tree. Here we just use 0 to represent them. The actual checks are in the solidity contracts.

## Proposed Mitigation

Disallow proofs where the leaf corresponds to the zeroValue to ensure only legitimate users are added.


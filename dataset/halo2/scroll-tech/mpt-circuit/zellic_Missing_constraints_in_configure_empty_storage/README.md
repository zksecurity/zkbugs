# Missing constraints in configure_empty_storage (Not Reproduce)

* Id: scroll-tech/mpt-circuit/zellic_Missing_constraints_in_configure_empty_storage
* Project: https://github.com/scroll-tech/mpt-circuit
* Commit: 0x25dd32aa316ec842ffe79bb8efe9f05f86edc33e
* Fix Commit: 3ab166a4a62329ec42d44cd63fc9563ff29dea4e
* DSL: Halo2
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Wrong translation of logic into constraints
* Reproduced: False
* Location
  - Path: MPTCircuit/gadgets/mpt_update.rs
  - Function: 
  - Line: 54
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/zellic-scroll-2.pdf
  - Bug ID: Missing constraints in configure_empty_storage
* Commands
  - Setup Environment: ``
  - Reproduce: ``
  - Compile and Preprocess: ``
  - Positive Test: ``
  - Find Exploit: ``
  - Clean: ``

## Short Description of the Vulnerability

The bug "Missing constraints in configure_empty_storage" refers to the absence of a check ensuring that the old and new hashes are identical for empty storage entries in the MPT circuit. This is similar to the existing constraints in the "configure_empty_account" function, which ensures the same condition is met. Without this check, there could be soundness issues when proving the non-existence of storage.

## Short Description of the Exploit



## Proposed Mitigation

To fix the missing constraints in `configure_empty_storage`, ensure that the old_hash and new_hash are equal for an empty storage entry, similar to the existing check in `configure_empty_account`. Adding this check will help avoid soundness issues when proving that storage does not exist.


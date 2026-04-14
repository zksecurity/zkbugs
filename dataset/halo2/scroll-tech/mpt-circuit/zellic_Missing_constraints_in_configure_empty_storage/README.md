# Missing constraints in configure_empty_storage

* Id: scroll-tech/mpt-circuit/zellic_Missing_constraints_in_configure_empty_storage
* Project: https://github.com/scroll-tech/mpt-circuit
* Commit: 0x25dd32aa316ec842ffe79bb8efe9f05f86edc33e
* Fix Commit: 3ab166a4a62329ec42d44cd63fc9563ff29dea4e
* DSL: Halo2
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Wrong Translation of Logic into Constraints
* Reproduced: False
* Codebase: 
* Original Entrypoint: (same as direct)
* Direct Entrypoint: 
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

## Running

Scripts support two modes controlled by the `ZKBUGS_MODE` environment variable:

- **`original`** (default): compiles the project's main circuit from the full codebase.
- **`direct`**: compiles an isolated wrapper (`circuit.circom`) that only instantiates the vulnerable template.

```bash
# Setup (run once)
./zkbugs_setup.sh

# Compile only (no zkey ceremony)
./zkbugs_compile.sh                        # original mode
ZKBUGS_MODE=direct ./zkbugs_compile.sh     # direct mode

# Full setup with zkey ceremony + positive test (direct mode)
ZKBUGS_MODE=direct ./zkbugs_compile_setup.sh
ZKBUGS_MODE=direct ./zkbugs_positive_test.sh

# Clean build artifacts
./zkbugs_clean.sh
```

## Short Description of the Vulnerability

The bug "Missing constraints in configure_empty_storage" refers to the absence of a check ensuring that the old and new hashes are identical for empty storage entries in the MPT circuit. This is similar to the existing constraints in the "configure_empty_account" function, which ensures the same condition is met. Without this check, there could be soundness issues when proving the non-existence of storage.

## Proposed Mitigation

To fix the missing constraints in `configure_empty_storage`, ensure that the old_hash and new_hash are equal for an empty storage entry, similar to the existing check in `configure_empty_account`. Adding this check will help avoid soundness issues when proving that storage does not exist.

# Add missing public input for replica-id

* Id: filecoin-project/rust-fil-proofs/trapdoor_Add_missing_public_input_for_replica-id
* Project: https://github.com/filecoin-project/rust-fil-proofs
* Commit: 8efe93
* Fix Commit: a4c25bedaaa3099e89770d704ba3bee2cbec87c3fd7e4f5fabbcb1bce7aa9fce
* DSL: Bellperson
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Circuit Design Issue
* Reproduced: False
* Codebase: 
* Original Entrypoint: (same as direct)
* Direct Entrypoint: 
* Location
  - Path: storage-proofs/src/porep/stacked/vanilla/challenges.rs
  - Function: derive_internal
  - Line: 
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/trapdoor-filecoin-disclosure.pdf
  - Bug ID: Add missing public input for replica-id
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

The bug in PoREP V25 was that the "replica_id" was not included as a public input in the proof circuit. This omission allowed for the use of a forged "replica_id" in the SDR calculation process, meaning an attacker could pre-compute the SDR values using a fake "replica_id" and bypass the intended security mechanism. Consequently, this flaw could lead to the reuse of one SDR replica calculation across multiple sectors, fundamentally undermining the integrity of the system.

## Proposed Mitigation

The recommended fix for the vulnerability is to include the replica_id as a public input in the PoREP circuit to ensure that the SDR calculation is legitimately tied to a specified replica_id, not just any replica_id. This change would prevent the exploitation where one fixed replica_id could be used for calculations across different sectors.

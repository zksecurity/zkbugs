# Incorrect constraints in configure_nonce

* Id: scroll-tech/mpt-circuit/zellic_Incorrect_constraints_in_configure_nonce
* Project: https://github.com/scroll-tech/mpt-circuit
* Commit: 0x25dd32aa316ec842ffe79bb8efe9f05f86edc33e
* Fix Commit: 9aeff02e4d86e9bbecd0e420ebd3ed13a824e094
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

The bug "Incorrect constraints in configure_nonce" involves issues in the MPT circuit's configure_nonce function, where the checks for the new nonce size are incorrectly based on the old nonce value. This misconfiguration can lead to improper validations of nonce values, potentially allowing invalid nonces to be accepted, which may make accounts susceptible to denial-of-service attacks. The issue was acknowledged, and a fix has been implemented.

## Proposed Mitigation

Fix the typos in the range check for the nonce in `configure_nonce` to correctly check the new nonce size instead of the old nonce when the segment type is AccountLeaf3 and the path type is Common, as well as addressing range checks for the new nonce in other conditions.

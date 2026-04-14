# Missing constraint for the first tx_id in Tx Circuit

* Id: scroll-tech/zkevm-circuits/zellic_Missing_constraint_for_the_first_tx_id_in_Tx_Circuit
* Project: https://github.com/scroll-tech/zkevm-circuits
* Commit: 0x25dd32aa316ec842ffe79bb8efe9f05f86edc33e
* Fix Commit: 2e422878e0d78f769e08f0b1ad1275ee039362d5
* DSL: Halo2
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Missing Input Constraints
* Reproduced: False
* Codebase: 
* Original Entrypoint: (same as direct)
* Direct Entrypoint: 
* Location
  - Path: TxCircuit
  - Function: 
  - Line: 40
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/zellic-scroll-2.pdf
  - Bug ID: Missing constraint for the first tx_id in Tx Circuit
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

The bug "Missing constraint for the first tx_id in Tx Circuit" refers to the absence of a check ensuring that the initial transaction ID (tx_id) starts at 1 in the Tx Circuit. While the transitions for tx_id have been implemented correctly, there is currently no enforcement that establishes the first tx_id as equal to 1, potentially allowing it to begin at any arbitrary value. It has been recommended to add this constraint to guarantee that the first tx_id is consistently set to 1.

## Proposed Mitigation

Add a constraint to check that the first tx_id is equal to 1 in the Tx Circuit. Remediation has already been acknowledged and implemented by Scroll in commit 2e422878.

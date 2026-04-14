# Missing range checks for the LtChip

* Id: scroll-tech/zkevm-circuits/zellic_Missing_range_checks_for_the_LtChip
* Project: https://github.com/scroll-tech/zkevm-circuits
* Commit: 0x25dd32aa316ec842ffe79bb8efe9f05f86edc33e
* Fix Commit: d0e7a07e8af25220623564ef1c3ed101ce63220e
* DSL: Halo2
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Missing Input Constraints
* Reproduced: False
* Codebase: 
* Original Entrypoint: (same as direct)
* Direct Entrypoint: 
* Location
  - Path: RLPCircuit
  - Function: 
  - Line: 17
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/zellic-scroll-2.pdf
  - Bug ID: Missing range checks for the LtChip
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

The bug "Missing range checks for the LtChip" indicates that the LtChip is not ensuring that the difference columns fall within a specified byte range, which delegates this check to other circuits utilizing this chip. This oversight compromises the proper functionality of the LtChip, leading to potential failures in comparison operations within the relevant circuits. Recommendations include adding necessary range checks to ensure safe usage of the comparison gadgets.

## Proposed Mitigation

Add the necessary range checks for the diff columns in the LtChip to ensure they are within the byte range, and implement checks in the TxCircuit to verify that tx_id and cum_num_txs are within specified limits.

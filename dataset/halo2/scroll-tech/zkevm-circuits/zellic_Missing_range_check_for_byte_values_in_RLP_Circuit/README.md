# Missing range check for byte values in RLP Circuit

* Id: scroll-tech/zkevm-circuits/zellic_Missing_range_check_for_byte_values_in_RLP_Circuit
* Project: https://github.com/scroll-tech/zkevm-circuits
* Commit: 0x25dd32aa316ec842ffe79bb8efe9f05f86edc33e
* Fix Commit: 2e422878e0d78f769e08f0b1ad1275ee039362d5
* DSL: Halo2
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Wrong Translation of Logic into Constraints
* Reproduced: False
* Codebase: 
* Original Entrypoint: (same as direct)
* Direct Entrypoint: 
* Location
  - Path: rlp_circuit_fsm.rs
  - Function: 
  - Line: 14
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/zellic-scroll-2.pdf
  - Bug ID: Missing range check for byte values in RLP Circuit
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

The bug involves a missing range check for byte values in the RLP Circuit, specifically in the RLP circuit's data table, where the byte values are currently only validated for padding rows and not for actual data rows. This oversight allows byte values to potentially exceed the expected range of [0, 256), which can lead to incorrect behavior in the circuit. The issue has been identified as critical and has already been acknowledged by the Scroll team, with a fix implemented.

## Proposed Mitigation

The recommended fix for the bug 'Missing range check for byte values in RLP Circuit' is to change the condition to ensure that the actual data rows' byte values are properly range-checked by modifying the check to exclude padding rows.

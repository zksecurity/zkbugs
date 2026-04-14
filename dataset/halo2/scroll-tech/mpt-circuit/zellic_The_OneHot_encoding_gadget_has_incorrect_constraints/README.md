# The OneHot encoding gadget has incorrect constraints

* Id: scroll-tech/mpt-circuit/zellic_The_OneHot_encoding_gadget_has_incorrect_constraints
* Project: https://github.com/scroll-tech/mpt-circuit
* Commit: 0x25dd32aa316ec842ffe79bb8efe9f05f86edc33e
* Fix Commit: 9bd18782c19b5f5b2a2410b80f1ace6cd9637dcb
* DSL: Halo2
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Incorrect Custom Gates
* Reproduced: False
* Codebase: 
* Original Entrypoint: (same as direct)
* Direct Entrypoint: 
* Location
  - Path: MPTCircuit
  - Function: 
  - Line: 43
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/zellic-scroll-2.pdf
  - Bug ID: The OneHot encoding gadget has incorrect constraints
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

The bug in the OneHot encoding gadget involves incorrect constraints due to a helper function that mistakenly queries the current row's binary columns instead of the previous row's values. This flaw can lead to the generation of invalid proofs in the MPT (Merkle Patricia Tree) Circuit. A fix has been acknowledged and implemented by Scroll to address this issue.

## Proposed Mitigation

The OneHot encoding gadget has incorrect constraints due to querying the value of the binary columns representing the one-hot encoding at the current row instead of the previous row. It is recommended to fix this by using BinaryColumn::previous to query the previous row.

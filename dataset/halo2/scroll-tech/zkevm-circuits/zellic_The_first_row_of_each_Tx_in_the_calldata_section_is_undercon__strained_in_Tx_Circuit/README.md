# The first row of each Tx in the calldata section is undercon- strained in Tx Circuit

* Id: scroll-tech/zkevm-circuits/zellic_The_first_row_of_each_Tx_in_the_calldata_section_is_undercon-_strained_in_Tx_Circuit
* Project: https://github.com/scroll-tech/zkevm-circuits
* Commit: 0x25dd32aa316ec842ffe79bb8efe9f05f86edc33e
* Fix Commit: 
* DSL: Halo2
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Wrong Translation of Logic into Constraints
* Reproduced: False
* Codebase: 
* Original Entrypoint: (same as direct)
* Direct Entrypoint: 
* Location
  - Path: TxCircuit
  - Function: 
  - Line: 30
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/zellic-scroll-2.pdf
  - Bug ID: The first row of each Tx in the calldata section is undercon- strained in Tx Circuit
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

The bug described is that the first row of each transaction in the calldata section of the Tx Circuit is underconstrained, meaning there are no checks ensuring the starting index is 0 and appropriating the accurate initial calldata gas cost. This could allow the index and gas cost values to be manipulated, leading to incorrect data processing for transactions. Appropriate constraints should be added to rectify this issue.

## Proposed Mitigation

The recommended fix for the bug "The first row of each Tx in the calldata section is underconstrained in Tx Circuit" is to add the necessary constraints for the first row to ensure that index = 0 and calldata_gas_cost_acc is set correctly based on the value of the first calldata byte. This would prevent malicious changes to the index and calldata_gas_cost for the first row of the transaction.

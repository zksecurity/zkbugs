# ChainId is not mapped to it’s corresponding RLP Tag in Tx Circuit

* Id: scroll-tech/zkevm-circuits/zellic_ChainId_is_not_mapped_to_it’s_corresponding_RLP_Tag_in_Tx_Circuit
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
  - Path: TxCircuit/tx_circuit.rs
  - Function: 
  - Line: 64
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/zellic-scroll-2.pdf
  - Bug ID: ChainId is not mapped to it’s corresponding RLP Tag in Tx Circuit
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

The bug 'ChainId is not mapped to its corresponding RLP Tag in Tx Circuit' indicates that within the Tx Circuit, the ChainId field is incorrectly set to Null in the mapping of TxFieldTag values. This oversight means that the ChainId is omitted during lookups needed for verifying transaction signatures, potentially allowing a scenario where the ChainId value could be neglected for transaction signatures. It is recommended to add the appropriate mapping and ensure ChainId is included in RLP lookups.

## Proposed Mitigation

Recommend adding the mapping from TxFieldTag: ChainID to the RLPTag: ChainId and ensure the ChainID value in the TxTable is looked up in the RLPTable using this mapping.

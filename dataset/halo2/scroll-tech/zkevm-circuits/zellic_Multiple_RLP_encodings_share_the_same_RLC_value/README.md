# Multiple RLP encodings share the same RLC value

* Id: scroll-tech/zkevm-circuits/zellic_Multiple_RLP_encodings_share_the_same_RLC_value
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
  - Path: RLPCircuit/rlp_circuit_fsm.rs
  - Function: 
  - Line: 68
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/zellic-scroll-2.pdf
  - Bug ID: Multiple RLP encodings share the same RLC value
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

The bug report indicates that multiple RLP encodings can yield the same Random Linear Combination (RLC) value when using the formula for calculating RLC, as this formula does not account for the potential addition of arbitrary leading zeroes to an RLP tag. This creates a vulnerability where an attacker can prepend zero bytes to an encoded transaction without altering the calculated RLC value. The recommendation for mitigating this issue involves adding a separate column to track the length of the RLP tag, ensuring that the combination of RLC value and tag length remains unique.

## Proposed Mitigation

The recommended fix for the bug "Multiple RLP encodings share the same RLC value" is to add an additional column, `tag_length`, which contains the number of bytes in an RLP tag, ensuring that the combination of `(bytes_rlc, tag_length)` will always correspond to unique RLP tags.

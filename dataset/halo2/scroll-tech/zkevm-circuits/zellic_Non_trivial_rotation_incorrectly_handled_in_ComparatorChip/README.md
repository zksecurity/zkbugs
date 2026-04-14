# Non-trivial rotation incorrectly handled in ComparatorChip

* Id: scroll-tech/zkevm-circuits/zellic_Non-trivial_rotation_incorrectly_handled_in_ComparatorChip
* Project: https://github.com/scroll-tech/zkevm-circuits
* Commit: 0xf3ebc6af0e5049d2f45259ef79741f9c7d7794e1
* Fix Commit: 21f887d2ce44c4dc42c5ccae80c5ed94a6930954
* DSL: Halo2
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Unsafe Reuse of Circuit
* Reproduced: False
* Codebase: 
* Original Entrypoint: (same as direct)
* Direct Entrypoint: 
* Location
  - Path: gadgets/src/comparator.rs
  - Function: 
  - Line: 25
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/zellic-scroll.pdf
  - Bug ID: Non-trivial rotation incorrectly handled in ComparatorChip
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

The bug 'Non-trivial rotation incorrectly handled in ComparatorChip' pertains to an issue in the implementation of comparison logic where the equality check does not account for rotation, leading to incorrect results during comparisons involving non-trivial rotations. This flaw can result in the generation of incorrect expressions in the circuit, potentially affecting circuit behavior. The recommendation is to either fix the comparison function or clearly document its limitations regarding rotations.

## Proposed Mitigation

To fix the bug 'Non-trivial rotation incorrectly handled in ComparatorChip', the implementation of the `expr` function should be corrected to account for the rotation, or alternatively, it should be documented that the `eq_chip` result should not be used for a non-trivial rotation.

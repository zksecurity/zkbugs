# Unsound fixed-point addition

* Id: penumbra-zone/penumbra/zksecurity_Unsound_fixed-point_addition
* Project: https://github.com/penumbra-zone/penumbra
* Commit: 0xa43b594
* Fix Commit: ddab070acff5567f23eb36a4a877358f2c062d9b
* DSL: Arkworks
* Vulnerability: Computational Issues
* Impact: Soundness
* Root Cause: Wrong Translation of Logic into Constraints
* Reproduced: False
* Codebase: 
* Original Entrypoint: (same as direct)
* Direct Entrypoint: 
* Location
  - Path: core/num
  - Function: checked_add
  - Line: 
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/zksecurity-penumbra.pdf
  - Bug ID: Unsound fixed-point addition
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

The bug 'Unsound fixed-point addition' involves a fault in the fixed-point arithmetic used in Penumbra's logic. The `checked_add` function in `U128x128Var`, a 256-bit type, underconstrains some operations, potentially leading to incorrect results. This function converts limbs to field values and adds them, tracking carry for each limb and ensuring no overflow. However, the carry bit, resulting from adding two 64-bit values that produce a 65-bit result, is not properly managed. This improper handling could erroneously set all carry bits (`c1`) to zero during proving, leading to unsound additions in certain scenarios.

## Proposed Mitigation

To fix the issue of unsound fixed-point addition in Penumbra's circuits, Penumbra released a fix that correctly computes each limb in the circuit.

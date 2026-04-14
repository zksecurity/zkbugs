# Unsound fixed-point multiplication

* Id: penumbra-zone/penumbra/zksecurity_Unsound_fixed-point_multiplication
* Project: https://github.com/penumbra-zone/penumbra
* Commit: 0xa43b594
* Fix Commit: 1fdbe1ea10a270180c035aeb8bb7f4a3ff25d99e
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
  - Function: U128x128Var::checked_mul
  - Line: 
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/zksecurity-penumbra.pdf
  - Bug ID: Unsound fixed-point multiplication
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

The 'Unsound fixed-point multiplication' bug occurs when scaling two fixed-point values in the multiplication operation, leading to improper computation of the result due to incorrect limb handling. This error is critical as it impacts the accuracy of fixed-point arithmetic operations in the system, specifically in the context of financial calculations where precision is paramount. The issue lies in incorrectly accounting for overflow and implementing the truncation step required to maintain precision, essentially failing to scale back the multiplied result properly.

## Proposed Mitigation

Penumbra fixed the issue of unsound fixed-point multiplication by correctly constraining the limbs in the circuit.

# Unsafe use of Num2Bits in multiple circuits

* Id: iden3/circuits/trailofbits_unsafe_use_of_num2bits_in_multiple_circuits
* Project: https://github.com/iden3/circuits
* Commit: 7a1e04de3e5f3a9f0cfb27a43c9f41c986c1b9ed
* Fix Commit: 
* DSL: Circom
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Wrong Translation of Logic into Constraints
* Reproduced: False
* Codebase: dataset/codebases/circom/iden3/circuits/7a1e04de3e5f3a9f0cfb27a43c9f41c986c1b9ed
* Original Entrypoint: (same as direct)
* Direct Entrypoint: circuit.circom
* Location
  - Path: circuits/lib/utils/claimUtils.circom
  - Function: Num2Bits
  - Line: 123
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/trailofbits-iden3-circuits.pdf
  - Bug ID: TOB-IDEN3-1
* Input
  - Original: input.json
  - Direct: direct_input.json
* Commands
  - Setup Environment: `./zkbugs_setup.sh`
  - Compile and Preprocess: `./zkbugs_compile_setup.sh`
  - Positive Test: `./zkbugs_positive_test.sh`
  - Clean: `./zkbugs_clean.sh`
  - Compile: `./zkbugs_compile.sh`

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

Multiple circuits call `Num2Bits(254)` and `Num2Bits(256)` when working with field elements of the BN-254 prime field. These templates do not enforce uniqueness of the bit decompositions, allowing malicious provers to bypass token expiration or revocation.

## Proposed Mitigation

Update the circuits to use `Num2Bits_strict()` instead of `Num2Bits(254)` or `Num2Bits(256)`.

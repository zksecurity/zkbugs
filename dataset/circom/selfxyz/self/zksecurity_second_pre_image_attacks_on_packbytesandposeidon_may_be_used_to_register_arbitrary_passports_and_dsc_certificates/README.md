# Second Pre-Image Attacks On PackBytesAndPoseidon May Be Used To Register Arbitrary Passports And DSC Certificates

* Id: selfxyz/self/zksecurity_second_pre_image_attacks_on_packbytesandposeidon_may_be_used_to_register_arbitrary_passports_and_dsc_certificates
* Project: https://github.com/selfxyz/self
* Commit: 629dfdad1a867eb82ccba6857a545f3ef838e123
* Fix Commit: 
* DSL: Circom
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Missing Input Constraints
* Reproduced: False
* Codebase: dataset/codebases/circom/selfxyz/self/629dfdad1a867eb82ccba6857a545f3ef838e123
* Entrypoint: TODO_ENTRYPOINT
* Direct Entrypoint: circuit.circom
* Location
  - Path: circuits/circuits/utils/passport/customHashers.circom
  - Function: PackBytesAndPoseidon
  - Line: 54-60
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/zksecurity-self-aadhaar-circuits.pdf
  - Bug ID: #01 - Second Pre-Image Attacks On PackBytesAndPoseidon May Be Used To Register Arbitrary Passports And DSC Certificates
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

The function `PackBytesAndPoseidon(k)` in CustomHashers.circom is susceptible to a second pre-image attack: given an input x, an input y can be found such that `PackBytesAndPoseidon(k)(x) == PackBytesAndPoseidon(k)(y)` where y is not an array of bytes, but an array of arbitrary field elements. For example consider [0, 1, 0] and [256, 0, 0] they both compute [256] as an intermediate value (output of PackBytes bytes.circom). This intermediate value is later passed to the `CustomHasher` function: because the intermediate value is identical, both inputs will yield the same hash.

## Proposed Mitigation

We recommend that the ranges of the bytes array are checked inside `PackBytesAndPoseidon`.

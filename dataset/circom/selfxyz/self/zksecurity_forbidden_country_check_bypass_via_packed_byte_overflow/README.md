# Forbidden Country Check Bypass via Packed Byte Overflow

* Id: selfxyz/self/zksecurity_forbidden_country_check_bypass_via_packed_byte_overflow
* Project: https://github.com/selfxyz/self
* Commit: 3905a30aeb19016d22c5493b8b34ade2d118da4e
* Fix Commit: ['60501d17ee9b339e36c3a2a0d63f24bda65110a8', '4914074d11d1d6e4579c7fa4d20c0eae4fc1e02f']
* DSL: Circom
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Wrong Translation of Logic into Constraints
* Reproduced: False
* Codebase: dataset/codebases/circom/selfxyz/self/3905a30aeb19016d22c5493b8b34ade2d118da4e
* Original Entrypoint: circuits/circuits/disclose/generated/vc_and_disclose_aadhaar_main.circom
* Direct Entrypoint: circuit.circom
* Location
  - Path: circuits/circuits/utils/aadhaar/disclose/country_not_in_list.circom
  - Function: CountryNotInList
  - Line: 12-29
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/zksecurity-self-aadhaar-circuits.pdf
  - Bug ID: #00 - Forbidden Country Check Bypass via Packed Byte Overflow
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

The elements of `forbidden_countries_list` are not range‑checked to be bytes, which means PackBytes allows for aliasing.

## Proposed Mitigation

Add explicit byte range constraints, for example using `AssertBytes`, on every country code element before passing them to `PackBytes` in `CountryNotInList`.

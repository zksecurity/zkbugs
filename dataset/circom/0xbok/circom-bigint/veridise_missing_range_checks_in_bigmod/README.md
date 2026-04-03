# Missing range checks in BigMod

* Id: 0xbok/circom-bigint/veridise-V-BIGINT-COD-001
* Project: https://github.com/0xbok/circom-bigint
* Commit: 436665bf01728ae8c581fdb39e8428cb6b835c37
* Fix Commit: d3edd7503f48f98a71b6013c248ef3ad55e19703
* DSL: Circom
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Arithmetic Field Issues
* Reproduced: False
* Codebase: dataset/codebases/circom/0xbok/circom-bigint/436665bf01728ae8c581fdb39e8428cb6b835c37
* Original Entrypoint: test/circuits/test_bigmod_22.circom
* Direct Entrypoint: circuit.circom
* Location
  - Path: circuits/bigint.circom
  - Function: BigMod
  - Line: 363-417
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/veridise-circomlib.pdf
  - Bug ID: V-BIGINT-COD-001: Missing range checks in BigMod
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

The bug in the BigMod template arises from missing range checks on the remainder `mod[i]`, allowing it to exceed the expected range of `2**n`. This underconstrained error can be exploited by providing inputs that result in a remainder larger than `2^n`, potentially compromising the integrity of the circuit. Proper range checks are applied to the quotient `div[i]`, but not to `mod[i]`, leaving the system vulnerable to malicious inputs that break the invariant of the modulus operation.

## Proposed Mitigation

Add additional range checking constraints for `mod[i]`. This can be done using the Num2Bits template.

# Big Integer Zero-Check Is Not Sound

* Id: selfxyz/self/zksecurity_big_integer_zero_check_is_not_sound
* Project: https://github.com/selfxyz/self
* Commit: 4f18c75041bb47c1862169eef82c22067642a83a
* Fix Commit: 
* DSL: Circom
* Vulnerability: Computational Issues
* Impact: Soundness
* Root Cause: Wrong Translation of Logic into Constraints
* Reproduced: False
* Codebase: dataset/codebases/circom/selfxyz/self/4f18c75041bb47c1862169eef82c22067642a83a
* Original Entrypoint: circuits/circuits/register_id/instances/register_id_sha256_sha256_sha256_rsa_65537_4096.circom
* Direct Entrypoint: circuit.circom
* Location
  - Path: circuits/circuits/utils/crypto/bigInt/bigIntComparators.circom
  - Function: BigIntIsZero
  - Line: 05-26
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/zksecurity-celo-self-audit.pdf
  - Bug ID: #02 - Big Integer Zero-Check Is Not Sound
* Input
  - Original: input.json
  - Direct: direct_input.json
* Commands
  - Setup Environment: `./zkbugs_setup.sh`
  - Compile: `./zkbugs_compile.sh`
  - Compile and Preprocess: `./zkbugs_compile_setup.sh`
  - Positive Test: `./zkbugs_positive_test.sh`
  - Clean: `./zkbugs_clean.sh`

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

One of the core operation that is used throughout the big integer implementation is the assertion for a zero element. It is implemented in the template `BigIntIsZero` and is used in multiple places in the library. It does so by first accumulating the carries, then range checking the final carry value and then asserting that the final carry is the opposite of the most significant chunk. However, the accumulation of the carries is performed over the native field, so the entire relation is checked modulo the Circom native prime. This bug does not compromise completeness, as the zero integer will still be considered as zero modulo the native prime. However, this check is not sound, as a non-zero integer, which is zero mod native prime, will be considered zero by the library.

## Proposed Mitigation

 It is recommended that the Big Integer Library used for ECDSA Verification is either carefully reviewed for such issues and fixed, or it is replaced by a more mature implementation.

# Underconstrained points in MontgomeryAdd

* Id: iden3/circomlib/veridise-V-CIRCOMLIB-VUL-004
* Project: https://github.com/iden3/circomlib
* Commit: cff5ab6288b55ef23602221694a6a38a0239dcc0
* Fix Commit: 
* DSL: Circom
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Missing Input Constraints
* Reproduced: False
* Codebase: dataset/codebases/circom/iden3/circomlib/cff5ab6288b55ef23602221694a6a38a0239dcc0
* Original Entrypoint: (same as direct)
* Direct Entrypoint: circuit.circom
* Location
  - Path: circuits/montgomery.circom
  - Function: MontgomeryAdd
  - Line: 16-17
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/veridise-circomlib.pdf
  - Bug ID: V-CIRCOMLIB-VUL-004: Underconstrained points in MontgomeryAdd
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

Lambda calculation involves a division but there is no constraint on the divisor to be non-zero. In this case `out[1]` is underconstrained and can be set to any value.

## Proposed Mitigation

Send `in2[0] - in1[0]` to `isZero` template and let the constraint there do the work.

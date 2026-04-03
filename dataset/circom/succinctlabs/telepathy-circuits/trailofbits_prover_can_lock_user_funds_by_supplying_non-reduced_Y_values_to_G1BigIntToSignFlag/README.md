# Prover can lock user funds by supplying non-reduced Y values to G1BigIntToSignFlag

* Id: succinctlabs/telepathy-circuits/trailofbits-succinct-2
* Project: https://github.com/succinctlabs/telepathy-circuits
* Commit: b0c839cef30c3c25ef41d1ad3000081784766934
* Fix Commit: 1a88e657932edc59b51e35095618f1e1a46ceef6
* DSL: Circom
* Vulnerability: Under-Constrained
* Impact: Completeness
* Root Cause: Unsafe Reuse of Circuit
* Reproduced: False
* Codebase: dataset/codebases/circom/succinctlabs/telepathy-circuits/b0c839cef30c3c25ef41d1ad3000081784766934
* Entrypoint: TODO_ENTRYPOINT
* Direct Entrypoint: circuit.circom
* Location
  - Path: circuits/bls.circom
  - Function: G1BigIntToSignFlag
  - Line: 198-227
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/trailofbits-telepathy.pdf
  - Bug ID: 2. Prover can lock user funds by supplying non-reduced Y values to G1BigIntToSignFlag
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

`G1BigIntToSignFlag` fails to check if the y-coordinate is properly reduced mod p. This missing of range check allows malicious prover to lock user funds by supplying a non-reduced y-coordinate, which can be manipulated to have a positive sign when it should be negative. This manipulation can prevent future provers from generating valid proofs, effectively halting the LightClient and trapping user funds in the bridge.

## Proposed Mitigation

Constrain the `pubkeysBigIntY` values to be less than `p` using `BigLessThan` template.

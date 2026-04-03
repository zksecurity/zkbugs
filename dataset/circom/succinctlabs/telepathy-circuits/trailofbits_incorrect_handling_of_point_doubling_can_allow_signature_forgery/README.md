# Incorrect handling of point doubling can allow signature forgery

* Id: succinctlabs/telepathy-contracts
* Project: https://github.com/succinctlabs/telepathy-circuits
* Commit: b0c839cef30c3c25ef41d1ad3000081784766934
* Fix Commit: 
* DSL: Circom
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Unsafe Reuse of Circuit
* Reproduced: False
* Codebase: dataset/codebases/circom/succinctlabs/telepathy-circuits/b0c839cef30c3c25ef41d1ad3000081784766934
* Original Entrypoint: circuits/step.circom
* Direct Entrypoint: circuit.circom
* Location
  - Path: circuits/curve.circom
  - Function: EllipticCurveAddUnequal
  - Line: 155-227
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/trailofbits-telepathy.pdf
  - Bug ID: 3. Incorrect handling of point doubling can allow signature forgery
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

`G1Add` calls `EllipticCurveAddUnequal`. The template `EllipticCurveAddUnequal` assumes input `a` and `b` are two unequal public keys but this is not checked. Attacker can use two same public keys to do sophisticated attacks. In such scenario, the constraint on output in `EllipticCurveAddUnequal` reduces to 0 = 0 so it is always true. In other words, attacker can do point doubling at a place where it is supposed to do point addition of two unequal EC points.

## Proposed Mitigation

Change `G1Add` to use `EllipticCurveAdd`, which correctly handles equal inputs by checking and managing point doubling.

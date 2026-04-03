# Prover can lock user funds by including ill-formed BigInts in public key commitment

* Id: succinctlabs/telepathy-circuits/trailofbits-succinct-1
* Project: https://github.com/succinctlabs/telepathy-circuits
* Commit: b0c839cef30c3c25ef41d1ad3000081784766934
* Fix Commit: 1a88e657932edc59b51e35095618f1e1a46ceef6
* DSL: Circom
* Vulnerability: Under-Constrained
* Impact: Completeness
* Root Cause: Unsafe Reuse of Circuit
* Reproduced: False
* Codebase: dataset/codebases/circom/succinctlabs/telepathy-circuits/b0c839cef30c3c25ef41d1ad3000081784766934
* Original Entrypoint: circuits/step.circom
* Direct Entrypoint: circuit.circom
* Location
  - Path: circuits/pairing/bls12_381_hash_to_G2
  - Function: SubgroupCheckG1WithValidX
  - Line: 723-731
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/trailofbits-telepathy.pdf
  - Bug ID: 1. Prover can lock user funds by including ill-formed BigInts in public key comitment
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

The `Rotate()` template in rotate.circom fails to validate the format of BigInts in public keys. SubgroupCheckG1WithValidX assumes that its input is a properly formed BigInt, with all limbs less than 2**55. This property is not validated anywhere in the `Rotate()` template. It allows a malicious prover to manipulate public keys by inserting ill-formed BigInts, specifically by altering the y-coordinate of public keys. This manipulation can lock user funds by preventing future provers from generating valid proofs, as the circuit uses these malformed keys without proper validation. The exploit involves modifying the y coordinate in a public key to create an invalid commitment, which then updates the system's commitment state, potentially leading to incorrect or fraudulent operations.

## Proposed Mitigation

Use `Num2Bits()` template to verify that each limb of the `pubkeysBigIntY`, witness value is less than 2**55.

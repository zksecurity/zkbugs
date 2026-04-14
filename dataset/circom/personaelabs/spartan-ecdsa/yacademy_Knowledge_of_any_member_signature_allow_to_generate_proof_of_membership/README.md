# Knowledge of any member signature allow to generate proof of membership

* Id: personaelabs/spartan-ecdsa/yacademy_Knowledge_of_any_member_signature_allow_to_generate_proof_of_membership
* Project: https://github.com/personaelabs/spartan-ecdsa
* Commit: 3386b30d9b5b62d8a60735cbeab42bfe42e80429
* Fix Commit: 
* DSL: Circom
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Circuit Design Issue
* Reproduced: False
* Codebase: dataset/codebases/circom/personaelabs/spartan-ecdsa/3386b30d9b5b62d8a60735cbeab42bfe42e80429
* Original Entrypoint: packages/circuits/instances/pubkey_membership.circom
* Direct Entrypoint: circuit.circom
* Location
  - Path: packages/circuits/eff_ecdsa_membership/pubkey_membership.circom
  - Function: PubKeyMembership
  - Line: 17-46
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/yacademy-spartan.md
  - Bug ID: Knowledge of any member signature allow to generate proof of membership
* Input
  - Original: input.json
  - Direct: direct_input.json
* Commands
  - Setup Environment: ``
  - Compile and Preprocess: ``
  - Positive Test: ``
  - Clean: ``
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

The `PubKeyMembership` template derives a public key from ECDSA parameters via `EfficientECDSA()` and checks it against a Merkle tree root. However, the inputs `Tx`, `Ty`, `Ux`, `Uy` are unconstrained private inputs that can be freely chosen by the prover. Since `pubKey = s * T + U`, an attacker who knows any valid member signature `s` can pick arbitrary `T` and `U` values to derive any target public key in the Merkle tree, generating a valid membership proof without being a member.

## Proposed Mitigation

Bind the ECDSA verification inputs to a specific message and public key. The circuit should constrain that the signature corresponds to a known message, preventing the prover from freely choosing `Tx`, `Ty`, `Ux`, `Uy` to target arbitrary public keys.

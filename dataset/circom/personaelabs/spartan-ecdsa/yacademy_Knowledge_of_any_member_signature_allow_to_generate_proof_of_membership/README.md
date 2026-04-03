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
  - Line: 
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

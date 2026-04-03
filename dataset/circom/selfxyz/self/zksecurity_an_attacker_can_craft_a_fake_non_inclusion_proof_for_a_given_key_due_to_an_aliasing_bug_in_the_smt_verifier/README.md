# An attacker can craft a fake non-inclusion proof for a given key due to an aliasing bug in the SMT verifier

* Id: selfxyz/self/zksecurity_an_attacker_can_craft_a_fake_non_inclusion_proof_for_a_given_key_due_to_an_aliasing_bug_in_the_smt_verifier
* Project: https://github.com/selfxyz/self
* Commit: 4f18c75041bb47c1862169eef82c22067642a83a
* Fix Commit: 99e8eece5e0867017ca076731fba63ed96ae4711
* DSL: Circom
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Wrong Translation of Logic into Constraints
* Reproduced: False
* Codebase: dataset/codebases/circom/selfxyz/self/4f18c75041bb47c1862169eef82c22067642a83a
* Original Entrypoint: circuits/circuits/register_id/instances/register_id_sha256_sha256_sha256_rsa_65537_4096.circom
* Direct Entrypoint: circuit.circom
* Location
  - Path: circuits/circuits/utils/crypto/merkle-trees/smt.circom
  - Function: SMTVerify
  - Line: 18-67
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/zksecurity-celo-self-audit-2.pdf
  - Bug ID: #00 - An attacker can craft a fake non-inclusion proof for a given key due to an aliasing bug in the SMT verifier
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

The `Num2Bits(254)` component presents an aliasing issue. The Num2Bits circuit in circomlib, witnesses the binary representation in the `out` array, and then checks that the recomposed value matches the input `in`. This computation is done modulo the field size, which is smaller than 2^254. Therefore, for approximately a quarter of the possible keys, an attacker can witness a different binary representation of the key.

## Proposed Mitigation

We recommend replacing the `Num2Bits` component with `Num2Bits_strict`, which does not have the aliasing issue.

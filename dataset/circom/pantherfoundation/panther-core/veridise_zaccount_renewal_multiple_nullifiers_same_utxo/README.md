# zAccountRenewalV1 Can Validate Multiple Nullifiers for the Same UTXO Commitment

* Id: pantherfoundation/panther-core/veridise_zaccount_renewal_multiple_nullifiers_same_utxo
* Project: https://github.com/pantherfoundation/panther-core
* Commit: b464348b33155a5877f67c085c7206dc29ad7cb7
* Fix Commit: 903edd3
* DSL: Circom
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Missing Input Constraints
* Reproduced: False
* Codebase: dataset/codebases/circom/pantherfoundation/panther-core/b464348b33155a5877f67c085c7206dc29ad7cb7
* Original Entrypoint: circuits/circuits/mainZAccountRenewalV1.circom
* Direct Entrypoint: circuit.circom
* Location
  - Path: circuits/circuits/zAccountRenewalV1.circom
  - Function: ZAccountRenewalV1
  - Line: 320-330
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/veridise-panther.pdf
  - Bug ID: V-PAN-VUL-002: zAccountRenewalV1 can validate multiple nullifiers for the same UTXO commitment
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

In the `ZAccountRenewalV1` template (zAccountRenewalV1.circom), the nullifier derivation uses `zAccountUtxoInNullifierHasher.privKey <== zAccountUtxoInNullifierPrivKey` and `zAccountUtxoInNullifierHasher.commitment <== zAccountUtxoInNoteHasher.out`, and the circuit later compares the hashed output against the public `zAccountUtxoInNullifier` input via `ForceEqualIfEnabled()`. However, there is **no constraint enforcing that `zAccountUtxoInNullifierPubKey[2]` is derived from `zAccountUtxoInNullifierPrivKey`**. Because `zAccountUtxoInNullifierPubKey[2]` is a separate input to the hash that builds the zAccount note commitment, the circuit accepts any `zAccountUtxoInNullifierPrivKey` that hashes to a valid nullifier — the key pair does not have to be consistent. An attacker can renew the same zAccount UTXO commitment multiple times using different `zAccountUtxoInNullifierPrivKey` values, each producing a distinct nullifier. Because the renewal flow also lets users deposit and withdraw ZKP, this enables draining the pool by re-spending the same UTXO.

## Proposed Mitigation

Add constraints that enforce `zAccountUtxoInNullifierPubKey[2]` to be derived from `zAccountUtxoInNullifierPrivKey` via `BabyPbk` — e.g., instantiate a `BabyPbk` with `in <== zAccountUtxoInNullifierPrivKey` and force `Ax === zAccountUtxoInNullifierPubKey[0]` and `Ay === zAccountUtxoInNullifierPubKey[1]`.

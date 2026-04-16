# Nullifier Verification Can Be Disabled in ZSwapV1

* Id: pantherfoundation/panther-core/veridise_nullifier_verification_can_be_disabled
* Project: https://github.com/pantherfoundation/panther-core
* Commit: b464348b33155a5877f67c085c7206dc29ad7cb7
* Fix Commit: 69db60e
* DSL: Circom
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Circuit Design Issue
* Reproduced: False
* Codebase: dataset/codebases/circom/pantherfoundation/panther-core/b464348b33155a5877f67c085c7206dc29ad7cb7
* Original Entrypoint: circuits/circuits/mainZSwapV1.circom
* Direct Entrypoint: circuit.circom
* Location
  - Path: circuits/circuits/zSwapV1.circom
  - Function: ZSwapV1
  - Line: 680-690
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/veridise-panther.pdf
  - Bug ID: V-PAN-VUL-004: Nullifier verification can be disabled
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

In the `ZSwapV1` template (zSwapV1.circom around line 680-690), the nullifier of the zAccount input UTXO is checked via:
```
component zAccountUtxoInNullifierHasherProver = ForceEqualIfEnabled();
zAccountUtxoInNullifierHasherProver.in[0] <== zAccountUtxoInNullifier;
zAccountUtxoInNullifierHasherProver.in[1] <== zAccountUtxoInNullifierHasher.out;
zAccountUtxoInNullifierHasherProver.enabled <== zAccountUtxoInSpendPrivKey;
```
The `enabled` signal of `ForceEqualIfEnabled()` is wired to `zAccountUtxoInSpendPrivKey`. An attacker can set `zAccountUtxoInSpendPrivKey = 0` — which is a valid private key that derives the neutral/infinity public key `(0, 1)` via `BabyPbk` — and this disables the entire nullifier check, allowing any value for `zAccountUtxoInNullifier`. Because this nullifier is what prevents a zAccount input UTXO from being spent twice, an attacker can spend the same zAccount UTXO infinitely many times by producing arbitrary fresh nullifier values.

## Proposed Mitigation

Always enforce the nullifier verification by setting `zAccountUtxoInNullifierHasherProver.enabled <== 1;` instead of gating it on `zAccountUtxoInSpendPrivKey`.

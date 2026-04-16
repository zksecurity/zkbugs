# Babyjubjub Suborder Constraints Not Applied Correctly

* Id: pantherfoundation/panther-core/veridise_babyjubjub_suborder_constraints_not_applied_correctly
* Project: https://github.com/pantherfoundation/panther-core
* Commit: b464348b33155a5877f67c085c7206dc29ad7cb7
* Fix Commit: 8fdab18
* DSL: Circom
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Missing Input Constraints
* Reproduced: False
* Codebase: dataset/codebases/circom/pantherfoundation/panther-core/b464348b33155a5877f67c085c7206dc29ad7cb7
* Original Entrypoint: circuits/circuits/mainZTransactionV1.circom
* Direct Entrypoint: circuit.circom
* Location
  - Path: circuits/circuits/templates/utils.circom
  - Function: BabyJubJubSubOrderTag
  - Line: 964-975
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/veridise-panther.pdf
  - Bug ID: V-PAN-VUL-001: Babyjubjub suborder constraints not applied correctly
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

The template `BabyJubJubSubOrderTag(isActive)` in `utils.circom` is meant to tag its input as being less than the BabyJubJub suborder `2736030358979909402780800718157159386076813972158567259200215660948447373041`. Internally it instantiates `LessThan(251)` with inputs `in` and `suborder`, but **never constrains the output of `LessThan` to be `1`** (`n2b.out === 1` is missing) and never range-checks `in` to 251 bits. As a result the tag is vacuously applied: any field element — including `suborder + 1` — can be assigned to a signal tagged `sub_order_bj_sf`. Because `zAccountUtxoInNullifierPrivKey` is one of the signals this tag is applied to and it feeds `BabyPbk()` to derive `zAccountUtxoInNullifierPubKey` and the UTXO nullifier, an attacker can use both `privKey = 1` and `privKey = suborder + 1` to derive the same public key (they map to the same subgroup element) and generate two distinct nullifiers for the same UTXO commitment, double-spending the UTXO. Additionally, without a 251-bit input range-check, `LessThan(251)` can itself overflow and return non-deterministic results.

## Proposed Mitigation

Inside `BabyJubJubSubOrderTag`, (1) add `n2b.out === 1;` to force the `LessThan(251)` comparison to hold, and (2) add a `Num2Bits(251)` range-check on the input `in` so that `LessThan(251)` cannot overflow.

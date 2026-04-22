# Spend missing range checks on GreaterEqThan inputs

* Id: worm-privacy/proof-of-burn/koukyosyumei_spend_missing_range_check
* Project: https://github.com/worm-privacy/proof-of-burn
* Commit: 0802485d24fed18fe063e51bcbb0bc830585855f
* Fix Commit: 90772b1c9fe73d1452e047fe49ca4fdc346472a0
* DSL: Circom
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Missing Input Constraints
* Reproduced: False
* Codebase: dataset/codebases/circom/worm-privacy/proof-of-burn/0802485d24fed18fe063e51bcbb0bc830585855f
* Original Entrypoint: circuits/spend.circom
* Direct Entrypoint: circuit.circom
* Location
  - Path: circuits/spend.circom
  - Function: Spend
  - Line: 42-45
* Source: GitHub Issue
  - Source Link: https://github.com/worm-privacy/proof-of-burn/issues/1
  - Bug ID: #1: Spend missing range checks on GreaterEqThan inputs
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

In `Spend()`, the balance check uses `GreaterEqThan(252)` on `balance` and `withdrawnBalance` without first constraining either input to fit in 252 bits. `GreaterEqThan(N)` assumes both inputs are < 2^N and is known to return incorrect results when this assumption is violated (see circomlib's `comparator-overflow` advisory). Because `balance` and `withdrawnBalance` are arbitrary BN254 field elements, a prover can choose `withdrawnBalance` close to the field prime — e.g., `withdrawnBalance = 21888242871839275222246405745257275088548364400416034343698204186575808495579` with `balance = 0` — so that `sufficientBalanceChecker.out === 1` holds even though the intended unsigned comparison `balance >= withdrawnBalance` does not. The remaining `Hasher()` chain (`coinHasher`, `remainingCoinHasher`) still commits, letting a malicious prover create a valid `Spend` proof for an invalid withdrawal where `balance < withdrawnBalance`. The bug was surfaced by zkFuzz (https://github.com/Koukyosyumei/zkFuzz).

## Proposed Mitigation

Range-check both inputs to `GreaterEqThan` to be less than 2^maxAmountBits before the comparison. The fix commit (90772b1c) replaces `GreaterEqThan(252)` with `AssertGreaterEqThan(maxAmountBits)` (introduced in `circuits/utils/assert.circom`) and parameterizes `Spend(maxAmountBits)`, instantiating it as `Spend(200)` so `balance` and `withdrawnBalance` are constrained to 200-bit values — far below the 252-bit overflow boundary.

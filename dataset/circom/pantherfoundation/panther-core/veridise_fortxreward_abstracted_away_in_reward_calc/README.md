# forTxReward Gets Abstracted Away in the Reward Calculation

* Id: pantherfoundation/panther-core/veridise_fortxreward_abstracted_away_in_reward_calc
* Project: https://github.com/pantherfoundation/panther-core
* Commit: b464348b33155a5877f67c085c7206dc29ad7cb7
* Fix Commit: 1055906
* DSL: Circom
* Vulnerability: Computational Issues
* Impact: Soundness
* Root Cause: Wrong Translation of Logic into Constraints
* Reproduced: False
* Codebase: dataset/codebases/circom/pantherfoundation/panther-core/b464348b33155a5877f67c085c7206dc29ad7cb7
* Original Entrypoint: circuits/circuits/mainZTransactionV1.circom
* Direct Entrypoint: circuit.circom
* Location
  - Path: circuits/circuits/templates/rewardsExtended.circom
  - Function: RewardsExtended
  - Line: 20-85
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/veridise-panther.pdf
  - Bug ID: V-PAN-VUL-020: forTxReward gets abstracted away in the reward calculation
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

In the `RewardsExtended(nUtxoIn)` template (rewardsExtended.circom), the final reward `amountPrp` is computed via `S1 <== forTxReward;` (line ~44, where the comment claims `// 2^40`), and later `R <== S1 + S5;` (line ~70), then the result is divided by `prpScaleFactor = 60` by extracting the upper bits via `Num2Bits(253)` → `Bits2Num(253 - prpScaleFactor)`. Because `forTxReward` is at most 2^40 but is not pre-scaled by 2^60, after the `>> 60` truncation its contribution to `amountPrp` is exactly 0. The `S5` term dominates (~2^152), so any `forTxReward` value effectively vanishes from the reward accounting. Users therefore receive no reward for doing the transaction itself.

## Proposed Mitigation

Add `forTxReward * 2**prpScaleFactor` to `S1`, or add `forTxReward` to `S5` after the division so that its contribution is preserved in PRP units rather than scaled-down units.

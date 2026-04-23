# Zone Related Limits Can Be Bypassed in ZSwapV1

* Id: pantherfoundation/panther-core/veridise_zone_limits_bypass_zswapv1
* Project: https://github.com/pantherfoundation/panther-core
* Commit: b464348b33155a5877f67c085c7206dc29ad7cb7
* Fix Commit: 54d4d0a
* DSL: Circom
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Wrong Translation of Logic into Constraints
* Reproduced: False
* Codebase: dataset/codebases/circom/pantherfoundation/panther-core/b464348b33155a5877f67c085c7206dc29ad7cb7
* Original Entrypoint: circuits/circuits/mainZSwapV1.circom
* Direct Entrypoint: circuit.circom
* Location
  - Path: circuits/circuits/zSwapV1.circom
  - Function: ZSwapV1
  - Line: 628-640
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/veridise-panther.pdf
  - Bug ID: V-PAN-VUL-016: Zone related limits can be bypassed
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

In the `ZSwapV1` template (zSwapV1.circom ~line 628), the per-zone transfer limit is implemented as:
```
component isDeltaTimeLessEqThen = LessEqThan(32);
isDeltaTimeLessEqThen.in[0] <== deltaTime;
isDeltaTimeLessEqThen.in[1] <== zZoneTimePeriodPerMaximumAmount;
signal zAccountUtxoOutTotalAmountPerTimePeriod <== Uint96Tag(ACTIVE)(
    isDeltaTimeLessEqThen.out * (totalBalanceChecker.totalWeighted +
        zAccountUtxoInTotalAmountPerTimePeriod));
```
When `deltaTime > zZoneTimePeriodPerMaximumAmount`, `isDeltaTimeLessEqThen.out` is 0 and `zAccountUtxoOutTotalAmountPerTimePeriod` collapses to 0, which always satisfies the subsequent `ForceLessEqThan(96)` comparison with `zZoneMaximumAmountPerTimePeriod`. As a result any `totalWeighted` amount — including one that exceeds the zone cap — is accepted, bypassing the zone transfer limit and breaking the compliance invariant.

## Proposed Mitigation

The correct behavior when deltaTime exceeds the period is to reset `zAccountUtxoInTotalAmountPerTimePeriod` to 0 (new period) and re-check the cap against just `totalWeighted`, rather than collapsing the running total to 0. Fix the logic so the cap is enforced in every branch.

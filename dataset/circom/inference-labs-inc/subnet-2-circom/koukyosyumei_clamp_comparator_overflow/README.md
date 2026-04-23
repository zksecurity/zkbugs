# Clamp LessThan inputs are not range-checked

* Id: inference-labs-inc/subnet-2-circom/koukyosyumei_clamp_comparator_overflow
* Project: https://github.com/inference-labs-inc/subnet-2-circom
* Commit: d310309c141d36504b3486cebd96ed70ef3a4fdf
* Fix Commit: b8f92bdec1694138df0e069921f1aa0bdc94053e
* DSL: Circom
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Missing Input Constraints
* Reproduced: False
* Codebase: dataset/codebases/circom/inference-labs-inc/subnet-2-circom/d310309c141d36504b3486cebd96ed70ef3a4fdf
* Original Entrypoint: src/generated/clamp_main.circom
* Direct Entrypoint: circuit.circom
* Location
  - Path: src/clampTensor.circom
  - Function: Clamp
  - Line: 39-70
* Source: GitHub Issue
  - Source Link: https://github.com/inference-labs-inc/subnet-2-circom/pull/2
  - Bug ID: #2-1: Clamp LessThan inputs are not range-checked
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

`Clamp(b)` feeds its free field-element inputs `val`, `min`, `max`, and the intermediate `temp_max` into two invocations of `LessThan(b)` and relies on the result to pick between clamped values (`temp_1[0] <== val * (1 - LessThan[0].out); temp_2[0] <== min * LessThan[0].out;` and the analogous pair for the upper bound). The project-local `LessThan(b)` is the usual circomlib pattern (`Num2Bits(n+1)((1 << n) + in[0] - in[1])`, output is the inverse of the top bit), and it is only sound when both inputs are already bounded by `2^b`. Here none of `val`, `min`, `max`, `temp_max` is range-checked before the comparison, so this is the standard comparator-overflow scenario (see https://github.com/BlakeMScurr/comparator-overflow). A prover can set `val` close to the BN254 field prime so the `n+1`-bit decomposition of `(1 << b) + val - min` still succeeds but the unsigned ordering does not hold, letting `Clamp` return `val` when it should have returned `min` (or `max`). Downstream `clampTensor(n, b)` propagates this to the output vector, so the entire clamped tensor is attacker-controlled. The same comparator-overflow pattern is present in `DistanceFromScore`, `IntDiv`, `MetricNormalized`, `ScoringFunction`, and `ResponseTimeNormalized` in the same project — this bug is the representative entry and PR #2 fixes all of them together.

## Proposed Mitigation

Range-check each input with `Num2Bits(b)` before it reaches the comparator. The fix (merge commit `b8f92bde`) adds `Num2Bits[0..3] = Num2Bits(b)` and feeds `val`, `min`, `max`, `temp_max` through them at the top of the template, so each is constrained to lie in `[0, 2^b)` before `LessThan(b)` is invoked.

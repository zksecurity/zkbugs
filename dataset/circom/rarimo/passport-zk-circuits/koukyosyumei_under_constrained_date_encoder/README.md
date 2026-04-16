# Under-constrained DateEncoder remainder signals

* Id: rarimo/passport-zk-circuits/koukyosyumei_under_constrained_date_encoder
* Project: https://github.com/rarimo/passport-zk-circuits
* Commit: 9143bc77eb2bdbd174eaa61b25b11adb5ee99f61
* Fix Commit: bbbe14c71c08be20a55f29bb2159261f0b32be0f
* DSL: Circom
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Missing Input Constraints
* Reproduced: False
* Codebase: dataset/codebases/circom/rarimo/passport-zk-circuits/9143bc77eb2bdbd174eaa61b25b11adb5ee99f61
* Original Entrypoint: (same as direct)
* Direct Entrypoint: circuit.circom
* Location
  - Path: circuits/dateUtilities/dateEncoder.circom
  - Function: DateEncoder
  - Line: 10-23
* Source: GitHub Issue
  - Source Link: https://github.com/rarimo/passport-zk-circuits/pull/60
  - Bug ID: #60: Under-constrained DateEncoder remainder signals
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

`DateEncoder` decomposes each of `day`, `month`, and `year` into a decimals digit and a rest digit using witness-only assignments (`<--`) followed by a single algebraic constraint of the form `dayDecimals * 10 + dayRest === day`. Because `dayRest`, `monthRest`, and `yearRest` are never range-checked to lie in `[0, 10)`, a malicious prover can satisfy the single constraint with other pairs. For instance, when `day = 4`, the honest assignment is `{dayDecimals: 0, dayRest: 4}`, but `{dayDecimals: 1, dayRest: -6}` (where `-6` is represented as `p - 6` in the BN254 scalar field) also satisfies `dayDecimals * 10 + dayRest === day`. The output `encoded` therefore takes on spurious values, so the UTF-8 `YYMMDD` encoding produced for downstream use is under-determined. The same pattern applies to the `monthRest` and `yearRest` signals assigned with `<--` on lines 16 and 20.

## Proposed Mitigation

Constrain each rest signal to be a small non-negative integer less than 10. The fix PR (#60) introduces a `Num2Bits(4)` range check and a `LessThan(4)` comparison against `10` for each of `dayRest`, `monthRest`, and `yearRest`, asserting `ltDay.out === 1` so that only canonical decompositions satisfy the circuit.

# EmitIfInRange LessThan missing range check on index

* Id: siv-org/verifiable-private-overrides/koukyosyumei_emitifinrange_lessthan_overflow
* Project: https://github.com/siv-org/verifiable-private-overrides
* Commit: 7bda2311d7a33dcab611cfea0c67707b0b65c24c
* Fix Commit: 7c3402dda19010e7ff6c3987b6fa72b076e9b159
* DSL: Circom
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Missing Input Constraints
* Reproduced: False
* Codebase: dataset/codebases/circom/siv-org/verifiable-private-overrides/7bda2311d7a33dcab611cfea0c67707b0b65c24c
* Original Entrypoint: circuits/generated/emit_if_in_range_main.circom
* Direct Entrypoint: circuit.circom
* Location
  - Path: circuits/ExtractStringFromPoint.circom
  - Function: EmitIfInRange
  - Line: 30-38
* Source: GitHub Issue
  - Source Link: https://github.com/siv-org/verifiable-private-overrides/pull/13
  - Bug ID: #13-2: EmitIfInRange LessThan missing range check on index
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

`EmitIfInRange(n)` compares `index` and `range` via `component lt = LessThan(n)` and emits `out <== lt.out * value`. Neither `index` nor `range` is range-checked to fit in `n` bits, so the circomlib `LessThan` comparator is being applied outside its documented precondition (see the comparator-overflow advisory at https://github.com/BlakeMScurr/comparator-overflow). A malicious prover can choose `index` near the BN254 field prime so the internal `Num2Bits(n+1)` of `index + 2^n - range` still decomposes successfully but the intended unsigned `<` relation does not hold. zkFuzz found a counter-example for `EmitIfInRange(5)`: `range = 5`, `value = 3`, `index = p - 52` — yet `lt.out = 1` and the gadget happily emits `value = 3`, bypassing the bounds check. Inside `ExtractStringFromPoint()` this lets a prover force arbitrary `pointAsBytes[i + 1]` into `stringAsBytes[i]` regardless of the nominal `length`.

## Proposed Mitigation

Range-check `index` (and, defensively, `range`) to fit in `n` bits before feeding them to `LessThan(n)`. The fix in PR #13 swaps `shiftedFirstByte`'s witness-only `<--` for a `RShift1(8)` gadget that internally `Num2Bits(8)`-checks the input, so after the fix `length` is at most 7 bits and the downstream `EmitIfInRange` inputs can no longer overflow the comparator — callers that expose `EmitIfInRange` as a standalone gadget should add an explicit `Num2Bits(n)(index)` before the comparison.

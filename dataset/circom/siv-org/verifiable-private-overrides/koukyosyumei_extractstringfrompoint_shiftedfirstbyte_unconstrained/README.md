# ExtractStringFromPoint shiftedFirstByte is assigned but not constrained

* Id: siv-org/verifiable-private-overrides/koukyosyumei_extractstringfrompoint_shiftedfirstbyte_unconstrained
* Project: https://github.com/siv-org/verifiable-private-overrides
* Commit: 7bda2311d7a33dcab611cfea0c67707b0b65c24c
* Fix Commit: 7c3402dda19010e7ff6c3987b6fa72b076e9b159
* DSL: Circom
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Assigned but Unconstrained
* Reproduced: False
* Codebase: dataset/codebases/circom/siv-org/verifiable-private-overrides/7bda2311d7a33dcab611cfea0c67707b0b65c24c
* Original Entrypoint: circuits/generated/extract_string_from_point_main.circom
* Direct Entrypoint: circuit.circom
* Location
  - Path: circuits/ExtractStringFromPoint.circom
  - Function: ExtractStringFromPoint
  - Line: 19
* Source: GitHub Issue
  - Source Link: https://github.com/siv-org/verifiable-private-overrides/pull/13
  - Bug ID: #13-1: ExtractStringFromPoint shiftedFirstByte is assigned but not constrained
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

In `ExtractStringFromPoint()`, the line `signal shiftedFirstByte <-- (pointAsBytes[0] >> 1);` computes the high 7 bits of `pointAsBytes[0]` using the witness-only operator `<--`, and the next line exposes it as an output with `signal output length <== shiftedFirstByte;`. The `>>` expression is never expressed as a constraint — there is no `<==` or `===` tying `shiftedFirstByte` to `pointAsBytes[0]`. At R1CS level `shiftedFirstByte` (and therefore `length`) is a free variable, so a malicious prover can pick any value for it. The per-index loop `stringAsBytes[i] <== EmitIfInRange(5)(i, length, pointAsBytes[i + 1]);` depends on that free `length`, so the extracted string bytes no longer faithfully reflect the point's first byte. zkFuzz found a counter-example where `pointAsBytes[0] = 1` (honest `length` = 0) yet the prover sets `shiftedFirstByte = 1` so `length = 1` and one extra `pointAsBytes[1]` byte is surfaced as ballot content.

## Proposed Mitigation

Replace the `<--` assignment with a properly-constrained right-shift gadget. The fix (PR #13, merge commit `7c3402dd`) introduces a `RShift1(N)` template that does `Num2Bits(N)` on the input, shifts the bit array by one, and recomposes via `Bits2Num(N-1)`, then uses `signal shiftedFirstByte <== RShift1(8)(pointAsBytes[0]);` so every bit of `pointAsBytes[0]` is range-checked and the shifted value is deterministically tied to the input.

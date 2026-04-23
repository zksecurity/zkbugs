# Subtract uses an unconstrained multiplier d

* Id: inference-labs-inc/subnet-2-circom/koukyosyumei_subtract_unconstrained_multiplier
* Project: https://github.com/inference-labs-inc/subnet-2-circom
* Commit: d310309c141d36504b3486cebd96ed70ef3a4fdf
* Fix Commit: b8f92bdec1694138df0e069921f1aa0bdc94053e
* DSL: Circom
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Assigned but Unconstrained
* Reproduced: False
* Codebase: dataset/codebases/circom/inference-labs-inc/subnet-2-circom/d310309c141d36504b3486cebd96ed70ef3a4fdf
* Original Entrypoint: src/generated/subtract_main.circom
* Direct Entrypoint: circuit.circom
* Location
  - Path: src/subtractTensor.circom
  - Function: Subtract
  - Line: 3-10
* Source: GitHub Issue
  - Source Link: https://github.com/inference-labs-inc/subnet-2-circom/pull/2
  - Bug ID: #2-2: Subtract uses an unconstrained multiplier d
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

`Subtract()` defines an intermediate signal `d` that is assigned via the witness-only operator (`signal d; d <-- 1;`) and then uses it to scale the subtraction result (`c <== (a - b)*d;`). Because `d` is never tied to its value with a `===` or `<==`, it is a free variable at R1CS level — a malicious prover can choose any `d` at witness-generation time and the resulting `c = (a - b) * d` still satisfies every constraint in the circuit. The template therefore does not implement subtraction; callers such as `MetricNormalized` and `ResponseTimeNormalized`, which use `Subtract()` to compute `(value - min)` and `(max - min)`, inherit the freedom and can emit arbitrary normalized scores. The same assigned-but-unconstrained pattern also shows up in `IntDiv`'s `out <-- quot;` in this project (fixed to `out <== quot;` in the same PR) — this Subtract bug is the representative entry.

## Proposed Mitigation

Remove the `d` multiplier entirely and constrain the output directly: `c <== a - b;`. The fix (merge commit `b8f92bde`) collapses the three-line body to that single line, eliminating the free variable.

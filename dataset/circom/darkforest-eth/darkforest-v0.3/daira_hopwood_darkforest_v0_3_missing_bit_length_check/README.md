# Dark Forest v0.3: Missing Bit Length Check

* Id: darkforest-eth/darkforest-v0.3/Daira-Hopwood-Missing-Bit-Length-Check
* Project: https://github.com/darkforest-eth/darkforest-v0.3
* Commit: 1c83685e22e0463d5481c83e21616745b3204c9c
* Fix Commit: https://github.com/darkforest-eth/circuits/commit/1b5c8440a487614d4a3e6ed523df0aee71a05b6e#diff-440e6bdf86d42398f40d29b9df0b9e6992c6859194d2a7f3c8c68fb46d0f2040
* DSL: Circom
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Unsafe Reuse of Circuit
* Reproduced: False
* Codebase: dataset/codebases/circom/darkforest-eth/darkforest-v0.3/1c83685e22e0463d5481c83e21616745b3204c9c
* Entrypoint: TODO_ENTRYPOINT
* Direct Entrypoint: circuit.circom
* Location
  - Path: circuits/range_proof/circuit.circom
  - Function: RangeProof
  - Line: 16-22
* Source: Bug Tracker
  - Source Link: https://github.com/0xPARC/zk-bug-tracker
  - Bug ID: Dark Forest v0.3: Missing Bit Length Check
* Input
  - Original: input.json
  - Direct: direct_input.json
* Commands
  - Setup Environment: `./zkbugs_setup.sh`
  - Compile and Preprocess: `./zkbugs_compile_setup.sh`
  - Positive Test: `./zkbugs_positive_test.sh`
  - Clean: `./zkbugs_clean.sh`
  - Compile: `./zkbugs_compile.sh`

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

Input of `LessThan(bits)` is assumed to take inputs bounded by `2**(bits-1)`, but there is no constraint for it in `LessThan` template. Attacker can use unexpected values outside the range and pass all the constraints, rendering this RangeProof useless. Note: The original circuit does not contain the output `out`, it was added to prevent snarkJS 'Scalar size does not match' error.

## Proposed Mitigation

Add constraints to check the range of `in` and `max_abs_value`. This can be done using the `Num2Bits` template.

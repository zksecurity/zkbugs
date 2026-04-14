# The RlpU64Gadget is underconstrained when is_lt_128 is false

* Id: scroll-tech/zkevm-circuits/trailofbits_The_RlpU64Gadget_is_underconstrained_when_is_lt_128_is_false
* Project: https://github.com/scroll-tech/zkevm-circuits
* Commit: 0xe8bcb23e1f303bd6e0dc52924b0ed85710b8a016
* Fix Commit: 2a69a55562336a54ce2b1a13748db7cf807c8e2a
* DSL: Halo2
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Wrong Translation of Logic into Constraints
* Reproduced: False
* Codebase: 
* Original Entrypoint: (same as direct)
* Direct Entrypoint: 
* Location
  - Path: zkevm-circuits/src/evm_circuit/util/math_gadget/rlp.rs
  - Function: 
  - Line: 67
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/trailofbits-scroll.pdf
  - Bug ID: The RlpU64Gadget is underconstrained when is_lt_128 is false
* Commands
  - Setup Environment: ``
  - Reproduce: ``
  - Compile and Preprocess: ``
  - Positive Test: ``
  - Find Exploit: ``
  - Clean: ``

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

The bug 'The RlpU64Gadget is underconstrained when is_lt_128 is false' indicates that the RlpU64Gadget circuit, which validates RLP-encoded values, lacks a constraint to ensure that when the is_lt_128 flag is false, the value is above 127. This oversight could allow a malicious prover to manipulate the value encoding, resulting in incorrect deserialization and potential state divergence in the zkEVM context. Recommendations include adding a constraint to verify that the value exceeds this threshold when is_lt_128 is false.

## Proposed Mitigation

To fix the bug 'The RlpU64Gadget is underconstrained when is_lt_128 is false', add a constraint to ensure that the value is above 127 when is_lt_128 is false. Long-term, implement negative tests to ensure that mismatched witness values and is_lt_128 do not satisfy the circuit constraints.

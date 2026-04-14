# Unsound XOR gadget

* Id: reclaimprotocol/circom-chacha20/zksecurity_Unsound_XOR_gadget
* Project: https://github.com/reclaimprotocol/circom-chacha20
* Commit: ef9f5a5ad899d852740a26b30eabe5765673c71f
* Fix Commit: ef9f5a5ad899d852740a26b30eabe5765673c71f
* DSL: Circom
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Wrong Translation of Logic into Constraints
* Reproduced: False
* Codebase: dataset/codebases/circom/reclaimprotocol/circom-chacha20/ef9f5a5ad899d852740a26b30eabe5765673c71f
* Original Entrypoint: (same as direct)
* Direct Entrypoint: circuit.circom
* Location
  - Path: generics.circom
  - Function: XorBits
  - Line: 19-28
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/zksecurity-reclaimprotocol.pdf
  - Bug ID: Unsound XOR gadget
* Input
  - Original: input.json
  - Direct: direct_input.json
* Commands
  - Setup Environment: ``
  - Compile and Preprocess: ``
  - Positive Test: ``
  - Clean: ``
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

In `XorBits(M)`, the bit decomposition uses witness assignments `a_bits[i] <-- (a >> i) & 1` and `b_bits[i] <-- (b >> i) & 1` but the boolean constraints `a_bits[i] * (a_bits[i] - 1) === 0` and `b_bits[i] * (b_bits[i] - 1) === 0` are commented out. Without these constraints, `a_bits[i]` and `b_bits[i]` can be set to arbitrary field values (not just 0 or 1). The XOR computation `xor_bits[i] <== a_bits[i] + b_bits[i] - 2 * a_bits[i] * b_bits[i]` then operates on unconstrained inputs, allowing a malicious prover to produce arbitrary XOR outputs.

## Proposed Mitigation

Uncomment the boolean constraints (`a_bits[i] * (a_bits[i] - 1) === 0` and same for `b_bits[i]`) to enforce that each bit is 0 or 1. Additionally constrain that the bit decomposition reconstructs the original values: `sum_a === a` and `sum_b === b`.

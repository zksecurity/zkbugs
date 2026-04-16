# Unsafe Use of Num2Bits(254) on Blacklist Leaf

* Id: pantherfoundation/panther-core/veridise_unsafe_num2bits_254_blacklist_leaf
* Project: https://github.com/pantherfoundation/panther-core
* Commit: b464348b33155a5877f67c085c7206dc29ad7cb7
* Fix Commit: 6dfcc56
* DSL: Circom
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Missing Input Constraints
* Reproduced: False
* Codebase: dataset/codebases/circom/pantherfoundation/panther-core/b464348b33155a5877f67c085c7206dc29ad7cb7
* Original Entrypoint: circuits/circuits/mainZTransactionV1.circom
* Direct Entrypoint: circuit.circom
* Location
  - Path: circuits/circuits/templates/zAccountBlackListLeafInclusionProver.circom
  - Function: ZAccountBlackListLeafInclusionProver
  - Line: 54-80
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/veridise-panther.pdf
  - Bug ID: V-PAN-VUL-010: Unsafe use of Num2Bits(254) on blacklist leaf
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

The template `ZAccountBlackListLeafInclusionProver` uses `component n2b_leaf = Num2Bits(254); n2b_leaf.in <== leaf;` to expand the blacklist leaf into 254 bits. Circomlib's `Num2Bits(n)` only asserts `lc1 === in` and `out[i] * (out[i] - 1) === 0`; it does **not** check that the reconstructed value is canonical modulo the prime `p`. Because `p < 2^254`, two distinct 254-bit strings can recompute to the same field element modulo `p`, so a malicious prover can choose the bit decomposition to clear the bit corresponding to their `zAccountId` (`n2b_leaf.out[i] == 0`) while the leaf value itself still encodes a ban. The subsequent check `is_zero[i].out * n2b_leaf.out[i] === 0` then passes, letting a banned zAccountId pass inclusion.

## Proposed Mitigation

Use circomlib's `Num2Bits_strict()` (or a range-checked equivalent) instead of `Num2Bits(254)` so the bit decomposition is unique modulo `p`.

# SHA256 templates can be made return 0 on arbitrary inputs

* Id: zkemail/zk-email-verify/zksecurity_sha256_templates_return_zero_on_arbitrary_inputs
* Project: https://github.com/zkemail/zk-email-verify
* Commit: f2fb77c6ab49f4e85c424c3334ce69c018648fa7
* Fix Commit: ad0ad6
* DSL: Circom
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Missing Input Constraints
* Reproduced: False
* Codebase: dataset/codebases/circom/zkemail/zk-email-verify/f2fb77c6ab49f4e85c424c3334ce69c018648fa7
* Original Entrypoint: packages/circuits/tests/test-circuits/sha-test.circom
* Direct Entrypoint: circuit.circom
* Location
  - Path: packages/circuits/lib/sha.circom
  - Function: Sha256General
  - Line: 
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/zksecurity-zkemail.pdf
  - Bug ID: #02
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

Both custom SHA256 templates `Sha256General` and `Sha256Partial`, as well as their bytes variants `Sha256Bytes` and `Sha256BytesPartial`, are vulnerable to an attack where the prover passes a maliciously crafted `paddedInLength` which causes the returned hash result to be the all-zeros bit array. The signal `inBlockIndex` is computed via `inBlockIndex <-- (paddedInLength >> 9)` and constrained by `paddedInLength === inBlockIndex * 512`. The `ItemAtIndex` template used to select the final hash chunk does not properly constrain `index` to lie within the array bounds — it uses `LessThan(bitLength)` but small negative values modulo the field size (like `-5`, ..., `-1`, `0`) pass the `LessThan` check. By setting `inBlockIndex - 1` to a large number close to the native modulus (exceeding `maxBlocks`), the `ItemAtIndex` output defaults to zero for all out-of-bounds indices, producing an all-zeros hash regardless of input.

## Proposed Mitigation

In `ItemAtIndex`, remove `LessThan` and instead add an assertion that the sum of all `eqs[i]` equals 1, proving the index selects exactly one array element. In all SHA256 templates, document that `paddedInLength` is constrained to fit in `ceil(log2(maxBitLength))` bits (for `Sha256General`/`Sha256Partial`) or `ceil(log2(8 * maxByteLength))` bits (for `Sha256Bytes`/`Sha256BytesPartial`). In `EmailVerifier`, use `Num2Bits` to constrain `emailHeaderLength` and `emailBodyLength` to appropriate bit lengths.

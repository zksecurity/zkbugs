# KYT Signature Verification Process Fails for Any Non-Zero Signed Message Hash

* Id: pantherfoundation/panther-core/veridise_kyt_signature_verification_fails_nonzero_hash
* Project: https://github.com/pantherfoundation/panther-core
* Commit: b464348b33155a5877f67c085c7206dc29ad7cb7
* Fix Commit: ccb2a8b
* DSL: Circom
* Vulnerability: Over-Constrained
* Impact: Completeness
* Root Cause: Wrong Translation of Logic into Constraints
* Reproduced: False
* Codebase: dataset/codebases/circom/pantherfoundation/panther-core/b464348b33155a5877f67c085c7206dc29ad7cb7
* Original Entrypoint: circuits/circuits/mainZSwapV1.circom
* Direct Entrypoint: circuit.circom
* Location
  - Path: circuits/circuits/templates/trustProvidersKyt.circom
  - Function: TrustProvidersKyt
  - Line: 270-275
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/veridise-panther.pdf
  - Bug ID: V-PAN-VUL-019: KYT signature verification process fails for any non-zero signed message hash
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

In `trustProvidersKyt.circom` around line 272, the KYT verification enable flag is computed as:
```
signal isKytDepositCheckEnabled <== BinaryTag(ACTIVE)(
    isSwap ? kytDepositSignedMessageHash * (1 - isZeroDeposit.out)
           : (1 - isZeroDeposit.out));
```
The ternary selects a value that multiplies by `kytDepositSignedMessageHash` in the swap case. Since `BinaryTag(ACTIVE)` constrains its argument to be 0 or 1, the signal has to be binary. It is 0 only when the smart contracts agree to a zero-hash; otherwise it equals the actual Poseidon hash value of the signed message, which is non-binary. For any non-zero signed message hash the BinaryTag constraint fails and the proof cannot be generated. The same bug repeats for `isKytWithdrawCheckEnabled` and `isKytInternalCheckEnabled`.

## Proposed Mitigation

Replace `kytDepositSignedMessageHash` in the conditional with `IsNotZero()(kytDepositSignedMessageHash)` (a template that returns 0/1 depending on whether the input is zero). Apply the same fix to `kytWithdrawSignedMessageHash` and `kytSignedMessageHash`.

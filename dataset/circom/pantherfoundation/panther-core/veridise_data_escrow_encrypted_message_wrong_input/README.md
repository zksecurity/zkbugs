# Data Escrow Encrypted Message Constructed From Incorrect Input

* Id: pantherfoundation/panther-core/veridise_data_escrow_encrypted_message_wrong_input
* Project: https://github.com/pantherfoundation/panther-core
* Commit: b464348b33155a5877f67c085c7206dc29ad7cb7
* Fix Commit: 7ff5ba7
* DSL: Circom
* Vulnerability: Computational Issues
* Impact: Soundness
* Root Cause: Other Programming Errors
* Reproduced: False
* Codebase: dataset/codebases/circom/pantherfoundation/panther-core/b464348b33155a5877f67c085c7206dc29ad7cb7
* Original Entrypoint: circuits/circuits/mainZTransactionV1.circom
* Direct Entrypoint: circuit.circom
* Location
  - Path: circuits/circuits/templates/dataEscrowElGamalEncryption.circom
  - Function: DataEscrowElGamalEncryption
  - Line: 148-152
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/veridise-panther.pdf
  - Bug ID: V-PAN-VUL-021: Data escrow encrypted message constructed from incorrect input
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

The template `DataEscrowElGamalEncryption(PaddingPointsSize, ScalarsSize, PointsSize)` constructs ElGamal-like ciphertexts as `M + ephemeralRandom * pubKey + HidingPoint`. For the padding-point segment the circuit builds two intermediaries: `drv_mGrY[j]` = `M + SharedPubKey` and `drv_mGrY_final[j]` = `drv_mGrY[j] + HidingPoint`. The ciphertext must use `drv_mGrY_final`, but the code at line ~150 writes:
```
encryptedMessage[j][0] <== drv_mGrY[j].xout;
encryptedMessage[j][1] <== drv_mGrY[j].yout;
```
for the padding segment — the hiding point is omitted. The scalar and point segments correctly use `drv_mGrY_final`. Because the hiding point is what ensures that UTXOs from the same sender but destined for different receivers cannot be correlated, omitting it on the padding segment breaks this privacy guarantee.

## Proposed Mitigation

Replace `drv_mGrY[j].xout` / `drv_mGrY[j].yout` in the padding-segment assignment with `drv_mGrY_final[j].xout` / `drv_mGrY_final[j].yout` so that the hiding point is included in every ciphertext entry.

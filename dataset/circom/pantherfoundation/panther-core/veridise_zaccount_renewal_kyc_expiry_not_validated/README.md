# zAccountRenewalV1 Circuit Does Not Validate KYC Certificates for Expiry

* Id: pantherfoundation/panther-core/veridise_zaccount_renewal_kyc_expiry_not_validated
* Project: https://github.com/pantherfoundation/panther-core
* Commit: b464348b33155a5877f67c085c7206dc29ad7cb7
* Fix Commit: 3375335
* DSL: Circom
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Missing Input Constraints
* Reproduced: False
* Codebase: dataset/codebases/circom/pantherfoundation/panther-core/b464348b33155a5877f67c085c7206dc29ad7cb7
* Original Entrypoint: circuits/circuits/mainZAccountRenewalV1.circom
* Direct Entrypoint: circuit.circom
* Location
  - Path: circuits/circuits/zAccountRenewalV1.circom
  - Function: ZAccountRenewalV1
  - Line: 130-140
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/veridise-panther.pdf
  - Bug ID: V-PAN-VUL-017: zAccountRenewalV1 circuit does not validate KYC certificates for expiry
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

The `ZAccountRenewalV1` template declares `signal input kycSignedMessageTimestamp;` and uses it as part of the signed KYC message hash (e.g. `kycSignedMessageHashInternal.inputs[1] <== kycSignedMessageTimestamp;`), but never compares it against the current `spendTime` or any expiry bound. Because KYC/KYT certificate tracking is not enforced at the smart-contract level either, the same certificate can be used for renewal after it has expired. This defeats the purpose of periodic KYC renewal — the circuit lets users keep renewing their zAccount indefinitely with a single once-issued certificate, even when the KYC rules change.

## Proposed Mitigation

Add a circuit constraint that checks `kycSignedMessageTimestamp + kycExpiryPeriod >= spendTime` (or equivalent), rejecting expired certificates. Alternatively, track used KYC certificates at the smart-contract level and reject duplicates.

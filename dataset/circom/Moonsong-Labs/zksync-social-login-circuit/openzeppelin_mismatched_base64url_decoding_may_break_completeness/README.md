# Mismatched Base64url Decoding May Break Completeness

* Id: Moonsong-Labs/zksync-social-login-circuit/openzeppelin_mismatched_base64url_decoding_may_break_completeness
* Project: https://github.com/Moonsong-Labs/zksync-social-login-circuit
* Commit: 27cda6e74492fbad4aa3ca37ff5084ed391b534b
* Fix Commit: 0548942278a414d85e2f3d406e171eeac325349e
* DSL: Circom
* Vulnerability: Over-Constrained
* Impact: Completeness
* Root Cause: Misimplementation of a Specification
* Reproduced: False
* Codebase: dataset/codebases/circom/Moonsong-Labs/zksync-social-login-circuit/27cda6e74492fbad4aa3ca37ff5084ed391b534b
* Original Entrypoint: jwt-tx-validation.circom
* Direct Entrypoint: circuit.circom
* Location
  - Path: utils/jwt-verify.circom
  - Function: JwtVerify
  - Line: 91-93
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/openzeppelin-sso.pdf
  - Bug ID: Medium: Mismatched Base64url Decoding May Break Completeness
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

Per RFC-7519 the JWT payload is encoded with base64url (i.e., `-` and `_` instead of `+` and `/`), but `JwtVerify` decodes it with a plain base64 decoder: `b64Payload` (the URL-safe base64 bytes sliced out of `message`) is fed directly to `Base64Decode(maxPayloadLength)(b64Payload)` without first being converted from base64url to base64. The zkemail `Base64Decode` template only accepts the base64 alphabet, so any payload byte equal to `-` (45) or `_` (95) makes the constraints unsatisfiable — `reject such inputs` in the report's wording. While `VerifyNonce()` correctly calls `Base64UrlToBase64(maxNonceB64Length)(b64UrlNonce)` before `Base64Decode`, the main payload path skips this step, making it theoretically possible for a valid Google OIDC JWT containing `-` or `_` in its payload to be unverifiable by the circuit, breaking completeness.

## Proposed Mitigation

Call `Base64UrlToBase64` on `b64Payload` before passing it to `Base64Decode`, matching how the nonce is handled. The fix in PR #40 (commit `0548942`) adds this conversion so that JWT payloads are correctly base64url-decoded.

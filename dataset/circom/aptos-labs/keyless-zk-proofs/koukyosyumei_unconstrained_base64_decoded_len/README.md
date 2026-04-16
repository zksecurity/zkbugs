# Base64DecodedLength output is declared but never constrained

* Id: aptos-labs/keyless-zk-proofs/koukyosyumei_unconstrained_base64_decoded_len
* Project: https://github.com/aptos-labs/keyless-zk-proofs
* Commit: fd160220a88a5becf0f91ea1a5425fdd537c7399
* Fix Commit: fa943244d45cb733626e54108a0ce7e10bcba5c3
* DSL: Circom
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Assigned but Unconstrained
* Reproduced: False
* Codebase: dataset/codebases/circom/aptos-labs/keyless-zk-proofs/fd160220a88a5becf0f91ea1a5425fdd537c7399
* Original Entrypoint: circuit/templates/generated/base64_decoded_length_main.circom
* Direct Entrypoint: circuit.circom
* Location
  - Path: circuit/templates/helpers/misc.circom
  - Function: Base64DecodedLength
  - Line: 237-266
* Source: GitHub Issue
  - Source Link: https://github.com/aptos-labs/keyless-zk-proofs/issues/50
  - Bug ID: #50: Base64DecodedLength output is declared but never constrained
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

`Base64DecodedLength(maxN)` declares `signal output decoded_len` but never assigns or constrains it — the body only constrains the quotient/remainder of `3*n` divided by `4` via `3*n - 4*q - r === 0` plus two `LessThan` bound checks on `r` and `q`, and the code that would have computed `decoded_len <== q + reducer` is commented out at the bottom of the template. Because `decoded_len` is a circuit output with no constraint, it is a free variable at R1CS level. The caller at `circuit/templates/mainTemplate.circom:102` binds `signal ascii_payload_len <== Base64DecodedLength(maxJWTPayloadLen)(b64_payload_len)` and then feeds `ascii_payload_len` into `HashBytesToFieldWithLen(max_ascii_jwt_payload_len)(ascii_jwt_payload, ascii_payload_len)` as the effective length of the hashed region. A malicious prover can pick any value for `decoded_len`, breaking the intended binding between the base64-decoded payload and the hash length and therefore the soundness of the JWT-payload commitment.

## Proposed Mitigation

Assign the output with a proper constraint, e.g. `signal output decoded_len <== q;`, so the template returns the decoded length that matches the internally-enforced Euclidean division `3*n === 4*q + r`. The fix in PR #54 moves the template to `circuit/templates/helpers/base64url.circom`, renames it `Base64UrlDecodedLength`, replaces the `LessThan` bound checks with explicit `Num2Bits(2)(r)` / `Num2Bits(MAX_QUO_BITS)(q)` range checks, and adds `signal output decoded_len <== q;` so `decoded_len` is now fully constrained.

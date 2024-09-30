# Under-Constrained

* Id: RLN/circom-rln/yacademy_risk_of_secret_getting_revealed_if_the_input_is_zero
* Project: https://github.com/Rate-Limiting-Nullifier/circom-rln
* Commit: 37073131b9c5910228ad6bdf0fc50080e507166a
* Fix Commit: 
* DSL: Circom
* Vulnerability: Under-Constrained
* Location
  - Path: circuits/rln.circom
  - Function: RLN
  - Line: 34
* Source: Audit Report
  - Source Link: https://github.com/zBlock-1/RLN-audit-report
  - Bug ID: 1. Critical - Risk of secret getting revealed if the input is zero
* Commands
  - Setup Environment: `./zkbugs_setup.sh`
  - Reproduce: `./zkbugs_exploit.sh`
  - Compile and Preprocess: `./zkbugs_compile_setup.sh`
  - Positive Test: `./zkbugs_positive_test.sh`
  - Find Exploit: `./zkbugs_find_exploit.sh`
  - Clean: `./zkbugs_clean.sh`

## Short Description of the Vulnerability

The circuit contains a computation `y <== identitySecret + a1 * x` where `x` is the public input and `a1` is calculated from public inputs. When `x` is 0, `y` will be equal to `identitySecret` so the secret is revealed.

## Short Description of the Exploit

generateInput.js generates a valid input for calling RLN(20), but `x` is hardcoded to 0 to exploit the vulnerability. To see how this input leaks the secret, just look at the second entry in exploitable_witness.json. That entry corresponds to the `y` value, which is equal to `identitySecret` -> the 7th entry in exploitable_witness.json.

## Proposed Mitigation

Use isZero template from circomlib to check if `a1 * x` is non-zero.


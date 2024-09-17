# Circomlib-Integration

* Id: zkopru-network/zkopru/leastauthority-previously-correct-ownership-proof-disabled-via-code-changes
* Project: https://github.com/zkopru-network/zkopru/releases/tag/audit-v1
* Commit: 1f5c880d47b6913f848861667b8de6b88dcfe10d
* Fix Commit: 6458fe4ef384d2f2198aae00e719a7f94c30f090
* DSL: Circom
* Vulnerability: Circomlib-Integration
* Location
  - Path: circuits/ownership_proof.circom
  - Function: OwnershipProof
  - Line: 14
* Source: Audit Report
  - Source Link: https://github.com/nullity00/zk-security-reviews/blob/main/ZKopru/LeastAuthority_Ethereum_Foundation_Zkopru_zk-SNARK_Circuits_Smart_Contracts_Final_Audit_Report.pdf
  - Bug ID: Issue C: Previously Correct Ownership Proof Disabled via Code Changes
* Commands
  - Setup Environment: `./zkbugs_setup.sh`
  - Reproduce: `./zkbugs_exploit.sh`
  - Compile and Preprocess: `./zkbugs_compile_setup.sh`
  - Positive Test: `./zkbugs_positive_test.sh`
  - Find Exploit: `./zkbugs_find_exploit.sh`
  - Clean: `./zkbugs_clean.sh`

## Short Description of the Vulnerability

The circuit integrates with `EdDSAPoseidonVerifier` template from circomlib, but the `enabled` signal is set to 0, disabling the verification. There is no signature verification in the circuit, so attacker can craft some non-existent signature and still generate a valid proof.

## Short Description of the Exploit

Run zkbugs_js_setup.sh to set up the circomlibjs environment. Do `node generateInput.js` to generate the input for the circuit. Here every field besides `S` is valid, the signature is hardcoded to `13371337` for demonstrating the bug.

## Proposed Mitigation

Change the line of code to `eddsa.enabled <== 1`.

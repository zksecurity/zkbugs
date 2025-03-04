# Prover can lock user funds by including ill-formed BigInts in public key commitment (Not Reproduce)

* Id: succinctlabs/telepathy-circuits/trailofbits-succinct-1
* Project: https://github.com/succinctlabs/telepathy-circuits
* Commit: b0c839cef30c3c25ef41d1ad3000081784766934
* Fix Commit: 1a88e657932edc59b51e35095618f1e1a46ceef6
* DSL: Circom
* Vulnerability: Under-Constrained
* Impact: Completeness
* Root Cause: Unsafe Reuse of Circuit
* Reproduced: False
* Location
  - Path: circuits/pairing/bls12_381_hash_to_G2
  - Function: SubgroupCheckG1WithValidX
  - Line: 723-731
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/trailofbits-telepathy.pdf
  - Bug ID: 1. Prover can lock user funds by including ill-formed BigInts in public key comitment
* Commands
  - Setup Environment: `./zkbugs_setup.sh`
  - Reproduce: `./zkbugs_exploit.sh`
  - Compile and Preprocess: `./zkbugs_compile_setup.sh`
  - Positive Test: `./zkbugs_positive_test.sh`
  - Find Exploit: `./zkbugs_find_exploit.sh`
  - Clean: `./zkbugs_clean.sh`

## Short Description of the Vulnerability

The `Rotate()` template in rotate.circom fails to validate the format of BigInts in public keys. SubgroupCheckG1WithValidX assumes that its input is a properly formed BigInt, with all limbs less than 2**55. This property is not validated anywhere in the `Rotate()` template. It allows a malicious prover to manipulate public keys by inserting ill-formed BigInts, specifically by altering the y-coordinate of public keys. This manipulation can lock user funds by preventing future provers from generating valid proofs, as the circuit uses these malformed keys without proper validation. The exploit involves modifying the y coordinate in a public key to create an invalid commitment, which then updates the system's commitment state, potentially leading to incorrect or fraudulent operations.

## Short Description of the Exploit

Subtract one from the most significant limb and add 2**55 to the second-most significant limb.

## Proposed Mitigation

Use `Num2Bits()` template to verify that each limb of the `pubkeysBigIntY`, witness value is less than 2**55.


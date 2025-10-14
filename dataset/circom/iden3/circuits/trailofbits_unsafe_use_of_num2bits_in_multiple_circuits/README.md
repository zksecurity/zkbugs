# Unsafe use of Num2Bits in multiple circuits

* Id: iden3/circuits/trailofbits_unsafe_use_of_num2bits_in_multiple_circuits
* Project: https://github.com/iden3/circuits
* Commit: 7a1e04de3e5f3a9f0cfb27a43c9f41c986c1b9ed
* Fix Commit: 
* DSL: Circom
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Wrong translation of logic into constraints
* Reproduced: True
* Location
  - Path: circuits/lib/utils/claimUtils.circom
  - Function: Num2Bits
  - Line: 123
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/trailofbits-iden3-circuits.pdf
  - Bug ID: TOB-IDEN3-1
* Commands
  - Setup Environment: `./zkbugs_setup.sh`
  - Reproduce: `./zkbugs_exploit.sh`
  - Compile and Preprocess: `./zkbugs_compile_setup.sh`
  - Positive Test: `./zkbugs_positive_test.sh`
  - Find Exploit: `./zkbugs_find_exploit.sh`
  - Clean: `./zkbugs_clean.sh`

## Short Description of the Vulnerability

Multiple circuits call `Num2Bits(254)` and `Num2Bits(256)` when working with field elements of the BN-254 prime field. These templates do not enforce uniqueness of the bit decompositions, allowing malicious provers to bypass token expiration or revocation.

## Short Description of the Exploit

Alice has a credential attesting to her identity. Mallory steals Alice’s device. Alice issues a revocation for her auth credential. Mallory modifies the witness generation to produce the wrong revocation nonce. Mallory uses the unrevoked credential to perform an action impersonating Alice.

## Proposed Mitigation

Update the circuits to use `Num2Bits_strict()` instead of `Num2Bits(254)` or `Num2Bits(256)`.


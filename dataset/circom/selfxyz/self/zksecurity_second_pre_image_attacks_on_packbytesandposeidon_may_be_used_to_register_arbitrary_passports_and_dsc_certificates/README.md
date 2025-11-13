# Second Pre-Image Attacks On PackBytesAndPoseidon May Be Used To Register Arbitrary Passports And DSC Certificates

* Id: selfxyz/self/zksecurity_second_pre_image_attacks_on_packbytesandposeidon_may_be_used_to_register_arbitrary_passports_and_dsc_certificates
* Project: https://github.com/selfxyz/self
* Commit: 629dfdad1a867eb82ccba6857a545f3ef838e123
* Fix Commit: 
* DSL: Circom
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Missing Input Constraints
* Reproduced: True
* Location
  - Path: circuits/circuits/utils/passport/customHashers.circom
  - Function: PackBytesAndPoseidon
  - Line: 54-60
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/zksecurity-self-aadhaar-circuits.pdf
  - Bug ID: #01 - Second Pre-Image Attacks On PackBytesAndPoseidon May Be Used To Register Arbitrary Passports And DSC Certificates
* Commands
  - Setup Environment: `./zkbugs_setup.sh`
  - Reproduce: `./zkbugs_exploit.sh`
  - Compile and Preprocess: `./zkbugs_compile_setup.sh`
  - Positive Test: `./zkbugs_positive_test.sh`
  - Find Exploit: `./zkbugs_find_exploit.sh`
  - Clean: `./zkbugs_clean.sh`

## Short Description of the Vulnerability

The function `PackBytesAndPoseidon(k)` in CustomHashers.circom is susceptible to a second pre-image attack: given an input x, an input y can be found such that `PackBytesAndPoseidon(k)(x) == PackBytesAndPoseidon(k)(y)` where y is not an array of bytes, but an array of arbitrary field elements. For example consider [0, 1, 0] and [256, 0, 0] they both compute [256] as an intermediate value (output of PackBytes bytes.circom). This intermediate value is later passed to the `CustomHasher` function: because the intermediate value is identical, both inputs will yield the same hash.

## Short Description of the Exploit

This is a serious vulnerability because, although it is not possible for an attacker to modify all bytes of a key, given that some bytes outside the key are needed to preserve the hash collision, using this technique an attacker could modify up to 30 bytes of the original public key and search for a new public key he can factorize to sign an arbitrary passport. Similarly he could freely modify up to 30 bytes of an ECDSA key (which could be as small as 56 bytes for brainpool224) to achieve a similar goal of computing a corresponding valid private key.

## Proposed Mitigation

We recommend that the ranges of the bytes array are checked inside `PackBytesAndPoseidon`.


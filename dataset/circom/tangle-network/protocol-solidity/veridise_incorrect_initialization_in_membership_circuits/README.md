# Incorrect Initialization in Membership Circuits

* Id: tangle-network/protocol-solidity/veridise_incorrect_initialization_in_membership_circuits
* Project: https://github.com/tangle-network/protocol-solidity
* Commit: 848d073bb17f0aaffc6d39f594cc59efedeaec89
* Fix Commit: eeb4fc7a4883d513e3fe3adbe2c447133ccd39f2
* DSL: Circom
* Vulnerability: Computational/Hints Error
* Impact: Soundness
* Root Cause: Wrong translation of logic into constraints
* Reproduced: True
* Location
  - Path: circuits/set/membership.circom
  - Function: SetMembership
  - Line: 20
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/veridise-tangle-network-protocol-solidity.pdf
  - Bug ID: V-WBT-VUL-006
* Commands
  - Setup Environment: `./zkbugs_setup.sh`
  - Reproduce: `./zkbugs_exploit.sh`
  - Compile and Preprocess: `./zkbugs_compile_setup.sh`
  - Positive Test: `./zkbugs_positive_test.sh`
  - Find Exploit: `./zkbugs_find_exploit.sh`
  - Clean: `./zkbugs_clean.sh`

## Short Description of the Vulnerability

The templates `SetMembership` try to check if an element e is in a set S by generating a constraint of the form: for all  s in S, product of (s - e) = 0. They do does this by iterating over elements s of the set S and building the product. The issue is that `product[0]` is initialized to `element` which makes the constarint to be trivailly satisfied when `element` is 0.

## Short Description of the Exploit

The template `SetMembership` is used to check whether a computed Merkle root belongs to a set of known Merkle roots. A malicious user that knows how to compute a Merkle root equal to 0 could pass along the hashes and generate an invalid proof.

## Proposed Mitigation

We recommend that `product[0]` is initialized to 1.


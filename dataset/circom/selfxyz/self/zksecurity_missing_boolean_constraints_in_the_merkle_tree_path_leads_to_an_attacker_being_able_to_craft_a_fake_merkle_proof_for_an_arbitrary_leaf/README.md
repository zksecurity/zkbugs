# Missing boolean constraints in the Merkle tree path leads to an attacker being able to craft a fake Merkle proof for an arbitrary leaf

* Id: selfxyz/self/zksecurity_missing_boolean_constraints_in_the_merkle_tree_path_leads_to_an_attacker_being_able_to_craft_a_fake_merkle_proof_for_an_arbitrary_leaf
* Project: https://github.com/selfxyz/self
* Commit: 4f18c75041bb47c1862169eef82c22067642a83a
* Fix Commit: 8801c6c1d793896a778c4b597531bc710995d30c
* DSL: Circom
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Wrong translation of logic into constraints
* Reproduced: True
* Location
  - Path: circuits/circuits/utils/crypto/merkle-trees/smt.circom
  - Function: BinaryMerkleRoot
  - Line: 57-59
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/zksecurity-celo-self-audit-2.pdf
  - Bug ID: #02 - Missing boolean constraints in the Merkle tree path leads to an attacker being able to craft a fake Merkle proof for an arbitrary leaf
* Commands
  - Setup Environment: `./zkbugs_setup.sh`
  - Reproduce: `./zkbugs_exploit.sh`
  - Compile and Preprocess: `./zkbugs_compile_setup.sh`
  - Positive Test: `./zkbugs_positive_test.sh`
  - Find Exploit: `./zkbugs_find_exploit.sh`
  - Clean: `./zkbugs_clean.sh`

## Short Description of the Vulnerability

The `BinaryMerkleRoot` template is used in multiple places in the circuits to recover the root of a binary Merkle tree. Notice that this template does not enforce any boolean constraints on the `indices` array.

## Short Description of the Exploit

As a result of this issue, an attacker can craft a fake Merkle proof for any leaf value of their choosing. Since the Merkle tree is used to perform multiple checks throughout the circuits, this means that the attacker can bypass any check that relies on a Merkle proof, for example the inclusion of the CSCA and DSC certificates in the certificates trees.

## Proposed Mitigation

We recommend adding boolean constraints to the `indices` array in the `BinaryMerkleRoot` template.


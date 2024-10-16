# Initial Conditions Are Not Properly Enforced (Not Reproduce)

* Id: privacy-scaling-explorations/maci/hashcloak_initial_conditions_are_not_properly_enforced
* Project: https://github.com/privacy-scaling-explorations/maci
* Commit: 2db5f625b67a6b810bd851950d7a42c26189088b
* Fix Commit: d0792d1e532fd0a7fead4a21cb8f54af6022c4c4
* DSL: Circom
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Wrong translation of logic into constraints
* Reproduced: False
* Location
  - Path: circuits/tallyVotes.circom
  - Function: ResultCommitmentVerifier
  - Line: 89-92
* Source: Audit Report
  - Source Link: https://github.com/nullity00/zk-security-reviews/blob/main/MACI/20210922%20Hashcloak%20audit%20report.pdf
  - Bug ID: Initial Conditions Are Not Properly Enforced
* Commands
  - Setup Environment: `./zkbugs_setup.sh`
  - Reproduce: `./zkbugs_exploit.sh`
  - Compile and Preprocess: `./zkbugs_compile_setup.sh`
  - Positive Test: `./zkbugs_positive_test.sh`
  - Find Exploit: `./zkbugs_find_exploit.sh`
  - Clean: `./zkbugs_clean.sh`

## Short Description of the Vulnerability

If the batch is the first batch, `iz.out` will be 0, and `hz` will be 0, so the constraint `hz <== iz.out * currentTallyCommitmentHasher.hash` will always hold true. There is no checks confirming that the current tally is actually the initial tally in such a case.

## Short Description of the Exploit

Use some random values as tally data and set current_tally_commitment = 0.

## Proposed Mitigation

In 2023 the protocol was refactored, as explained here: https://github.com/privacy-scaling-explorations/maci/issues/279.


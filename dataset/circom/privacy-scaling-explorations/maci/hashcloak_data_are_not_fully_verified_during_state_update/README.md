# Data are not fully verified during state update (Not Reproduce)

* Id: privacy-scaling-explorations/maci/hashcloak_Data_are_not_fully_verified_during_state_update
* Project: https://github.com/privacy-scaling-explorations/maci
* Commit: 0x2db5f6
* Fix Commit: 6df6a4054da926b07f35c5befab4f1f8af33dcc6
* DSL: Circom
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Misimplementation of a Specification
* Reproduced: False
* Location
  - Path: 
  - Function: 
  - Line: 
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/hashcloak-maci.pdf
  - Bug ID: Data are not fully verified during state update
* Commands
  - Setup Environment: ``
  - Reproduce: ``
  - Compile and Preprocess: ``
  - Positive Test: ``
  - Find Exploit: ``
  - Clean: ``

## Short Description of the Vulnerability

The bug 'Data are not fully verified during state update' is not explicitly listed in the report. However, the closest relevant issue described involves the initial conditions in the tallyVotes.circom file. The system does not correctly verify the initial tally commitment when processing the first batch of results, allowing a malicious coordinator to start with an arbitrary tally, potentially compromising the tally results. Suggestions include adding constraints to the tally in the first batch or initializing the tally commitment with a valid value in Poll.sol, but issues remain due to the limit on contract bytecode size.

## Short Description of the Exploit



## Proposed Mitigation

To address the issue of data not being fully verified during state updates, add constraints to the current tally in case of the first batch in the tallyVotes circuit and consider not skipping verification and initializing the tally commitment in Poll.sol with a valid and expected commitment.


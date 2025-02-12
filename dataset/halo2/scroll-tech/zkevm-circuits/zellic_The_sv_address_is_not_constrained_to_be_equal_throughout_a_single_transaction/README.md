# The sv_address is not constrained to be equal throughout a single transaction (Not Reproduce)

* Id: scroll-tech/zkevm-circuits/zellic_The_sv_address_is_not_constrained_to_be_equal_throughout_a_single_transaction
* Project: https://github.com/scroll-tech/zkevm-circuits
* Commit: 0x25dd32aa316ec842ffe79bb8efe9f05f86edc33e
* Fix Commit: 2565e254fc7d42184aaade3d8ee144fdc79fdd10
* DSL: Halo2
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Wrong translation of logic into constraints
* Reproduced: False
* Location
  - Path: TxCircuit
  - Function: 
  - Line: 33
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/zellic-scroll-2.pdf
  - Bug ID: The sv_address is not constrained to be equal throughout a single transaction
* Commands
  - Setup Environment: ``
  - Reproduce: ``
  - Compile and Preprocess: ``
  - Positive Test: ``
  - Find Exploit: ``
  - Clean: ``

## Short Description of the Vulnerability

The bug states that the sv_address in the transaction circuit is not consistently constrained to be the same throughout a single transaction. This leads to a situation where an attacker could use different addresses for the caller and the ECDSA signature, potentially allowing unauthorized contract calls. The recommendation is to implement a constraint ensuring that sv_address remains equal across all rows for the same transaction.

## Short Description of the Exploit



## Proposed Mitigation

The recommended fix for the bug regarding 'sv_address' is to add checks to ensure that sv_address is equal throughout the rows representing the same transaction. This will prevent attackers from using different addresses for the caller and the ECDSA signature's recovered address.


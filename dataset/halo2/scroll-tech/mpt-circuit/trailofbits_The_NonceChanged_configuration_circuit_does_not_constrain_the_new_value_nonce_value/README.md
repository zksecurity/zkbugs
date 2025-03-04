# The NonceChanged configuration circuit does not constrain the new value nonce value (Not Reproduce)

* Id: scroll-tech/mpt-circuit/trailofbits_The_NonceChanged_configuration_circuit_does_not_constrain_the_new_value_nonce_value
* Project: https://github.com/scroll-tech/mpt-circuit
* Commit: 0xfc6c8a2972870e62e96cde480b3aa48c0cc1303d
* Fix Commit: 
* DSL: Halo2
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Wrong translation of logic into constraints
* Reproduced: False
* Location
  - Path: src/gadgets/mpt_update.rs
  - Function: 
  - Line: 1209
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/trailofbits-scroll-2.pdf
  - Bug ID: The NonceChanged configuration circuit does not constrain the new value nonce value
* Commands
  - Setup Environment: ``
  - Reproduce: ``
  - Compile and Preprocess: ``
  - Positive Test: ``
  - Find Exploit: ``
  - Clean: ``

## Short Description of the Vulnerability

The bug pertains to the NonceChanged configuration circuit, which fails to impose constraints on the new nonce value, allowing for it to be of arbitrary length. This oversight could lead to a malicious prover updating the account node with a nonce value that exceeds the expected 8 bytes, compromising system integrity. The issue is classified as high severity due to the potential for exploitation.

## Short Description of the Exploit



## Proposed Mitigation

To fix the bug where the NonceChanged configuration circuit does not constrain the new value nonce, enforce a single unconditional constraint for the config.new_value instead of the erroneous references to config.old_value. Additionally, implement negative testing to ensure that values exceeding 8 bytes cannot be set for the nonce.


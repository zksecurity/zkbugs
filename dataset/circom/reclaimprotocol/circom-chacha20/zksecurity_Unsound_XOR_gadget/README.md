# Unsound XOR gadget (Not Reproduce)

* Id: reclaimprotocol/circom-chacha20/zksecurity_Unsound_XOR_gadget
* Project: https://github.com/reclaimprotocol/circom-chacha20
* Commit: 0xef9f5a5ad899d852740a26b30eabe5765673c71f
* Fix Commit: ef9f5a5ad899d852740a26b30eabe5765673c71f
* DSL: Circom
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Wrong translation of logic into constraints
* Reproduced: False
* Location
  - Path: generics.circom
  - Function: XorWords
  - Line: 
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/zksecurity-reclaimprotocol.pdf
  - Bug ID: Unsound XOR gadget
* Commands
  - Setup Environment: ``
  - Reproduce: ``
  - Compile and Preprocess: ``
  - Positive Test: ``
  - Find Exploit: ``
  - Clean: ``

## Short Description of the Vulnerability

The "Unsound XOR gadget" bug found in the "generics.circom" of the Reclaim Protocol's ChaCha20 circuit relates to the incorrect implementation of the XOR operation on two M-bit value arrays. The bit constraints meant to ensure that the set bits were either 0 or 1 were commented out during the audit, compromising the security and validity of the operation. The XOR logic was supposed to decompose each operand into a series of checks on individual bits, but it failed to enforce that all bits must exactly represent the original values, allowing a malicious party to exploit the poorly constrained bit representation.

## Short Description of the Exploit



## Proposed Mitigation

The recommended fix for the 'Unsound XOR gadget' is to enforce an XOR constraint (res = a + b - 2*ab) on each bit individually, ensuring that each bit is correctly constrained as 0 or 1.


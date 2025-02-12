# Unsound Addition Gadget (Not Reproduce)

* Id: reclaimprotocol/circom-chacha20/zksecurity_Unsound_Addition_Gadget
* Project: https://github.com/reclaimprotocol/circom-chacha20
* Commit: 0xef9f5a5ad899d852740a26b30eabe5765673c71f
* Fix Commit: 4551ca64c9fe536b7b9b7498a1feb1ecdc847474
* DSL: Circom
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Wrong translation of logic into constraints
* Reproduced: False
* Location
  - Path: generics.circom
  - Function: Add32Bits
  - Line: 
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/zksecurity-reclaimprotocol.pdf
  - Bug ID: Unsound Addition Gadget
* Commands
  - Setup Environment: ``
  - Reproduce: ``
  - Compile and Preprocess: ``
  - Positive Test: ``
  - Find Exploit: ``
  - Clean: ``

## Short Description of the Vulnerability

The `Add32Bits` gadget constrains the addition of two (assumed to be 32-bit) values to wrap around. In other words, if the addition of two 32-bit values overflows, the gadget removes the carry bit (the 33rd most-significant bit). To do that, the logic witnesses a carry bit, which is used to remove the carry from the result if set to 1. The problem is that the carry bit `tmp` is not constrained to be correctly computed. That is, there are two scenarios in which this function can be maliciously used: (1) If `a + b` are overowing (the result is 33 bits), then you can set `tmp=0` and the output will be 33 bits, (2) If `a + b` is not overflowing (the result is 32 bits), then you can set `tmp=1` and the output will underflow (it should be around the bit size of the circuit field). Both are problems if the output is not constrained to be 32 bits on the caller side, which seems to be the case.

## Short Description of the Exploit



## Proposed Mitigation

In addition to fixing the issue, document the function to warn callers that they must be ensure that the two inputs are well-constrained to be 32-bit values.


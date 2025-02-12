# Unsound fixed-point multiplication (Not Reproduce)

* Id: penumbra-zone/penumbra/zksecurity_Unsound_fixed-point_multiplication
* Project: https://github.com/penumbra-zone/penumbra
* Commit: 0xa43b594
* Fix Commit: 1fdbe1ea10a270180c035aeb8bb7f4a3ff25d99e
* DSL: Arkworks
* Vulnerability: Computational Issue
* Impact: Soundness
* Root Cause: Wrong translation of logic into constraints
* Reproduced: False
* Location
  - Path: core/num
  - Function: U128x128Var::checked_mul
  - Line: 
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/zksecurity-penumbra.pdf
  - Bug ID: Unsound fixed-point multiplication
* Commands
  - Setup Environment: ``
  - Reproduce: ``
  - Compile and Preprocess: ``
  - Positive Test: ``
  - Find Exploit: ``
  - Clean: ``

## Short Description of the Vulnerability

The 'Unsound fixed-point multiplication' bug occurs when scaling two fixed-point values in the multiplication operation, leading to improper computation of the result due to incorrect limb handling. This error is critical as it impacts the accuracy of fixed-point arithmetic operations in the system, specifically in the context of financial calculations where precision is paramount. The issue lies in incorrectly accounting for overflow and implementing the truncation step required to maintain precision, essentially failing to scale back the multiplied result properly.

## Short Description of the Exploit



## Proposed Mitigation

Penumbra fixed the issue of unsound fixed-point multiplication by correctly constraining the limbs in the circuit.


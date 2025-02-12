# Invalid Comparisons on Fixed-Point Values are Accepted by the Circuit Verifier (Not Reproduce)

* Id: penumbra-zone/penumbra/nccgroup_Invalid_Comparisons_on_Fixed-Point_Values_are_Accepted_by_the_Circuit_Verifier
* Project: https://github.com/penumbra-zone/penumbra
* Commit: 0xa43b594
* Fix Commit: 954b3b2e678075baf1e06279ea41bb2823e540c76ddb80ba44b52476dfd3f55f
* DSL: Arkworks
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Wrong translation of logic into constraints
* Reproduced: False
* Location
  - Path: penumbra/crates/core/num/src/fixpoint.rs
  - Function: U128x128Var::enforce_cmp
  - Line: 428-459
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/nccgroup-penumbra.pdf
  - Bug ID: Invalid Comparisons on Fixed-Point Values are Accepted by the Circuit Verifier
* Commands
  - Setup Environment: ``
  - Reproduce: ``
  - Compile and Preprocess: ``
  - Positive Test: ``
  - Find Exploit: ``
  - Clean: ``

## Short Description of the Vulnerability

The bug causes an arithmetic circuit designed to compare fixed-point values to accept invalid input pairs, making such checks unreliable. Specifically, this flaw in the comparison logic within the circuit means that it may incorrectly validate comparisons as true even when one value is not genuinely greater than or less than the other, which de-secures any cryptographic mechanism relying on such comparisons for correctness assurance.

## Short Description of the Exploit



## Proposed Mitigation

To fix the issue of invalid comparisons on fixed-point values which are accepted by the circuit verifier, modify the bit-wise comparison logic in the circuit to correctly stop at the first discrepancy between input values. Implement two Boolean variables (e.g., 'gt' for "greater than" and 'lt' for "lower than") to improve the ternary state handling during bit comparisons, ensuring that the comparisons detect true inequalities between bit sequences. Additionally, add unit tests that specifically check invalid inequalities to ensure the prover refuses to create a proof for them.


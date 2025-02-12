# Input signal s is not constrained in eff_ecdsa.circom

* Id: personaelabs/spartan-ecdsa/yacademy-high-01
* Project: https://github.com/personaelabs/spartan-ecdsa
* Commit: 3386b30d9b5b62d8a60735cbeab42bfe42e80429
* Fix Commit: 
* DSL: Circom
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Missing Input Constraints
* Reproduced: True
* Location
  - Path: circuits/eff_ecdsa.circom
  - Function: EfficientECDSA
  - Line: 25-28
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/yacademy-spartan.md
  - Bug ID: Input signal s is not constrained in eff_ecdsa.circom
* Commands
  - Setup Environment: `./zkbugs_setup.sh`
  - Reproduce: `./zkbugs_exploit.sh`
  - Compile and Preprocess: `./zkbugs_compile_setup.sh`
  - Positive Test: `./zkbugs_positive_test.sh`
  - Find Exploit: `./zkbugs_find_exploit.sh`
  - Clean: `./zkbugs_clean.sh`

## Short Description of the Vulnerability

The circuit computes `pubKey = s * T + U` but `s` isn't constrained. If we set `s = 0` and `(Ux, Uy) = pubKey`, then `(Tx, Ty)` can be any pair of values.

## Short Description of the Exploit

Set `s = 0` and rest of the inputs can be any number.

## Proposed Mitigation

Add constraint to `s` so that `s * T` can't be skipped in the computation.

## Similar Bugs

* iden3/circomlib/kobi_gurkan_mimc_hash_assigned_but_not_constrained
* reclaimprotocol/circom-chacha20/zksecurity_unsound_left_rotation

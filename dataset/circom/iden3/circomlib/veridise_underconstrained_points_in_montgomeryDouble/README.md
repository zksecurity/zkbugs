# Underconstrained points in MontgomeryDouble

* Id: iden3/circomlib/veridise-V-CIRCOMLIB-VUL-005
* Project: https://github.com/iden3/circomlib
* Commit: cff5ab6288b55ef23602221694a6a38a0239dcc0
* Fix Commit: 
* DSL: Circom
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Missing Input Constraints
* Reproduced: True
* Location
  - Path: circuits/montgomery.circom
  - Function: MontgomeryDouble
  - Line: 18-19
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/veridise-circomlib.pdf
  - Bug ID: V-CIRCOMLIB-VUL-005: Underconstrained points in MontgomeryDouble
* Commands
  - Setup Environment: `./zkbugs_setup.sh`
  - Reproduce: `./zkbugs_exploit.sh`
  - Compile and Preprocess: `./zkbugs_compile_setup.sh`
  - Positive Test: `./zkbugs_positive_test.sh`
  - Find Exploit: `./zkbugs_find_exploit.sh`
  - Clean: `./zkbugs_clean.sh`

## Short Description of the Vulnerability

Lambda calculation involves a division but there is no constraint on the divisor to be non-zero. In this case `lamda` is underconstrained and can be set to any value.

## Short Description of the Exploit

Set `in[1]` to 0. Make the assumption that `3*x1_2 + 2*A*in[0] + 1 == 0` and solve for rest of the signals with some sagemath magic.

## Proposed Mitigation

Send `in[1]` to `isZero` template and let the constraint there do the work.

## Similar Bugs

* iden3/circomlib/veridise_decoder_accepting_bogus_output_signal
* iden3/circomlib/veridise_underconstrained_outputs_in_bitElementMulAny
* iden3/circomlib/veridise_underconstrained_points_in_edwards2Montgomery
* iden3/circomlib/veridise_underconstrained_points_in_montgomery2Edwards
* iden3/circomlib/veridise_underconstrained_points_in_montgomeryAdd

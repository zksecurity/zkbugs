# Under-Constrained

* Id: iden3/circomlib/veridise-V-CIRCOMLIB-VUL-004
* Project: https://github.com/iden3/circomlib
* Commit: cff5ab6288b55ef23602221694a6a38a0239dcc0
* Fix Commit: 
* DSL: Circom
* Vulnerability: Under-Constrained
* Location
  - Path: circuits/montgomery.circom
  - Function: MontgomeryAdd
  - Line: 16-17
* Source: Audit Report
  - Source Link: https://f8t2x8b2.rocketcdn.me/wp-content/uploads/2023/02/VAR-circom-bigint.pdf
  - Bug ID: V-CIRCOMLIB-VUL-004: Underconstrained points in MontgomeryAdd
* Commands
  - Setup Environment: `./zkbugs_setup.sh`
  - Reproduce: `./zkbugs_exploit.sh`
  - Compile and Preprocess: `./zkbugs_compile_setup.sh`
  - Positive Test: `./zkbugs_positive_test.sh`
  - Find Exploit: `./zkbugs_find_exploit.sh`
  - Clean: `./zkbugs_clean.sh`

## Short Description of the Vulnerability

Lambda calculation involves a division but there is no constraint on the divisor to be non-zero. In this case `out[1]` is underconstrained and can be set to any value.

## Short Description of the Exploit

Set `out[0]` to -168697. `out[1]` can be set to any value but it has to satisfy some relative relation with `in1[1]` and `in2[1]`. Check out `detect.sage` to learn more.

## Proposed Mitigation

Send `in2[0] - in1[0]` to `isZero` template and let the constraint there do the work.

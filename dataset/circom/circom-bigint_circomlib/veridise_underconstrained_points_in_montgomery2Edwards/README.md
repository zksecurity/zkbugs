# Under-Constrained

* Id: iden3/circomlib/veridise-V-CIRCOMLIB-VUL-003
* Project: https://github.com/iden3/circomlib
* Commit: cff5ab6288b55ef23602221694a6a38a0239dcc0
* Fix Commit: 
* DSL: Circom
* Vulnerability: Under-Constrained
* Location
  - Path: circuits/montgomery.circom
  - Function: Montgomery2Edwards
  - Line: 7-8
* Source: Audit Report
  - Source Link: https://f8t2x8b2.rocketcdn.me/wp-content/uploads/2023/02/VAR-circom-bigint.pdf
  - Bug ID: V-CIRCOMLIB-VUL-003: Underconstrained points in Montgomery2Edwards
* Commands
  - Setup Environment: `./zkbugs_setup.sh`
  - Reproduce: `./zkbugs_exploit.sh`
  - Compile and Preprocess: `./zkbugs_compile_setup.sh`
  - Positive Test: `./zkbugs_positive_test.sh`
  - Find Exploit: `./zkbugs_find_exploit.sh`
  - Clean: `./zkbugs_clean.sh`

## Short Description of the Vulnerability

The circuit does not implement a constraint to avoid division by zero. When setting the divisor to 0, `out[0]` is underconstrained and can be set to any value.

## Short Description of the Exploit

Set `in[1]` to 0 to trigger division by zero. Set `out[0]` to 1337 just to show that it can be set to any value.

## Proposed Mitigation

Send `in[1]` and `in[0] + 1` to `isZero` template and let the constraint there do the work.

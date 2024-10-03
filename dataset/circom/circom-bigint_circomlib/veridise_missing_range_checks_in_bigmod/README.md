# Missing range check

* Id: 0xbok/circom-bigint/veridise-V-BIGINT-COD-001
* Project: https://github.com/0xbok/circom-bigint
* Commit: 436665bf01728ae8c581fdb39e8428cb6b835c37
* Fix Commit: d3edd7503f48f98a71b6013c248ef3ad55e19703
* DSL: Circom
* Vulnerability: Missing range check
* Location
  - Path: circuits/bigint.circom
  - Function: BigMod
  - Line: 363-417
* Source: Audit Report
  - Source Link: https://veridise.com/wp-content/uploads/2023/02/VAR-circom-bigint.pdf
  - Bug ID: V-BIGINT-COD-001: Missing range checks in BigMod
* Commands
  - Setup Environment: `./zkbugs_setup.sh`
  - Reproduce: `./zkbugs_exploit.sh`
  - Compile and Preprocess: `./zkbugs_compile_setup.sh`
  - Positive Test: `./zkbugs_positive_test.sh`
  - Find Exploit: `./zkbugs_find_exploit.sh`
  - Clean: `./zkbugs_clean.sh`

## Short Description of the Vulnerability

The bug in the BigMod template arises from missing range checks on the remainder `mod[i]`, allowing it to exceed the expected range of `2**n`. This underconstrained error can be exploited by providing inputs that result in a remainder larger than `2^n`, potentially compromising the integrity of the circuit. Proper range checks are applied to the quotient `div[i]`, but not to `mod[i]`, leaving the system vulnerable to malicious inputs that break the invariant of the modulus operation.

## Short Description of the Exploit

We design a pair of `a` and `b` such that the remainder after `divmod` overflows `2**126`.

## Proposed Mitigation

Add additional range checking constraints for `mod[i]`. This can be done using the Num2Bits template.


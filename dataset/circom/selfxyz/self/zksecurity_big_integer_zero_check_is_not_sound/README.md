# Big Integer Zero-Check Is Not Sound

* Id: selfxyz/self/zksecurity_big_integer_zero_check_is_not_sound
* Project: https://github.com/selfxyz/self
* Commit: 
* Fix Commit: 
* DSL: Circom
* Vulnerability: Computational/Hints Error
* Impact: Soundness
* Root Cause: Wrong translation of logic into constraints
* Reproduced: True
* Location
  - Path: 
  - Function: BigIntIsZero
  - Line: 05-26
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/zksecurity-celo-self-audit.pdf
  - Bug ID: #02 - Big Integer Zero-Check Is Not Sound
* Commands
  - Setup Environment: `./zkbugs_setup.sh`
  - Reproduce: `./zkbugs_exploit.sh`
  - Compile and Preprocess: `./zkbugs_compile_setup.sh`
  - Positive Test: `./zkbugs_positive_test.sh`
  - Find Exploit: `./zkbugs_find_exploit.sh`
  - Clean: `./zkbugs_clean.sh`

## Short Description of the Vulnerability

One of the core operation that is used throughout the big integer implementation is the assertion for a zero element. It is implemented in the template `BigIntIsZero` and is used in multiple places in the library. It does so by first accumulating the carries, then range checking the final carry value and then asserting that the final carry is the opposite of the most significant chunk. However, the accumulation of the carries is performed over the native field, so the entire relation is checked modulo the Circom native prime.

## Short Description of the Exploit

This bug does not compromise completeness, as the zero integer will still be considered as zero modulo the native prime. However, this check is not sound, as a non-zero integer, which is zero mod native prime, will be considered zero by the library.

## Proposed Mitigation

 It is recommended that the Big Integer Library used for ECDSA Verification is either carefully reviewed for such issues and fixed, or it is replaced by a more mature implementation.


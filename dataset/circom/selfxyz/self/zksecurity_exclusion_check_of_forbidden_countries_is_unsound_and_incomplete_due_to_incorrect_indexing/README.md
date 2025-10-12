# Exclusion Check Of Forbidden Countries Is Unsound And Incomplete Due To Incorrect Indexing

* Id: selfxyz/self/zksecurity_exclusion_check_of_forbidden_countries_is_unsound_and_incomplete_due_to_incorrect_indexing
* Project: https://github.com/selfxyz/self
* Commit: 59c16d6e924c946970665504d883ced46981e5c1
* Fix Commit: 
* DSL: Circom
* Vulnerability: Computational/Hints Error
* Impact: Soundness and Completeness
* Root Cause: Wrong translation of logic into constraints
* Reproduced: True
* Location
  - Path: circuits/circuits/utils/passport/disclose/proveCountryIsNotInList.circom
  - Function: ProveCountryIsNotInList
  - Line: 12-18
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/zksecurity-celo-self-audit.pdf
  - Bug ID: #00 - Exclusion Check Of Forbidden Countries Is Unsound And Incomplete Due To Incorrect Indexing
* Commands
  - Setup Environment: `./zkbugs_setup.sh`
  - Reproduce: `./zkbugs_exploit.sh`
  - Compile and Preprocess: `./zkbugs_compile_setup.sh`
  - Positive Test: `./zkbugs_positive_test.sh`
  - Find Exploit: `./zkbugs_find_exploit.sh`
  - Clean: `./zkbugs_clean.sh`

## Short Description of the Vulnerability

The `ProveCountryIsNotInList` check is performed by iterating over forbidden countries entry and comparing each letter individually for equality. However, the index `i` that is used to loop over the forbidden countries list is incorrect, as it should loop over `i * 3` instead.

## Short Description of the Exploit

This issue breaks both soundness and completeness as demonstrated by the following examples: 
- **Unsound**: let `MAX_FORBIDDEN_COUNTRIES_LIST_LENGTH = 3` and `forbidden_countries_list = ['ABC','DEF','GHI']`, then someone with the passport from `GHI` country will pass the check because the loop will stop at `i = 3`. 
- **Incomplete**: let `forbidden_countries_list = ['ABC','DEF']`, then someone with the passport from `BCD` country will not pass the check because the loop will also check over `i = 2`, `i = 3`, and `i = 4`.

## Proposed Mitigation

Update the indexing of `forbidden_countries_list` to use `i*3`.


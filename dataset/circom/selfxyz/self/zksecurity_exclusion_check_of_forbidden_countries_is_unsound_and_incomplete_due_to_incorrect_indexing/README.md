# Exclusion Check Of Forbidden Countries Is Unsound And Incomplete Due To Incorrect Indexing

* Id: selfxyz/self/zksecurity_exclusion_check_of_forbidden_countries_is_unsound_and_incomplete_due_to_incorrect_indexing
* Project: https://github.com/selfxyz/self
* Commit: 59c16d6e924c946970665504d883ced46981e5c1
* Fix Commit: 
* DSL: Circom
* Vulnerability: Computational Issues
* Impact: Soundness and Completeness
* Root Cause: Wrong Translation of Logic into Constraints
* Reproduced: False
* Codebase: dataset/codebases/circom/selfxyz/self/59c16d6e924c946970665504d883ced46981e5c1
* Original Entrypoint: circuits/circuits/disclose/vc_and_disclose.circom
* Direct Entrypoint: circuit.circom
* Location
  - Path: circuits/circuits/utils/passport/disclose/proveCountryIsNotInList.circom
  - Function: ProveCountryIsNotInList
  - Line: 12-18
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/zksecurity-celo-self-audit.pdf
  - Bug ID: #00 - Exclusion Check Of Forbidden Countries Is Unsound And Incomplete Due To Incorrect Indexing
* Input
  - Original: input.json
  - Direct: direct_input.json
* Commands
  - Setup Environment: `./zkbugs_setup.sh`
  - Compile and Preprocess: `./zkbugs_compile_setup.sh`
  - Positive Test: `./zkbugs_positive_test.sh`
  - Clean: `./zkbugs_clean.sh`
  - Compile: `./zkbugs_compile.sh`

## Running

Scripts support two modes controlled by the `ZKBUGS_MODE` environment variable:

- **`original`** (default): compiles the project's main circuit from the full codebase.
- **`direct`**: compiles an isolated wrapper (`circuit.circom`) that only instantiates the vulnerable template.

```bash
# Setup (run once)
./zkbugs_setup.sh

# Compile only (no zkey ceremony)
./zkbugs_compile.sh                        # original mode
ZKBUGS_MODE=direct ./zkbugs_compile.sh     # direct mode

# Full setup with zkey ceremony + positive test (direct mode)
ZKBUGS_MODE=direct ./zkbugs_compile_setup.sh
ZKBUGS_MODE=direct ./zkbugs_positive_test.sh

# Clean build artifacts
./zkbugs_clean.sh
```

## Short Description of the Vulnerability

The `ProveCountryIsNotInList` check is performed by iterating over forbidden countries entry and comparing each letter individually for equality. However, the index `i` that is used to loop over the forbidden countries list is incorrect, as it should loop over `i * 3` instead.

## Proposed Mitigation

Update the indexing of `forbidden_countries_list` to use `i*3`.

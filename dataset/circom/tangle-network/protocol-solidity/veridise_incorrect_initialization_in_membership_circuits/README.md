# Incorrect Initialization in Membership Circuits

* Id: tangle-network/protocol-solidity/veridise_incorrect_initialization_in_membership_circuits
* Project: https://github.com/tangle-network/protocol-solidity
* Commit: 848d073bb17f0aaffc6d39f594cc59efedeaec89
* Fix Commit: eeb4fc7a4883d513e3fe3adbe2c447133ccd39f2
* DSL: Circom
* Vulnerability: Computational Issues
* Impact: Soundness
* Root Cause: Wrong Translation of Logic into Constraints
* Reproduced: False
* Codebase: dataset/codebases/circom/tangle-network/protocol-solidity/848d073bb17f0aaffc6d39f594cc59efedeaec89
* Original Entrypoint: circuits/test/poseidon_vanchor_2_2.circom
* Direct Entrypoint: circuit.circom
* Location
  - Path: circuits/set/membership.circom
  - Function: SetMembership
  - Line: 20
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/veridise-tangle-network-protocol-solidity.pdf
  - Bug ID: V-WBT-VUL-006
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

The templates `SetMembership` try to check if an element e is in a set S by generating a constraint of the form: for all  s in S, product of (s - e) = 0. They do does this by iterating over elements s of the set S and building the product. The issue is that `product[0]` is initialized to `element` which makes the constarint to be trivailly satisfied when `element` is 0.

## Proposed Mitigation

We recommend that `product[0]` is initialized to 1.

# Underconstrained is_complete flag in recursive verifier

* Id: succinctlabs/sp1/ghsa-c873-wfhp-wx5m-2
* Project: https://github.com/succinctlabs/sp1
* Commit: 4681d4f0298b387f074fc93f8254584db9d258de
* Fix Commit: 4fe8144f1d57b27503f23795320a4e0eedf464c5
* DSL: Plonky3
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Missing Input Constraints
* Reproduced: False
* Codebase: 
* Original Entrypoint: (same as direct)
* Direct Entrypoint: 
* Location
  - Path: crates/recursion/circuit/src/machine/core.rs
  - Function: verify
  - Line: 120
* Source: GitHub Security Advisory
  - Source Link: https://github.com/succinctlabs/sp1/security/advisories/GHSA-c873-wfhp-wx5m
  - Bug ID: GHSA-c873-wfhp-wx5m (Bug 2 of 3) Missing verifier checks and fiat-shamir observations
* Commands
  - Setup Environment: `./zkbugs_setup.sh`
  - Reproduce: ``
  - Compile and Preprocess: ``
  - Positive Test: ``
  - Find Exploit: ``
  - Clean: `./zkbugs_clean.sh`

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

In SP1's recursive verifier, the is_complete boolean flag is used to flag a proof of complete execution. Prior to v4.0.0, this flag was underconstrained in parts of the recursive verifier, such as the first layer of recursion. This allows proofs of partial execution to be verified as proofs of complete execution.

## Proposed Mitigation

Add appropriate calls to the assert_complete function to constrain the correctness of the is_complete flag in all parts of the recursive verifier (implemented in v4.0.0).

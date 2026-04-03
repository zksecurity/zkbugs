# Previously Correct Ownership Proof Disabled via Code Changes

* Id: zkopru-network/zkopru/leastauthority-previously-correct-ownership-proof-disabled-via-code-changes
* Project: https://github.com/zkopru-network/zkopru/releases/tag/audit-v1
* Commit: 4236fc8a5cbf73b7f3860d87a1a447eea8d7abd4
* Fix Commit: 6458fe4ef384d2f2198aae00e719a7f94c30f090
* DSL: Circom
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Unsafe Reuse of Circuit
* Reproduced: False
* Codebase: dataset/codebases/circom/tag/audit-v1/4236fc8a5cbf73b7f3860d87a1a447eea8d7abd4
* Entrypoint: TODO_ENTRYPOINT
* Direct Entrypoint: circuit.circom
* Location
  - Path: circuits/ownership_proof.circom
  - Function: OwnershipProof
  - Line: 14
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/leastauthority-zkorpu.pdf
  - Bug ID: Issue C: Previously Correct Ownership Proof Disabled via Code Changes
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

The circuit integrates with `EdDSAPoseidonVerifier` template from circomlib, but the `enabled` signal is set to 0, disabling the verification. There is no signature verification in the circuit, so attacker can craft some non-existent signature and still generate a valid proof.

## Proposed Mitigation

Change the line of code to `eddsa.enabled <== 1`.

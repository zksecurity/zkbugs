# No Zero Value Validation

* Id: semaphore-protocol/semaphore/veridise-V-SEM-VUL-001
* Project: https://github.com/semaphore-protocol/semaphore
* Commit: 27320f17233b18de477a74919084fba76513470f
* Fix Commit: 
* DSL: Circom
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Missing Input Constraints
* Reproduced: False
* Codebase: dataset/codebases/circom/semaphore-protocol/semaphore/27320f17233b18de477a74919084fba76513470f
* Entrypoint: TODO_ENTRYPOINT
* Direct Entrypoint: circuit.circom
* Location
  - Path: circuits/semaphore.circom
  - Function: Semaphore
  - Line: 47-88
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/veridise-semaphore.pdf
  - Bug ID: V-SEM-VUL-001: No Zero Value Validation
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

The bug in the Semaphore protocol involves the use of a zeroValue in incremental Merkle trees, which acts as an implicit group member. This zeroValue cannot be removed, and its addition does not trigger a MemberAdded event, making it invisible in membership records. This allows the group creator guaranteed access, which can be problematic if the admin changes. Additionally, if common values like 0 are compromised, they could be used to gain unauthorized access to groups.

## Proposed Mitigation

Disallow proofs where the leaf corresponds to the zeroValue to ensure only legitimate users are added.

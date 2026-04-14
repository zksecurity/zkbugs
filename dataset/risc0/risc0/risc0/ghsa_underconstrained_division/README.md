# Underconstrained vulnerability in division

* Id: risc0/risc0/ghsa-f6rc-24x4-ppxp
* Project: https://github.com/risc0/risc0
* Commit: c8fd3bd2e2e18ad7a5abce213a376432116db039
* Fix Commit: bef7bf580eb13d5467074b5f6075a986734d3fe5
* DSL: risc0
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Missing Constraint
* Reproduced: False
* Codebase: 
* Original Entrypoint: (same as direct)
* Direct Entrypoint: 
* Location
  - Path: risc0/circuit/rv32im-sys/kernels/cxx/steps.cpp
  - Function: exec_DoDiv
  - Line: 1335-1355
* Source: GitHub Security Advisory
  - Source Link: https://github.com/risc0/risc0/security/advisories/GHSA-f6rc-24x4-ppxp
  - Bug ID: GHSA-f6rc-24x4-ppxp: Underconstrained Vulnerability Division
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

Two issues were found in the risc0-circuit-rv32im circuit: (1) For some inputs to signed integer division, the circuit allowed two outputs, only one of which was valid. (2) The result of division by zero was underconstrained. This vulnerability was identified using the Picus tool from Veridise. Affected versions: risc0-zkvm >= 2.0, < 2.2.

## Proposed Mitigation

Fixed in PR #3235 and zirgen issue #249. Upgrade to risc0-zkvm version 2.2.0 or later, or risc0-circuit-rv32im version 3.0.0 or later. On-chain verifiers were disabled via estop mechanism.

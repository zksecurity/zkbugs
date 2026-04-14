# zkVM underconstrained vulnerability in 3-register instructions

* Id: risc0/risc0/ghsa-g3qg-6746-3mg9
* Project: https://github.com/risc0/risc0
* Commit: 98387806fe8348d87e32974468c6f35853356ad5
* Fix Commit: 67f2d81c638bff5f4fcfe11a084ebb34799b7a89
* DSL: risc0
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Missing Constraint
* Reproduced: False
* Codebase: 
* Original Entrypoint: (same as direct)
* Direct Entrypoint: 
* Location
  - Path: risc0/circuit/rv32im/src/execute/rv32im.rs
  - Function: step_compute, step_store
  - Line: 327, 504
* Source: GitHub Security Advisory
  - Source Link: https://github.com/risc0/risc0/security/advisories/GHSA-g3qg-6746-3mg9
  - Bug ID: GHSA-g3qg-6746-3mg9: zkVM Underconstrained Vulnerability
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

Due to a missing constraint in the rv32im circuit, any 3-register RISC-V instruction (including remu and divu) in risc0-zkvm 2.0.0-2.0.2 are vulnerable to an attack by a malicious prover. When rs1 == rs2, the vulnerable code performs two register reads to the same address in a single memory cycle, but the circuit's memory subsystem lacks proper constraints to handle multiple accesses to the same address within one cycle, creating an underconstrained state. Reported by Christoph Hochrainer via Hackenproof bug bounty. Fixed in PR #3181 (squash merge).

## Proposed Mitigation

Fix implemented in zirgen/pull/238 (circuit fix) and risc0/pull/3181 (risc0 update). Upgrade to risc0-zkvm version 2.1.0 or later, or risc0-circuit-rv32im version 2.0.4 or later. On-chain verifiers were disabled via estop mechanism.

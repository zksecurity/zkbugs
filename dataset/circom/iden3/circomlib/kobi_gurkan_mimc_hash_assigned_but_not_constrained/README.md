# MiMC Hash: Assigned but not Constrained

* Id: iden3/circomlib/Kobi-Gurkan-MiMC-Hash-Assigned-but-not-Constrained
* Project: https://github.com/iden3/circomlib
* Commit: 324b8bf8cc4a80357354752deb6c2ae5be22e5f5
* Fix Commit: 109cdf40567fce284dca1d535819ce28922653e0
* DSL: Circom
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Assigned but Unconstrained
* Reproduced: False
* Codebase: dataset/codebases/circom/iden3/circomlib/324b8bf8cc4a80357354752deb6c2ae5be22e5f5
* Original Entrypoint: (same as direct)
* Direct Entrypoint: circuit.circom
* Location
  - Path: circuits/mimcsponge.circom
  - Function: MiMCSponge
  - Line: 28
* Source: Bug Tracker
  - Source Link: https://github.com/0xPARC/zk-bug-tracker?tab=readme-ov-file#14-mimc-hash-assigned-but-not-constrained
  - Bug ID: MiMC Hash: Assigned but not Constrained
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

In `MiMCSponge` template, `outs[0]` is assigned but not constrained, so it can be any value. Note that the circuit code is modified from a newer version since the original buggy code couldn't be reproduced in Circom version 2. The bug idea is still the same.

## Proposed Mitigation

Use `<==` instead of `<--` to add a constraint to `outs[0]`.

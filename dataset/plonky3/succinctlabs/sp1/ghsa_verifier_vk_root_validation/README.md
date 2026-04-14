# Missing vk_root validation in Rust verifier

* Id: succinctlabs/sp1/ghsa-6248-228x-mmvh-1
* Project: https://github.com/succinctlabs/sp1
* Commit: ad212dd52bdf8f630ea47f2b58aa94d5b6e79904
* Fix Commit: aa9a8e40b6527a06764ef0347d43ac9307d7bf63
* DSL: Plonky3
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Missing Input Constraints
* Reproduced: False
* Codebase: 
* Original Entrypoint: (same as direct)
* Direct Entrypoint: 
* Location
  - Path: crates/prover/src/verify.rs
  - Function: verify_compressed, verify_shrink, verify_deferred_proof
  - Line: 297, 335, 506
* Source: GitHub Security Advisory
  - Source Link: https://github.com/succinctlabs/sp1/security/advisories/GHSA-6248-228x-mmvh
  - Bug ID: GHSA-6248-228x-mmvh: (Bug 1 of 2) Insufficient checks in the Rust verifier and embedded allocators
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

In SP1's native Rust verifier (crates/prover/src/verify.rs), the verify_compressed, verify_shrink, and verify_deferred_proof functions validated verification keys by checking if their hash was in the precomputed recursion_vk_map, but did not validate that the vk_root field (merkle root of all valid verifying key hashes) in the proof's public values matched the expected precomputed vk_root. This allowed a malicious prover to submit proofs with an arbitrary/invalid vk_root that would still pass verification. The recursive verifier circuit and on-chain verifier were not affected as they correctly checked this issue. Found during Zellic audit, fixed in v5.0.0 (commit aa9a8e40).

## Proposed Mitigation

Add explicit vk_root validation in the Rust verifier: check if public_values.vk_root != self.recursion_vk_root in verify_compressed, verify_shrink, and verify_deferred_proof functions. Return InvalidPublicValues error if mismatch detected. Implemented in v5.0.0 (commit aa9a8e40 at lines 323, 366, 549).

# AUIPC PC Byte Decomposition Overflow Due to Iterator Off-by-One Error

* Id: openvm-org/openvm/GHSA-jf2r-x3j4-23m7
* Project: https://github.com/openvm-org/openvm
* Commit: f41640c37bc5468a0775a38098053fe37ea3538a
* Fix Commit: 68da4b50c033da5603517064aa0a08e1bbf70a01
* DSL: Plonky3
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Other Programming Errors
* Reproduced: False
* Codebase: 
* Original Entrypoint: (same as direct)
* Direct Entrypoint: 
* Location
  - Path: extensions/rv32im/circuit/src/auipc/core.rs
  - Function: Rv32AuipcCoreAir::eval, Rv32AuipcCoreChip::execute_instruction
  - Line: 133, 245
* Source: GitHub Security Advisory
  - Source Link: https://github.com/openvm-org/openvm/security/advisories/GHSA-jf2r-x3j4-23m7
  - Bug ID: CVE-2025-46723, GHSA-jf2r-x3j4-23m7: Byte decomposition of pc in AUIPC chip can overflow
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

The AUIPC (Add Upper Immediate to PC) chip in OpenVM's RISC-V circuit contains an off-by-one error in byte decomposition logic for the program counter. A typo in iterator method chaining (for (i, limb) in pc_limbs.iter().skip(1).enumerate()) causes enumeration to produce indices 0,1,2 when the code expects 1,2,3. This makes the condition 'if i == pc_limbs.len() - 1' never trigger for the highest limb pc_limbs[3], resulting in it being range-checked to 8 bits instead of the required 6 bits. The weakened constraint allows the decomposed representation of pc to overflow the BabyBear field, enabling a malicious prover to make the AUIPC instruction's destination register take an arbitrary incorrect value. This bug was ironically introduced as a typo while fixing a previous vulnerability (Cantina finding #21). Affected version: 1.0.0, patched in 1.1.0.

## Proposed Mitigation

Fix the iterator method order from .skip(1).enumerate() to .enumerate().skip(1). This ensures enumeration happens before skipping, producing indices 1,2,3 as expected by the logic. With correct indices, the conditional 'if i == pc_limbs.len() - 1' triggers when i equals 3 (the last limb index), properly applying the 6-bit range check to pc_limbs[3] to prevent field overflow.

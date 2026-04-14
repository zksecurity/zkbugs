# Missing range check for address values in MPT Circuit

* Id: scroll-tech/mpt-circuit/zellic_Missing_range_check_for_address_values_in_MPT_Circuit
* Project: https://github.com/scroll-tech/mpt-circuit
* Commit: 0x25dd32aa316ec842ffe79bb8efe9f05f86edc33e
* Fix Commit: e4f5df31e9b3005bb5977c11aa0c3b262cfe3269
* DSL: Halo2
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Missing Input Constraints
* Reproduced: False
* Codebase: 
* Original Entrypoint: (same as direct)
* Direct Entrypoint: 
* Location
  - Path: MPTCircuit/gadgets/mpt_update.rs
  - Function: 
  - Line: 47
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/zellic-scroll-2.pdf
  - Bug ID: Missing range check for address values in MPT Circuit
* Commands
  - Setup Environment: ``
  - Reproduce: ``
  - Compile and Preprocess: ``
  - Positive Test: ``
  - Find Exploit: ``
  - Clean: ``

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

The bug "Missing range check for address values in MPT Circuit" relates to the lack of validation for account addresses used as MPT keys, which could lead to multiple keys being generated for the same address. This situation risks creating inconsistencies in the state trie, as the absence of range checks enables potential attackers to manipulate values. The recommendation is to implement appropriate checks to ensure address values fall within specific byte ranges.

## Proposed Mitigation

Add appropriate range checks for the account address and associated values in the MPT Circuit, ensuring that the address is within 20 bytes (160 bits), the address_high within 16 bytes (128 bits), and the calculated address_low (before multiplication by 2^96) within 4 bytes (32 bits).

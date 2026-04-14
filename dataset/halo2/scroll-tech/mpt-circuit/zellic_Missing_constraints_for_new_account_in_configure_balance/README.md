# Missing constraints for new account in configure_balance

* Id: scroll-tech/mpt-circuit/zellic_Missing_constraints_for_new_account_in_configure_balance
* Project: https://github.com/scroll-tech/mpt-circuit
* Commit: 0x25dd32aa316ec842ffe79bb8efe9f05f86edc33e
* Fix Commit: ef64eb52548946a0dd7f0ee83ce71ed8d460c405
* DSL: Halo2
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Assigned but Unconstrained
* Reproduced: False
* Codebase: 
* Original Entrypoint: (same as direct)
* Direct Entrypoint: 
* Location
  - Path: MPTCircuit/gadgets/mpt_update.rs
  - Function: configure_balance
  - Line: 53
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/zellic-scroll-2.pdf
  - Bug ID: Missing constraints for new account in configure_balance
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

The bug 'Missing constraints for new account in configure_balance' indicates that within the MPT circuit's configure_balance function, there is a lack of a required constraint that the sibling must equal zero when creating a new entry in the accounts trie and assigning the balance of the account. This omission may lead to soundness issues during the update of the balance for a new address. It is recommended to add a check to enforce that the sibling (nonce/codesize) is indeed equal to zero.

## Proposed Mitigation

Add a constraint in the configure_balance function to ensure that the sibling is equal to 0 when the segment type is AccountLeaf3 and the path type is ExtensionNew. This will prevent potential soundness issues when updating the balance of a new address.

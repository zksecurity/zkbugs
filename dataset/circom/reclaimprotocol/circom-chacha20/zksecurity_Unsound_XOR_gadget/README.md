# Unsound XOR gadget

* Id: reclaimprotocol/circom-chacha20/zksecurity_Unsound_XOR_gadget
* Project: https://github.com/reclaimprotocol/circom-chacha20
* Commit: ef9f5a5ad899d852740a26b30eabe5765673c71f
* Fix Commit: ef9f5a5ad899d852740a26b30eabe5765673c71f
* DSL: Circom
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Wrong Translation of Logic into Constraints
* Reproduced: False
* Codebase: dataset/codebases/circom/reclaimprotocol/circom-chacha20/ef9f5a5ad899d852740a26b30eabe5765673c71f
* Entrypoint: TODO_ENTRYPOINT
* Direct Entrypoint: circuit.circom
* Location
  - Path: generics.circom
  - Function: XorWords
  - Line: 
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/zksecurity-reclaimprotocol.pdf
  - Bug ID: Unsound XOR gadget
* Input
  - Original: input.json
  - Direct: direct_input.json
* Commands
  - Setup Environment: ``
  - Compile and Preprocess: ``
  - Positive Test: ``
  - Clean: ``
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

The "Unsound XOR gadget" bug found in the "generics.circom" of the Reclaim Protocol's ChaCha20 circuit relates to the incorrect implementation of the XOR operation on two M-bit value arrays. The bit constraints meant to ensure that the set bits were either 0 or 1 were commented out during the audit, compromising the security and validity of the operation. The XOR logic was supposed to decompose each operand into a series of checks on individual bits, but it failed to enforce that all bits must exactly represent the original values, allowing a malicious party to exploit the poorly constrained bit representation.

## Proposed Mitigation

The recommended fix for the 'Unsound XOR gadget' is to enforce an XOR constraint (res = a + b - 2*ab) on each bit individually, ensuring that each bit is correctly constrained as 0 or 1.

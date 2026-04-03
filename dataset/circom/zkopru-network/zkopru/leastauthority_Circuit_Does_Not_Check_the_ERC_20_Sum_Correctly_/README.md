# Circuit Does Not Check the ERC-20 Sum Correctly 

* Id: zkopru-network/zkopru/leastauthority_Circuit_Does_Not_Check_the_ERC-20_Sum_Correctly_
* Project: https://github.com/zkopru-network/zkopru
* Commit: 4236fc8a5cbf73b7f3860d87a1a447eea8d7abd4
* Fix Commit: 30a19913ce1a018ce26a34d3d6621fcd38579171
* DSL: Circom
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Circuit Design Issue
* Reproduced: False
* Codebase: dataset/codebases/circom/zkopru-network/zkopru/4236fc8a5cbf73b7f3860d87a1a447eea8d7abd4
* Original Entrypoint: packages/circuits/impls/zk_transaction_1_1.circom
* Direct Entrypoint: circuit.circom
* Location
  - Path: packages/circuits/lib/zk_transaction.circom
  - Function: 
  - Line: 255
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/leastauthority-zkorpu.pdf
  - Bug ID: Circuit Does Not Check the ERC-20 Sum Correctly 
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

The Zkopru zk-SNARK circuit has an issue where it incorrectly checks the ERC-20 token sum during transactions. This oversight allows a scenario where the circuit only verifies the sum of tokens for addresses included in the input notes, but fails to check for other addresses. Consequently, this bug could potentially let a malicious actor drain funds by exploiting this loophole, undetectably taking tokens not accounted for in the input notes.

## Proposed Mitigation

Modify the circuit to enforce that outputs do not contain ERC-20 addresses that are not part of any spend note. This issue was resolved by the Zkopru team during the audit.

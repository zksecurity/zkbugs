# Missing constraint in PIL leading to execution flow hijack

* Id: 0xPolygonHermez/zkevm-proverjs/hexens_Missing_constraint_in_PIL_leading_to_execution_flow_hijack
* Project: https://github.com/0xPolygonHermez/zkevm-proverjs
* Commit: 0x313dc
* Fix Commit: 9d6a8948636c05d508694a90d192a0713562ce29
* DSL: PIL
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Missing Input Constraints
* Reproduced: False
* Codebase: 
* Original Entrypoint: (same as direct)
* Direct Entrypoint: 
* Location
  - Path: utils.zkasm
  - Function: 
  - Line: 
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/hexens-polygonzkevm.pdf
  - Bug ID: Missing constraint in PIL leading to execution flow hijack
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

The bug titled "Missing constraint in PIL leading to execution flow hijack" involves a lacking constraint in the main.pil associated with the free input checking in zkEVM ROM. This absence allows the potential for execution flow hijack, enabling an attacker to specify arbitrary jump addresses in ROM, potentially increasing balance or causing other impacts. Furthermore, because of the missing constraint, the isNeg variable can improperly evaluate to values other than 0 or 1, thereby facilitating the unintended execution flow change. This bug was classified with a severity of Critical and has been fixed as per the report.

## Proposed Mitigation

To fix the "Missing constraint in PIL leading to execution flow hijack" bug, add a constraint for the inNeg polynomial to ensure that it only evaluates to 0 or 1 using the equation: isNeg * (1-isNeg) = 0.

# ZoneIdInclusionProver Check Can Be Bypassed

* Id: pantherfoundation/panther-core/veridise_zone_id_inclusion_prover_bypass
* Project: https://github.com/pantherfoundation/panther-core
* Commit: b464348b33155a5877f67c085c7206dc29ad7cb7
* Fix Commit: 0621e84
* DSL: Circom
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Missing Input Constraints
* Reproduced: False
* Codebase: dataset/codebases/circom/pantherfoundation/panther-core/b464348b33155a5877f67c085c7206dc29ad7cb7
* Original Entrypoint: circuits/circuits/mainZTransactionV1.circom
* Direct Entrypoint: circuit.circom
* Location
  - Path: circuits/circuits/templates/zoneIdInclusionProver.circom
  - Function: ZoneIdInclusionProver
  - Line: 30-45
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/veridise-panther.pdf
  - Bug ID: V-PAN-VUL-015: ZoneIdInclusionProver check can be bypassed
* Input
  - Original: input.json
  - Direct: direct_input.json
* Commands
  - Setup Environment: `./zkbugs_setup.sh`
  - Compile: `./zkbugs_compile.sh`
  - Compile and Preprocess: `./zkbugs_compile_setup.sh`
  - Positive Test: `./zkbugs_positive_test.sh`
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

The `ZoneIdInclusionProver` template (zoneIdInclusionProver.circom) is meant to verify that the caller's `zoneId` sits at position `offset` in a 16-slot `zoneIds` list. The main verification loop is `for(var i = 0; i < 15; i++)` and enables the per-slot `ForceEqualIfEnabled()` check only when `is_equal[i].out == 1` (i.e. `i == offset`). The template's assertion `assert(offset < 16);` is a compile-time `assert`, not a constraint — and the loop only iterates `i` from 0 to 14. Therefore setting `offset = 15` makes every `is_equal[i]` evaluate to 0, no ForceEqualIfEnabled is activated, and the whole zone-permission check is silently skipped. A malicious prover can bypass zone checks and send funds to a disallowed zone.

## Proposed Mitigation

Constrain `offset` to be strictly less than 15 using a ForceLessThan(4) / LessThan() check so the silent skip is impossible, and/or iterate `i` from 0 to 15 inclusive to match the 4-bit domain of `offset`.

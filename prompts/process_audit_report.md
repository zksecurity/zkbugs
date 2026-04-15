# Process Audit Report — ZK Bug Extraction

You are processing an audit report to extract ZK circuit vulnerabilities and add them to the zkbugs dataset. The dataset supports multiple DSLs (Circom, Halo2, Cairo, Arkworks, Bellperson, PIL, Gnark, Plonky3, Risc0). Follow these three phases exactly.

## Input

The user will provide:
- Path to an audit report PDF
- (Optional) GitHub project URL, vulnerable commit, fix commit, auditor name

If any of these are missing, ask the user before proceeding.

---

## Phase 1: Report Parsing & Setup (Main Agent)

### 1.1 Read the audit report

Read the PDF. Identify the project name, auditor, DSL used, and all findings.

### 1.2 Detect the DSL

Determine the DSL from the report content. Look for:
- **Circom**: `.circom` files, `template`, `signal`, `component`, `<==`, `<--`, `===`, snarkjs, circomlib
- **Halo2**: Rust code, `halo2_proofs`, `Circuit`, `configure`, `synthesize`, `Region`, `Advice`/`Fixed` columns
- **Cairo**: `.cairo` files, `func`, `felt`, `assert`, StarkWare, STARK proofs
- **Arkworks**: Rust code, `arkworks`, `ConstraintSynthesizer`, `R1CS`, `cs.enforce_constraint`
- **Bellperson**: Rust code, `bellperson`, `Circuit`, `ConstraintSystem`, Groth16
- **PIL**: `.pil` files, polynomial identity language, Polygon zkEVM
- **Gnark**: Go code, `gnark`, `frontend.Variable`, `api.AssertIs`
- **Plonky3**: Rust code, `plonky3`, `Air`, `AirBuilder`
- **Risc0**: Rust code, `risc0`, zkVM

Set `DSL_LOWER` to the lowercase directory name (e.g., `circom`, `halo2`, `cairo`).
Set `DSL_DISPLAY` to the display name (e.g., `Circom`, `Halo2`, `Cairo`).

### 1.3 Extract project metadata

Determine or ask the user for:
- **GitHub project URL** (e.g., `https://github.com/org/repo`)
- **Vulnerable commit hash** (full 40-char SHA when possible)
- **Fix commit hash** (if available, else empty string)
- **Auditor name** (lowercase, for directory naming — e.g., `zksecurity`, `veridise`, `trailofbits`)
- **Report file path** relative to repo root (e.g., `reports/documents/auditor-project.pdf`)

Derive from these:
- `ORG` and `REPO` from the URL

### 1.4 Identify circuit vulnerabilities

Extract all findings that are **circuit-level vulnerabilities** at **Medium severity or above**.

**Skip** these:
- Low and Informational severity findings
- Smart-contract-only bugs (Solidity, no circuit impact)
- Gas optimizations, documentation issues, best practices
- Findings that are not about circuit constraints, signals, or proof systems

For each qualifying bug, extract:
- **Title**: The finding title from the report
- **Bug ID**: The finding identifier (e.g., "#3", "V-SEM-VUL-001")
- **Severity**: Critical, High, or Medium
- **Location**: File path, function/template name, line numbers
- **Description**: What the vulnerability is, with specific code references
- **Fix/Mitigation**: The recommended fix from the report
- **Fix commit**: If a specific fix commit is mentioned

### 1.5 Classify each bug

Use the existing taxonomy. If no category fits, propose a new one.

**Vulnerability types** (pick one):
- `Under-Constrained`
- `Over-Constrained`
- `Computational Issues`

**Root Causes** (pick one):
- `Wrong Translation of Logic into Constraints`
- `Unsafe Reuse of Circuit`
- `Missing Input Constraints`
- `Arithmetic Field Issues`
- `Assigned but Unconstrained`
- `Circuit Design Issue`
- `Misimplementation of a Specification`
- `Other Programming Errors`

**Impacts** (pick one):
- `Soundness`
- `Completeness`
- `Soundness and Completeness`

If a bug does not fit any existing category, propose a new one. Track all proposals — you will print them in Phase 3.

### 1.6 Create a working branch

```bash
git checkout -b add-bugs/<auditor>-<repo>
```

### 1.7 Circom-specific setup

**Only if DSL is Circom**, perform these additional steps:

1. Derive `CODEBASE_REL = dataset/codebases/circom/<ORG>/<REPO>/<COMMIT>`
2. Update `scripts/download_sources.sh` to support the new codebase:
   - The `ENTRIES` Python block (lines 40-61) reads from `zkbugs_config.json` files automatically — no change needed there.
   - If the project needs **circomlib symlinks** or **npm dependencies**, add the appropriate setup in the dependency section (after line 155), following existing patterns.
   - If the project's circom code needs **patches** for circom 2.x compatibility (e.g., `signal private input` → `signal input`, missing pragmas, missing semicolons), create a patch file in `scripts/patches/` or add inline fixes in the "codebase-specific fixes" section.

---

## Phase 2: Bug Processing (Sub-Agents)

For each extracted bug, launch a **sub-agent** to process it independently. All sub-agents can run in parallel.

Each sub-agent does the following:

### 2.1 Scaffold the bug directory

**If DSL is Circom**, run the scaffolding script:

```bash
./scripts/zkbugs_new_bug.sh circom <ORG>/<REPO> <auditor>_<snake_case_title> \
    --url <PROJECT_URL> --commit <COMMIT>
```

**For all other DSLs**, create the directory and config manually:

```bash
BUG_DIR="dataset/<DSL_LOWER>/<ORG>/<REPO>/<auditor>_<snake_case_title>"
mkdir -p "$BUG_DIR"
```

Where `<snake_case_title>` is the bug title converted to lowercase snake_case, with special characters removed.

### 2.2 Write zkbugs_config.json

**For Circom bugs**, replace the generated config with a fully populated one using this structure:

```json
{
    "<Bug Title>": {
        "Id": "<ORG>/<REPO>/<auditor>_<snake_case_title>",
        "Path": "dataset/circom/<ORG>/<REPO>/<auditor>_<snake_case_title>",
        "Project": "<PROJECT_URL>",
        "Commit": "<COMMIT>",
        "Fix Commit": "<FIX_COMMIT or empty string>",
        "DSL": "Circom",
        "Vulnerability": "<from taxonomy>",
        "Impact": "<from taxonomy>",
        "Root Cause": "<from taxonomy>",
        "Reproduced": false,
        "Codebase": "dataset/codebases/circom/<ORG>/<REPO>/<COMMIT>",
        "Original Entrypoint": [],
        "Direct Entrypoint": "circuit.circom",
        "Location": {
            "Path": "<file path relative to project root>",
            "Function": "<template or function name>",
            "Line": "<line number or range, e.g. 39-45>"
        },
        "Source": {
            "Audit Report": {
                "Source Link": "https://github.com/zksecurity/zkbugs/blob/main/<REPORT_PATH>",
                "Bug ID": "<finding ID from report>"
            }
        },
        "Input": {
            "Original": "input.json",
            "Direct": "direct_input.json"
        },
        "Commands": {
            "Setup Environment": "./zkbugs_setup.sh",
            "Compile": "./zkbugs_compile.sh",
            "Compile and Preprocess": "./zkbugs_compile_setup.sh",
            "Positive Test": "./zkbugs_positive_test.sh",
            "Clean": "./zkbugs_clean.sh"
        },
        "Short Description of the Vulnerability": "<detailed description with code>",
        "Proposed Mitigation": "<fix recommendation>",
        "Compiled Direct": false,
        "Compiled Original": false,
        "Executed": false
    }
}
```

**For all other DSLs**, create a config with this simpler structure:

```json
{
    "<Bug Title>": {
        "Id": "<ORG>/<REPO>/<auditor>_<snake_case_title>",
        "Path": "dataset/<DSL_LOWER>/<ORG>/<REPO>/<auditor>_<snake_case_title>",
        "Project": "<PROJECT_URL>",
        "Commit": "<COMMIT>",
        "Fix Commit": "<FIX_COMMIT or empty string>",
        "DSL": "<DSL_DISPLAY>",
        "Vulnerability": "<from taxonomy>",
        "Impact": "<from taxonomy>",
        "Root Cause": "<from taxonomy>",
        "Reproduced": false,
        "Location": {
            "Path": "<file path relative to project root>",
            "Function": "<function or module name>",
            "Line": "<line number or range>"
        },
        "Source": {
            "Audit Report": {
                "Source Link": "https://github.com/zksecurity/zkbugs/blob/main/<REPORT_PATH>",
                "Bug ID": "<finding ID from report>"
            }
        },
        "Commands": {
            "Setup Environment": "",
            "Compile and Preprocess": "",
            "Positive Test": "",
            "Clean": ""
        },
        "Short Description of the Vulnerability": "<detailed description with code>",
        "Proposed Mitigation": "<fix recommendation>"
    }
}
```

### 2.3 Write the vulnerability description

The `Short Description of the Vulnerability` field must include **inline code fragments** from the report.

**For Circom**, include:
- Backtick-wrapped signal names: `` `out[i]` ``, `` `lamda` ``
- Constraint operators: `` `<==` ``, `` `<--` ``, `` `===` ``
- Template names with parameters: `` `Num2Bits(254)` ``, `` `LessThan(8)` ``

**For Halo2**, include:
- Gate and column names: `` `q_enable` ``, `` `advice[0]` ``
- Constraint expressions and region names
- Gadget/chip names: `` `MulAddChip` ``, `` `RlpU64Gadget` ``

**For Cairo**, include:
- Function names: `` `validate_risk_factor_function` ``
- Assert statements and felt operations
- Hint/builtin references

**For Rust-based DSLs** (Arkworks, Bellperson, Plonky3, Risc0), include:
- Function signatures, constraint method calls
- Variable and type names from the circuit code

**For all DSLs**, prefer specific over vague:

Bad: "The circuit has a missing range check."
Good: "In `BigMod`, the remainder `mod[i]` is not range-checked to be less than `2**n`. While `div[i]` has proper `Num2Bits(n)` constraints, `mod[i]` uses only `<--` assignment without a corresponding `<==` constraint, allowing a malicious prover to set `mod[i]` to any value."

### 2.4 Leave TODOs

**For Circom bugs**, the following files need manual completion:
- `circuit.circom`: Update the include path and component main instantiation
- `direct_input.json`: Fill with valid witness inputs
- `zkbugs_vars.sh`: Set `CIRCOM_CIRCUIT_ORIGINAL` (replace `TODO_ENTRYPOINT`) and `PTAU_TARGET` for original mode (replace `TODO_PTAU`)

**For other DSLs**, no additional files are needed beyond `zkbugs_config.json`.

---

## Phase 3: Cross-References & Summary (Main Agent)

### 3.1 Find similar bugs

Read all existing `zkbugs_config.json` files at `dataset/<DSL_LOWER>/*/*/*/zkbugs_config.json` and `dataset/<DSL_LOWER>/*/*/*/*/zkbugs_config.json` (skip `dependencies/` and `codebases/`).

Compare each new bug against existing ones **within the same DSL**. Bugs are "similar" if they share the same **fundamental vulnerability mechanism** — not just the same category label. Examples:
- Same missing constraint pattern (e.g., `Num2Bits(254)` aliasing)
- Same template/gadget misuse across projects
- Same assigned-but-unconstrained pattern

For each new bug:
1. Set its `Similar Bugs` field to a sorted list of matching bug paths (relative to `dataset/<DSL_LOWER>/`)
2. Update existing bugs' `Similar Bugs` to include the new bug (bidirectional)

Save all modified configs.

### 3.2 Regenerate READMEs

```bash
python3 scripts/generate_readmes.py <DSL_DISPLAY>
```

### 3.3 Produce summary JSON

Write a JSON summary to stdout (and also save to `prompts/last_run_summary.json`):

```json
{
    "report": "<report file path>",
    "project": "<ORG>/<REPO>",
    "commit": "<COMMIT>",
    "auditor": "<auditor name>",
    "dsl": "<DSL_DISPLAY>",
    "branch": "add-bugs/<auditor>-<repo>",
    "total_findings_in_report": 0,
    "bugs_extracted": 0,
    "bugs_skipped_low_severity": 0,
    "bugs_skipped_non_circuit": 0,
    "new_categories_proposed": [],
    "bugs": [
        {
            "title": "...",
            "bug_id": "...",
            "severity": "...",
            "path": "dataset/<DSL_LOWER>/...",
            "vulnerability": "...",
            "root_cause": "...",
            "impact": "...",
            "location": "file::FunctionName:L42-50",
            "similar_bugs_count": 0,
            "todos": ["..."]
        }
    ]
}
```

### 3.4 Print summary

Print a markdown table:

```
| # | Title | DSL | Severity | Vulnerability | Root Cause | Location | Similar |
|---|-------|-----|----------|---------------|------------|----------|---------|
```

### 3.5 Print new category proposals

If any bugs required new taxonomy categories, print them:

```
## New Category Proposals

| Category Type | Proposed Value | Used By | Justification |
|---------------|---------------|---------|---------------|
| Root Cause    | ...           | Bug #3  | ...           |
```

If no new categories were needed, print: "No new categories proposed — all bugs fit existing taxonomy."

### 3.6 List remaining TODOs

For each bug, print the manual steps still needed:

**For Circom bugs:**
```
### <Bug Title> (dataset/circom/...)
- [ ] Update `circuit.circom` — include vulnerable template and set component main
- [ ] Fill `direct_input.json` with valid witness inputs
- [ ] Set `CIRCOM_CIRCUIT_ORIGINAL` in `zkbugs_vars.sh`
- [ ] Set `PTAU_TARGET` in `zkbugs_vars.sh` for original mode
- [ ] Run `./scripts/download_sources.sh` to fetch codebase
- [ ] Verify: `ZKBUGS_MODE=direct ./zkbugs_compile.sh`
- [ ] Verify: `./zkbugs_compile.sh` (original mode)
```

**For other DSLs:**
```
### <Bug Title> (dataset/<dsl>/...)
- [ ] Review `zkbugs_config.json` fields for accuracy
```

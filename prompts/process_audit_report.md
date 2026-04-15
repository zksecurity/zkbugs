# Process Audit Report — Circom Bug Extraction

You are processing an audit report to extract circom circuit vulnerabilities and add them to the zkbugs dataset. Follow these three phases exactly.

## Input

The user will provide:
- Path to an audit report PDF
- (Optional) GitHub project URL, vulnerable commit, fix commit, auditor name

If any of these are missing, ask the user before proceeding.

---

## Phase 1: Report Parsing & Setup (Main Agent)

### 1.1 Read the audit report

Read the PDF. Identify the project name, auditor, and all findings.

### 1.2 Extract project metadata

Determine or ask the user for:
- **GitHub project URL** (e.g., `https://github.com/org/repo`)
- **Vulnerable commit hash** (full 40-char SHA)
- **Fix commit hash** (if available, else empty string)
- **Auditor name** (lowercase, for directory naming — e.g., `zksecurity`, `veridise`, `trailofbits`)
- **Report file path** relative to repo root (e.g., `reports/documents/auditor-project.pdf`)

Derive from these:
- `ORG` and `REPO` from the URL
- `CODEBASE_REL = dataset/codebases/circom/<ORG>/<REPO>/<COMMIT>`

### 1.3 Identify circuit vulnerabilities

Extract all findings that are **circuit-level vulnerabilities in Circom code** at **Medium severity or above**.

**Skip** these:
- Low and Informational severity findings
- Smart-contract-only bugs (Solidity, no circuit impact)
- Gas optimizations, documentation issues, best practices
- Findings that are not about circuit constraints, signals, or templates

For each qualifying bug, extract:
- **Title**: The finding title from the report
- **Bug ID**: The finding identifier (e.g., "#3", "V-SEM-VUL-001")
- **Severity**: Critical, High, or Medium
- **Location**: File path, template/function name, line numbers
- **Description**: What the vulnerability is, with specific code references
- **Fix/Mitigation**: The recommended fix from the report
- **Fix commit**: If a specific fix commit is mentioned

### 1.4 Classify each bug

Use the existing taxonomy. If no category fits, propose a new one.

**Vulnerability types** (pick one):
- `Under-Constrained`
- `Computational Issues`

**Root Causes** (pick one):
- `Wrong Translation of Logic into Constraints`
- `Unsafe Reuse of Circuit`
- `Missing Input Constraints`
- `Arithmetic Field Issues`
- `Assigned but Unconstrained`
- `Circuit Design Issue`
- `Misimplementation of a Specification`

**Impacts** (pick one):
- `Soundness`
- `Completeness`
- `Soundness and Completeness`

If a bug does not fit any existing category, propose a new one. Track all proposals — you will print them in Phase 3.

### 1.5 Create a working branch

```bash
git checkout -b add-bugs/<auditor>-<repo>
```

### 1.6 Update download_sources.sh

The new codebase needs to be downloadable. Add the project to `scripts/download_sources.sh`:

1. The `ENTRIES` Python block (lines 40-61) reads from `zkbugs_config.json` files automatically — no change needed there since the new configs will be picked up.
2. If the project needs **circomlib symlinks** or **npm dependencies**, add the appropriate setup in the dependency section of `download_sources.sh` (after line 155), following the existing patterns.
3. If the project's circom code needs **patches** for circom 2.x compatibility (e.g., `signal private input` → `signal input`, missing pragmas, missing semicolons), create a patch file in `scripts/patches/` or add inline fixes in the "codebase-specific fixes" section.

---

## Phase 2: Bug Processing (Sub-Agents)

For each extracted bug, launch a **sub-agent** to process it independently. All sub-agents can run in parallel.

Each sub-agent does the following:

### 2.1 Scaffold the bug directory

Run the scaffolding script:

```bash
./scripts/zkbugs_new_bug.sh circom <ORG>/<REPO> <auditor>_<snake_case_title> \
    --url <PROJECT_URL> --commit <COMMIT>
```

Where `<snake_case_title>` is the bug title converted to lowercase snake_case, with special characters removed.

### 2.2 Overwrite zkbugs_config.json

Replace the generated config with a fully populated one. The JSON must have this exact structure:

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

### 2.3 Write the vulnerability description

The `Short Description of the Vulnerability` field must include **inline code fragments** from the report. Include:
- Backtick-wrapped signal names: `` `out[i]` ``, `` `lamda` ``
- Constraint operators: `` `<==` ``, `` `<--` ``, `` `===` ``
- Template names with parameters: `` `Num2Bits(254)` ``, `` `LessThan(8)` ``
- Specific vulnerable code lines when available

Bad: "The circuit has a missing range check."
Good: "In `BigMod`, the remainder `mod[i]` is not range-checked to be less than `2**n`. While `div[i]` has proper `Num2Bits(n)` constraints, `mod[i]` uses only `<--` assignment without a corresponding `<==` constraint, allowing a malicious prover to set `mod[i]` to any value."

### 2.4 Leave TODOs

The following files need manual completion after this automated process:
- `circuit.circom`: Update the include path and component main instantiation
- `direct_input.json`: Fill with valid witness inputs
- `zkbugs_vars.sh`: Set `CIRCOM_CIRCUIT_ORIGINAL` (replace `TODO_ENTRYPOINT`) and `PTAU_TARGET` for original mode (replace `TODO_PTAU`)

---

## Phase 3: Cross-References & Summary (Main Agent)

### 3.1 Find similar bugs

Read all existing circom `zkbugs_config.json` files at `dataset/circom/*/*/*/zkbugs_config.json` (skip `dependencies/` and `codebases/`).

Compare each new bug against existing ones. Bugs are "similar" if they share the same **fundamental vulnerability mechanism** — not just the same category label. Examples:
- Same missing constraint pattern (e.g., `Num2Bits(254)` aliasing)
- Same template misuse across projects
- Same `<--` without `<==` pattern

For each new bug:
1. Set its `Similar Bugs` field to a sorted list of matching bug paths (relative to `dataset/circom/`)
2. Update existing bugs' `Similar Bugs` to include the new bug (bidirectional)

Save all modified configs.

### 3.2 Regenerate READMEs

```bash
python3 scripts/generate_readmes.py Circom
```

### 3.3 Produce summary JSON

Write a JSON summary to stdout (and also save to `prompts/last_run_summary.json`):

```json
{
    "report": "<report file path>",
    "project": "<ORG>/<REPO>",
    "commit": "<COMMIT>",
    "auditor": "<auditor name>",
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
            "path": "dataset/circom/...",
            "vulnerability": "...",
            "root_cause": "...",
            "impact": "...",
            "location": "file.circom::TemplateName:L42-50",
            "similar_bugs_count": 0,
            "todos": ["circuit.circom", "direct_input.json", "zkbugs_vars.sh"]
        }
    ]
}
```

### 3.4 Print summary

Print a markdown table:

```
| # | Title | Severity | Vulnerability | Root Cause | Location | Similar |
|---|-------|----------|---------------|------------|----------|---------|
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

```
## Remaining TODOs

### <Bug Title> (dataset/circom/...)
- [ ] Update `circuit.circom` — include vulnerable template and set component main
- [ ] Fill `direct_input.json` with valid witness inputs
- [ ] Set `CIRCOM_CIRCUIT_ORIGINAL` in `zkbugs_vars.sh`
- [ ] Set `PTAU_TARGET` in `zkbugs_vars.sh` for original mode
- [ ] Run `./scripts/download_sources.sh` to fetch codebase
- [ ] Verify: `ZKBUGS_MODE=direct ./zkbugs_compile.sh`
- [ ] Verify: `./zkbugs_compile.sh` (original mode)
```

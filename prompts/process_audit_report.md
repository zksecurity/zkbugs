# Process Audit Report — ZK Bug Extraction

You are processing an audit report to extract ZK circuit vulnerabilities and
add them to the zkbugs dataset. The dataset supports multiple DSLs (Circom,
Halo2, Cairo, Arkworks, Bellperson, PIL, Gnark, Plonky3, Risc0).

Phases 2 and 3.1-3.2/3.5-3.6 are shared with `process_github_issue.md`. Follow
this file for Phase 1 and the summary (3.3-3.4); for the rest, follow
[`_bug_processing.md`](./_bug_processing.md).

## Source parameters (used when forwarding to `_bug_processing.md`)

| Parameter | Value |
|-----------|-------|
| `SOURCE_KIND` | `audit_report` |
| `REPORTER_LABEL` | `auditor` (lowercase, e.g. `zksecurity`, `veridise`, `trailofbits`) |
| `SOURCE_TYPE_KEY` | `Audit Report` |
| `SOURCE_LINK` | `https://github.com/zksecurity/zkbugs/blob/main/<REPORT_PATH>` |
| `BUG_ID_FIELD` | the finding's identifier from the report (e.g. `#1 Unsound Left Rotation Gadget`, `V-SEM-VUL-001`) |

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

Use the taxonomy in `_bug_processing.md` (Vulnerability, Root Cause, Impact).
If a bug does not fit any existing category, propose a new one. Track all
proposals — you will print them in Phase 3.5.

### 1.6 Create a working branch

```bash
git checkout -b add-bugs/<auditor>-<repo>
```

### 1.7 Circom-specific setup

**Only if DSL is Circom**, perform these additional steps:

1. Derive `CODEBASE_REL = dataset/codebases/circom/<ORG>/<REPO>/<COMMIT>`
2. Update `scripts/download_sources.sh` to support the new codebase:
   - The `# === BEGIN AUTO-ENTRIES ===` block reads from `zkbugs_config.json` files automatically — no change needed there.
   - If the project needs **circomlib symlinks** or **npm dependencies**, add the appropriate setup inside the `# === BEGIN DEPENDENCY SETUP ===` / `# === END DEPENDENCY SETUP ===` region, following existing patterns.
   - If the project's circom code needs **patches** for circom 2.x compatibility (e.g., `signal private input` → `signal input`, missing pragmas, missing semicolons), create a patch file in `scripts/patches/` or add inline fixes in the "codebase-specific fixes" subsection (inside the dependency-setup region).

---

## Phase 2 and Phase 3.1-3.2: see `_bug_processing.md`

Follow [`_bug_processing.md`](./_bug_processing.md) for:
- Phase 2 (scaffolding, config, description, completion, verification)
- Phase 3.1 (similar bugs)
- Phase 3.2 (regenerate READMEs)

Use the source parameters from the top of this file.

---

## Phase 3.3: Produce summary JSON

Write a JSON summary to stdout (and also save to
`prompts/last_run_summary.json`):

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
            "verification": {
                "compile": "pass|fail|skip",
                "setup": "pass|fail|skip",
                "test": "pass|fail|skip",
                "error": null
            },
            "todos": ["..."]
        }
    ]
}
```

## Phase 3.4: Print summary table

Print a markdown table:

```
| # | Title | DSL | Severity | Vulnerability | Root Cause | Location | Similar | Compile | Setup | Test |
|---|-------|-----|----------|---------------|------------|----------|---------|---------|-------|------|
```

The last three columns report the verification pipeline results (from
`_bug_processing.md` section 2.5). Use `pass` → `Y`, `fail` → `N`, `skip` →
`-`. Non-Circom bugs show `-` for all three.

---

## Phase 3.5-3.6: see `_bug_processing.md`

Follow `_bug_processing.md` for the new-category proposals and blockers
sections.

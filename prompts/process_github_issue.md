# Process GitHub Issue/PR — ZK Bug Extraction

You are processing a GitHub issue or pull request that describes ZK circuit
vulnerabilities, and adding them to the zkbugs dataset. The dataset supports
multiple DSLs (Circom, Halo2, Cairo, Arkworks, Bellperson, PIL, Gnark, Plonky3,
Risc0).

Phases 2 and 3.1-3.2/3.5-3.6 are shared with `process_audit_report.md`. Follow
this file for Phase 1 and the summary (3.3-3.4); for the rest, follow
[`_bug_processing.md`](./_bug_processing.md).

## Source parameters (used when forwarding to `_bug_processing.md`)

| Parameter | Value |
|-----------|-------|
| `SOURCE_KIND` | `github_issue` |
| `REPORTER_LABEL` | `reporter` (lowercase, e.g. `daira_hopwood`, `kobi_gurkan`, or the issue author's GitHub username) |
| `SOURCE_TYPE_KEY` | one of `Bug Report`, `Disclosure`, `GitHub Issue` — pick based on how the source describes itself |
| `SOURCE_LINK` | the issue or PR URL |
| `BUG_ID_FIELD` | `#<issue-or-PR-number>: <bug title>` (e.g. `#123: Missing range check in BigMod`); for multi-bug issues use `#123-1: ...`, `#123-2: ...`, … |

## Input

The user will provide:
- A GitHub issue or pull request URL (e.g., `https://github.com/org/repo/issues/123` or `https://github.com/org/repo/pull/456`)
- (Optional) Vulnerable commit, fix commit, reporter name

If any required metadata is missing, extract it from the issue/PR or ask the user.

---

## Phase 1: Issue/PR Parsing & Setup (Main Agent)

### 1.1 Read the issue or pull request

Use the `gh` CLI to fetch the issue/PR content:

```bash
# For issues
gh issue view <NUMBER> --repo <ORG>/<REPO> --json title,body,author,labels,createdAt,comments

# For pull requests
gh pr view <NUMBER> --repo <ORG>/<REPO> --json title,body,author,labels,createdAt,comments,commits
```

Also fetch any linked issues or PRs referenced in the body. If the issue links
to a separate disclosure, advisory, or write-up URL, fetch that content too.

### 1.2 Detect the DSL

Determine the DSL from the issue content, the repository, and the code
referenced. Look for:
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

If the DSL is ambiguous, ask the user.

### 1.3 Extract project metadata

Determine or ask the user for:
- **GitHub project URL** (e.g., `https://github.com/org/repo`) — derive from the issue/PR URL
- **Vulnerable commit hash** (full 40-char SHA) — look for: the commit referenced in the issue, the parent of a fix PR, or the latest commit before the issue was opened. Ask the user if unclear.
- **Fix commit hash** — if this is a fix PR, use the merge commit or the PR's head commit. If the issue references a fix PR, extract it. Otherwise empty string.
- **Reporter name** (lowercase, for directory naming — e.g., `daira_hopwood`, `kobi_gurkan`, the issue author's GitHub username)
- **Source type** — determine whether this is a `Bug Report`, `Disclosure`, or `GitHub Issue`

Derive from these:
- `ORG` and `REPO` from the URL

### 1.4 Identify circuit vulnerabilities

Extract all circuit-level vulnerabilities from the issue/PR body and comments.

A single issue may describe **one or multiple** bugs. Look for:
- Separate vulnerability descriptions or numbered findings
- Different affected templates, gadgets, or functions
- Distinct root causes even if in the same file

**Skip** these:
- Feature requests, documentation issues, build/CI problems
- Smart-contract-only bugs (Solidity, no circuit impact)
- Performance issues that don't affect soundness or completeness
- Bugs that are not about circuit constraints, signals, or proof systems

For each qualifying bug, extract:
- **Title**: A concise title describing the vulnerability (derive from the issue title or create one if the issue covers multiple bugs)
- **Bug ID**: The issue/PR number (e.g., `#123`) or a derived identifier for multi-bug issues (e.g., `#123-1`, `#123-2`)
- **Location**: File path, function/template name, line numbers — look for code blocks, file references, and stack traces in the issue body
- **Description**: What the vulnerability is, with specific code references from the issue
- **Fix/Mitigation**: The recommended fix — check the issue body, comments, and any linked fix PR
- **Fix commit**: From the linked fix PR or referenced commit

### 1.5 Classify each bug

Use the taxonomy in `_bug_processing.md` (Vulnerability, Root Cause, Impact).
If a bug does not fit any existing category, propose a new one. Track all
proposals — you will print them in Phase 3.5.

### 1.6 Create a working branch

```bash
git checkout -b add-bugs/<reporter>-<repo>
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
- Phase 2 (scaffolding, config, description, completion, full verification pipeline)
- Phase 3.1 (similar bugs)
- Phase 3.2 (regenerate READMEs)

Use the source parameters from the top of this file.

---

## Phase 3.3: Produce summary JSON

Write a JSON summary to stdout (and also save to
`prompts/last_run_summary.json`):

```json
{
    "source_url": "<issue or PR URL>",
    "source_type": "<Bug Report | Disclosure | GitHub Issue>",
    "project": "<ORG>/<REPO>",
    "commit": "<COMMIT>",
    "reporter": "<reporter name>",
    "dsl": "<DSL_DISPLAY>",
    "branch": "add-bugs/<reporter>-<repo>",
    "total_bugs_in_source": 0,
    "bugs_extracted": 0,
    "bugs_skipped_non_circuit": 0,
    "new_categories_proposed": [],
    "bugs": [
        {
            "title": "...",
            "bug_id": "...",
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
| # | Title | DSL | Vulnerability | Root Cause | Location | Similar | Compile | Setup | Test |
|---|-------|-----|---------------|------------|----------|---------|---------|-------|------|
```

The last three columns report the verification pipeline results (from
`_bug_processing.md` section 2.5). Use `pass` → `Y`, `fail` → `N`, `skip` →
`-`. Non-Circom bugs show `-` for all three.

---

## Phase 3.5-3.6: see `_bug_processing.md`

Follow `_bug_processing.md` for the new-category proposals and blockers
sections.

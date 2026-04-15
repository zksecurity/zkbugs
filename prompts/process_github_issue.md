# Process GitHub Issue/PR — ZK Bug Extraction

You are processing a GitHub issue or pull request that describes ZK circuit vulnerabilities, and adding them to the zkbugs dataset. The dataset supports multiple DSLs (Circom, Halo2, Cairo, Arkworks, Bellperson, PIL, Gnark, Plonky3, Risc0). Follow these three phases exactly.

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

Also fetch any linked issues or PRs referenced in the body. If the issue links to a separate disclosure, advisory, or write-up URL, fetch that content too.

### 1.2 Detect the DSL

Determine the DSL from the issue content, the repository, and the code referenced. Look for:
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
git checkout -b add-bugs/<reporter>-<repo>
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
./scripts/zkbugs_new_bug.sh circom <ORG>/<REPO> <reporter>_<snake_case_title> \
    --url <PROJECT_URL> --commit <COMMIT>
```

**For all other DSLs**, create the directory and config manually:

```bash
BUG_DIR="dataset/<DSL_LOWER>/<ORG>/<REPO>/<reporter>_<snake_case_title>"
mkdir -p "$BUG_DIR"
```

Where `<snake_case_title>` is the bug title converted to lowercase snake_case, with special characters removed.

### 2.2 Write zkbugs_config.json

**For Circom bugs**, replace the generated config with a fully populated one using this structure:

```json
{
    "<Bug Title>": {
        "Id": "<ORG>/<REPO>/<reporter>_<snake_case_title>",
        "Path": "dataset/circom/<ORG>/<REPO>/<reporter>_<snake_case_title>",
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
            "<source_type>": {
                "Source Link": "<issue or PR URL>",
                "Bug ID": "<issue/PR number>"
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
        "Id": "<ORG>/<REPO>/<reporter>_<snake_case_title>",
        "Path": "dataset/<DSL_LOWER>/<ORG>/<REPO>/<reporter>_<snake_case_title>",
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
            "<source_type>": {
                "Source Link": "<issue or PR URL>",
                "Bug ID": "<issue/PR number>"
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

Where `<source_type>` is one of: `Bug Report`, `Disclosure`, or `GitHub Issue`.

### 2.3 Write the vulnerability description

The `Short Description of the Vulnerability` field must include **inline code fragments** from the issue.

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

If the issue includes code blocks showing the vulnerable code, incorporate the key lines into the description.

### 2.4 Complete all files (Circom)

**For Circom bugs**, do NOT leave TODOs — complete everything unless you hit a genuine blocker:

1. **`circuit.circom`**: Download the codebase (`./scripts/download_sources.sh`), find the vulnerable template, write the correct `include` path and `component main` instantiation with minimal parameters.
2. **`direct_input.json`**: Read the template's signal inputs and provide valid values. Use simple/minimal values (0, 1, small integers) that satisfy the circuit's constraints.
3. **`zkbugs_vars.sh`**: Find the project's actual entrypoint circom file and set `CIRCOM_CIRCUIT_ORIGINAL`. Determine the circuit size and set the appropriate `PTAU_TARGET`.
4. **Verify**: Run `ZKBUGS_MODE=direct ./zkbugs_compile.sh` and fix any compilation errors.

Only leave a TODO if you tried and hit a genuine blocker. Explain the blocker in a comment.

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
            "todos": ["..."]
        }
    ]
}
```

### 3.4 Print summary

Print a markdown table:

```
| # | Title | DSL | Vulnerability | Root Cause | Location | Similar |
|---|-------|-----|---------------|------------|----------|---------|
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

### 3.6 List remaining blockers

If any bugs have unresolved issues that prevented full completion, list them:

```
## Blockers

### <Bug Title> (dataset/...)
- <what was attempted and why it failed>
```

If all bugs were fully completed with no blockers, print: "All bugs fully processed — no blockers."

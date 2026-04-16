# Shared Bug Processing Workflow

This file holds the content shared between `process_audit_report.md` and
`process_github_issue.md`. The source-specific prompts handle parsing (Phase 1)
and the summary JSON/table (Phase 3.3-3.4); everything else lives here.

Each source prompt sets these parameters before forwarding to this file:

| Parameter | Values |
|-----------|--------|
| `SOURCE_KIND` | `audit_report` \| `github_issue` |
| `REPORTER_LABEL` | `auditor` (audit) \| `reporter` (issue/PR) |
| `SOURCE_TYPE_KEY` | `Audit Report` (audit) \| `Bug Report` / `Disclosure` / `GitHub Issue` (issue/PR) |
| `SOURCE_LINK` | the URL to record in the config's `Source.<SOURCE_TYPE_KEY>.Source Link` |
| `BUG_ID_FIELD` | e.g. `#1 Unsound Left Rotation Gadget` (audit) \| `#123` (issue) |

---

## Taxonomy (used by Phase 1.5 of each source prompt)

Pick exactly one value from each list. If a bug does not fit any existing
category, propose a new one and track all proposals — the source prompt's
Phase 3.5 will print them.

**Vulnerability types:**
- `Under-Constrained`
- `Over-Constrained`
- `Computational Issues`

**Root Causes:**
- `Wrong Translation of Logic into Constraints`
- `Unsafe Reuse of Circuit`
- `Missing Input Constraints`
- `Arithmetic Field Issues`
- `Assigned but Unconstrained`
- `Circuit Design Issue`
- `Misimplementation of a Specification`
- `Other Programming Errors`

**Impacts:**
- `Soundness`
- `Completeness`
- `Soundness and Completeness`

---

## Phase 2: Bug Processing (Sub-Agents)

For each extracted bug, launch a **sub-agent** to process it independently. All
sub-agents can run in parallel.

### 2.1 Scaffold the bug directory

**If DSL is Circom**, run the scaffolding script:

```bash
./scripts/zkbugs_new_bug.sh circom <ORG>/<REPO> <REPORTER_LABEL>_<snake_case_title> \
    --url <PROJECT_URL> --commit <COMMIT>
```

**For all other DSLs**, create the directory and config manually:

```bash
BUG_DIR="dataset/<DSL_LOWER>/<ORG>/<REPO>/<REPORTER_LABEL>_<snake_case_title>"
mkdir -p "$BUG_DIR"
```

Where `<snake_case_title>` is the bug title converted to lowercase snake_case,
with special characters removed.

### 2.2 Write zkbugs_config.json

**For Circom bugs**, replace the generated config with a fully populated one.
Preserve the key order below (matches existing configs; `Original Entrypoint`
sits at the end alongside the status flags):

```json
{
    "<Bug Title>": {
        "Id": "<ORG>/<REPO>/<REPORTER_LABEL>_<snake_case_title>",
        "Path": "dataset/circom/<ORG>/<REPO>/<REPORTER_LABEL>_<snake_case_title>",
        "Project": "<PROJECT_URL>",
        "Commit": "<COMMIT>",
        "Fix Commit": "<FIX_COMMIT or empty string>",
        "DSL": "Circom",
        "Vulnerability": "<from taxonomy>",
        "Impact": "<from taxonomy>",
        "Root Cause": "<from taxonomy>",
        "Reproduced": false,
        "Codebase": "dataset/codebases/circom/<ORG>/<REPO>/<COMMIT>",
        "Direct Entrypoint": "circuit.circom",
        "Location": {
            "Path": "<file path relative to project root>",
            "Function": "<template or function name>",
            "Line": "<line number or range, e.g. 39-45>"
        },
        "Source": {
            "<SOURCE_TYPE_KEY>": {
                "Source Link": "<SOURCE_LINK>",
                "Bug ID": "<BUG_ID_FIELD>"
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
        "Executed": false,
        "Compiled Direct": false,
        "Compiled Original": false,
        "Original Entrypoint": []
    }
}
```

**For all other DSLs**, use the simpler structure (no compile/run plumbing):

```json
{
    "<Bug Title>": {
        "Id": "<ORG>/<REPO>/<REPORTER_LABEL>_<snake_case_title>",
        "Path": "dataset/<DSL_LOWER>/<ORG>/<REPO>/<REPORTER_LABEL>_<snake_case_title>",
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
            "<SOURCE_TYPE_KEY>": {
                "Source Link": "<SOURCE_LINK>",
                "Bug ID": "<BUG_ID_FIELD>"
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

The `Short Description of the Vulnerability` field must include **inline code
fragments** from the source.

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

If the source includes code blocks showing the vulnerable code, incorporate
the key lines into the description.

### 2.4 Complete all files (Circom)

**For Circom bugs**, do NOT leave TODOs — complete everything unless you hit a
genuine blocker:

1. **`circuit.circom`**: Download the codebase (`./scripts/download_sources.sh`), find the vulnerable template, write the correct `include` path and `component main` instantiation with minimal parameters.
2. **`direct_input.json`**: Read the template's signal inputs and provide valid values. Use simple/minimal values (0, 1, small integers) that satisfy the circuit's constraints.
3. **`zkbugs_vars.sh`**: Find the project's actual entrypoint circom file and set `CIRCOM_CIRCUIT_ORIGINAL`. Determine the circuit size and set the appropriate `PTAU_TARGET`.
4. **Verify**: Run the verification pipeline in section 2.5 below.

Only leave a TODO if you tried and hit a genuine blocker. Explain the blocker
in a comment.

**For other DSLs**, no additional files are needed beyond `zkbugs_config.json`.

### 2.5 Verify each bug (Circom)

Run the full verification pipeline from the bug directory — compile, trusted
setup, positive test, cleanup. Each step depends on the previous one — stop at
the first failure and record the result.

#### Step 1: Compile

```bash
cd <BUG_DIR>
ZKBUGS_MODE=direct ./zkbugs_compile.sh
```

If compilation fails, diagnose and fix the error (wrong include path, missing
`-l` flag, wrong template parameters, etc.), then retry. Record the result.

#### Step 2: Compile and preprocess (zkey ceremony)

```bash
ZKBUGS_MODE=direct ./zkbugs_compile_setup.sh
```

This runs compilation followed by the trusted setup ceremony (powers of tau,
zkey generation, verification key export). It succeeds when the output
contains `EXPORT VERIFICATION KEY FINISHED`.

If this fails due to "circuit too big for ptau", increase the `PTAU_TARGET` in
`zkbugs_vars.sh` (e.g., `bn128_pot12_0001.ptau` → `bn128_pot14_0001.ptau` →
`bn128_pot16_0001.ptau`). Re-run after fixing.

#### Step 3: Positive test (witness + proof + verify)

```bash
ZKBUGS_MODE=direct ./zkbugs_positive_test.sh
```

This generates a witness from `direct_input.json`, creates a proof, and
verifies it. It succeeds when the output contains `OK!`.

If witness generation fails, the `direct_input.json` values are likely invalid
for the circuit's constraints. Fix the input values and retry.

#### Step 4: Clean up

```bash
./zkbugs_clean.sh
```

Always clean up artifacts after verification.

#### Recording results

After running the pipeline, update `zkbugs_config.json` for the bug:

- Set `"Compiled Direct": true` if Step 1 succeeded
- Set `"Executed": true` if Step 3 succeeded (implies Steps 1-2 also succeeded)

Track the per-bug verification results for the source prompt's summary JSON.
For each bug, record:
- `compile`: `"pass"`, `"fail"`, or `"skip"`
- `setup`: `"pass"`, `"fail"`, or `"skip"`
- `test`: `"pass"`, `"fail"`, or `"skip"`
- `error`: error message if any step failed, otherwise `null`

---

## Phase 3: Cross-References (shared)

### 3.1 Find similar bugs

Read all existing `zkbugs_config.json` files at
`dataset/<DSL_LOWER>/*/*/*/zkbugs_config.json` and
`dataset/<DSL_LOWER>/*/*/*/*/zkbugs_config.json` (skip `dependencies/` and
`codebases/`).

Compare each new bug against existing ones **within the same DSL**. Bugs are
"similar" if they share the same **fundamental vulnerability mechanism** — not
just the same category label. Examples:
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

---

## Phase 3.5-3.6: Final Output (shared)

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

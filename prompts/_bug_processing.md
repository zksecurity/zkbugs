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
| `BUG_ID_FIELD` | e.g. `#1 Unsound Left Rotation Gadget` (audit) \| `#123: Bug Title` (issue) |

---

## Taxonomy (used by Phase 1.5 of each source prompt)

Pick exactly one value from each list. If a bug does not fit any existing
category, propose a new one and track all proposals — the source prompt's
Phase 3.5 will print them.

**Vulnerability types:**
- `Under-Constrained`
- `Over-Constrained`
- `Computational Issues`
- `Private Information Leakage`

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
- `ZK/Privacy`

---

## Phase 2: Bug Processing (Sub-Agents)

For each extracted bug, launch a **sub-agent** to process it independently.
Sub-agents may run in parallel, subject to these constraints:

- **Concurrency cap**: launch at most **5** sub-agents concurrently. This bounds
  API rate-limit pressure and keeps failure modes legible.
- **Shared-state ownership**: the main agent owns every path outside the bug's
  own directory. Sub-agents MUST NOT:
  - run `./scripts/download_sources.sh` (the main agent runs it once in Phase
    1.7 — see below)
  - write into `dataset/codebases/`
  - write into `dataset/zkbugs_similar_bugs.json`
  - edit any *other* bug's `zkbugs_config.json` (similar-bug back-references
    are reconciled by the main agent in Phase 3.1)

  Sub-agents may read `dataset/codebases/` freely; their writes are limited to
  their own `dataset/<DSL_LOWER>/<ORG>/<REPO>/<bug_name>/` directory.

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
            "Reproduce": "",
            "Compile and Preprocess": "",
            "Positive Test": "",
            "Find Exploit": "",
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

1. **`circuit.circom`**: The codebase was downloaded and patched by the main agent in Phase 1.7; read it under `dataset/codebases/circom/<ORG>/<REPO>/<COMMIT>/`. Find the vulnerable template, write the correct `include` path and `component main` instantiation with minimal parameters. Sub-agents MUST NOT re-run `./scripts/download_sources.sh` or write into `dataset/codebases/`.
2. **`direct_input.json`**: Read the template's signal inputs and provide valid values. Use simple/minimal values (0, 1, small integers) that satisfy the circuit's constraints.
3. **`zkbugs_vars.sh`**: Find the project's actual entrypoint circom file and set `CIRCOM_CIRCUIT_ORIGINAL`. Determine the circuit size and set the appropriate `PTAU_TARGET`. Adjust `CIRCOM_LINK_FLAGS` if the project needs additional `-l` paths (see below).
4. **Verify**: Run the verification pipeline in section 2.5 below.

Only leave a TODO if you tried and hit a genuine blocker. Explain the blocker
in a comment.

**For other DSLs**, no additional files are needed beyond `zkbugs_config.json`.

#### CIRCOM_LINK_FLAGS contract

Every circom bug's `zkbugs_vars.sh` defines a bash array `CIRCOM_LINK_FLAGS`
holding the exact `-l` arguments passed to `circom`. The compile scripts
expand it uniformly as:

```bash
circom "$CIRCOM_CIRCUIT" --O0 --r1cs --wasm --sym "${CIRCOM_LINK_FLAGS[@]}"
```

This lets external runners (e.g. zkhydra) drive any bug via
`scripts/print_bug_vars.sh <bug_dir> [--mode direct|original]` without parsing
per-bug compile scripts.

The scaffolder produces the default two-flag shape:

```bash
CIRCOM_LINK_FLAGS=(-l "$CODEBASE_PATH" -l "$CIRCOMLIB_PATH")
```

Adjust only if the project's circuits resolve includes through additional
paths. Common shapes in the dataset:

| Shape | Use when |
|-------|----------|
| `(-l "$CODEBASE_PATH" -l "$CIRCOMLIB_PATH")` | default — project imports from codebase root and circomlib |
| `(-l "$CODEBASE_PATH" -l "$CODEBASE_PATH/circuits/node_modules")` | project vendors circomlib under `<codebase>/circuits/node_modules` (no separate `CIRCOMLIB_PATH` needed) |
| `(-l "$CODEBASE_PATH" -l "$CIRCOMLIB_PATH" -l "$CIRCOMLIB_PATH/circomlib/circuits" -l "$CODEBASE_PATH/circuits/node_modules")` | project uses both a shared circomlib dep and its own `node_modules` with additional scoped packages |

Use bash array literal form with quoted paths — do not fall back to a
space-joined string. Include only paths the project actually needs; the
`-l` list is order-sensitive for include resolution.

### 2.5 Verify each bug (Circom)

Run the full verification pipeline from the bug directory — compile, trusted
setup, positive test, cleanup. Each step depends on the previous one — stop at
the first failure and record the result.

#### Step 1a: Compile (direct mode)

```bash
cd <BUG_DIR>
ZKBUGS_MODE=direct ./zkbugs_compile.sh
./zkbugs_clean.sh  # clear artifacts before the next compile
```

If compilation fails, diagnose and fix the error (wrong include path, missing
entry in `CIRCOM_LINK_FLAGS`, wrong template parameters, etc.), then retry.
Record the result as `compile_direct`.

#### Step 1b: Compile (original mode)

```bash
ZKBUGS_MODE=original ./zkbugs_compile.sh
./zkbugs_clean.sh
```

This verifies the project's real entrypoint — `CIRCOM_CIRCUIT_ORIGINAL` in
`zkbugs_vars.sh` — still compiles at the vulnerable commit. Common failures:
wrong entrypoint path, missing include path in `CIRCOM_LINK_FLAGS` (see the
contract section above), or the project's original compile requires an extra
setup step (`npm install`, patches) that must be added to
`scripts/download_sources.sh`'s dependency-setup region by the main agent.

Record the result as `compile_original`. If original mode fails, do **not**
abort the sub-agent — direct-mode success is still useful — but flag the
failure so the main agent can surface it.

#### Step 2: Compile and preprocess (zkey ceremony, direct mode)

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

- Set `"Compiled Direct": true` iff Step 1a succeeded
- Set `"Compiled Original": true` iff Step 1b succeeded (do NOT blanket-default
  to true — the flag is consumed by `scripts/test_all_circom.sh --mode both`)
- Set `"Executed": true` iff Step 3 succeeded (implies Steps 1a and 2 also
  succeeded)

Track the per-bug verification results for the source prompt's summary JSON.
For each bug, record:
- `compile_direct`: `"pass"`, `"fail"`, or `"skip"`
- `compile_original`: `"pass"`, `"fail"`, or `"skip"`
- `setup`: `"pass"`, `"fail"`, or `"skip"`
- `test`: `"pass"`, `"fail"`, or `"skip"`
- `error`: one-line error summary if any step failed, otherwise `null`
- `error_step`: `"compile_direct" | "compile_original" | "setup" | "test" | null`
  — which step produced the reason (single source of truth for the
  Phase 3.4 `Notes` column and the `## Failure Details` section)

---

## Phase 3: Cross-References (shared)

This phase runs in the **main agent, serially**, after all sub-agents have
returned. It mutates shared state (`dataset/zkbugs_similar_bugs.json` and every
cross-referenced config) and must not race with sub-agents or with itself.

### 3.1 Find similar bugs

#### 3.1a — Sub-agent candidate list (already returned)

Each sub-agent in Phase 2 returns a `similar_bug_candidates: [<path>, …]` array
as part of its per-bug JSON result. Candidates are bug paths (relative to
`dataset/<DSL_LOWER>/`) the sub-agent believes match the **fundamental
vulnerability mechanism** of its own bug — not just the same category label.
Examples of a true match:
- Same missing constraint pattern (e.g., `Num2Bits(254)` aliasing)
- Same template/gadget misuse across projects
- Same assigned-but-unconstrained pattern

To build its list, each sub-agent reads existing `zkbugs_config.json` files at
`dataset/<DSL_LOWER>/*/*/*/zkbugs_config.json` (skip `dependencies/` and
`codebases/`), comparing **within the same DSL only**. Sub-agents do NOT edit
any config other than their own.

#### 3.1b — Main-agent reconciliation

After every sub-agent has returned, the main agent:

1. Reads `dataset/zkbugs_similar_bugs.json` — the authoritative manifest grouping
   semantically-similar bugs by DSL.
2. For each new bug, merges its `similar_bug_candidates` into the appropriate
   DSL group (create a new group if no existing group matches).
3. Runs the reconciler, which rewrites every affected `zkbugs_config.json`'s
   `Similar Bugs` field (deduped, self-reference stripped) and regenerates
   the corresponding READMEs in one atomic pass:

   ```bash
   python3 scripts/runner_update_similar_bugs.py
   ```

   This is the single place where cross-bug writes happen. Do not hand-edit
   `Similar Bugs` fields elsewhere.

### 3.2 Regenerate READMEs

`runner_update_similar_bugs.py` regenerates READMEs for every config it
touched. For any newly-ingested bug whose similarity group was untouched (no
matches), regenerate the new bug's README explicitly:

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

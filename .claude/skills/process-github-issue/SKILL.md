---
name: process-github-issue
description: Extract ZK circuit bugs from a GitHub issue or pull request and add them to the zkbugs dataset. Creates branch, scaffolds directories, fills configs, finds similar bugs.
disable-model-invocation: true
argument-hint: <github-issue-or-pr-url>
allowed-tools: Bash Read Write Edit Glob Grep Agent
---

# Process GitHub Issue/PR

Process the GitHub issue or pull request at `$ARGUMENTS` and extract all ZK circuit vulnerabilities into the zkbugs dataset.

Follow the detailed workflow in [process_github_issue.md](../../../prompts/process_github_issue.md).

## Important: Finish the job

Do NOT leave TODOs unless there is a specific, unavoidable reason (e.g., the codebase requires manual inspection that cannot be automated, or valid witness inputs require domain-specific knowledge you don't have).

For Circom bugs, you MUST attempt to:
- **Fill in `circuit.circom`**: Read the codebase (download it first via `./scripts/download_sources.sh` if needed), find the vulnerable template, and write the correct include path and `component main` instantiation.
- **Fill in `direct_input.json`**: Read the template's signal inputs and provide valid values. Use simple/minimal values (0, 1, small integers) that satisfy the circuit's constraints.
- **Set `zkbugs_vars.sh`**: Find the project's actual entrypoint circom file and set `CIRCOM_CIRCUIT_ORIGINAL`. Determine the circuit size and set the appropriate `PTAU_TARGET`.
- **Verify compilation**: Run `ZKBUGS_MODE=direct ./zkbugs_compile.sh` and fix any errors.

Only mark something as a TODO if you tried and hit a genuine blocker. Explain the blocker in a comment.

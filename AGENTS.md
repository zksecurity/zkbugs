# Repository Guidelines

## Project Structure & Module Organization
- `dataset/<dsl>/<org>/<repo>/<bug>/` — Each vulnerability entry with reproduction scripts and `zkbugs_config.json`.
- `dataset/codebases/` — Full project codebases (gitignored, downloaded via `scripts/download_sources.sh`).
- `scripts/` — Infra and helpers (e.g., `download_sources.sh`, `test_all_circom.sh`, `install_circom.sh`).
- `tools/` — DSL-specific utilities (e.g., `tools/circomspect`, `tools/picus`).
- `reports/`, `misc/`, `Picus/` — Reference materials and analysis outputs.

## Build, Test, and Development Commands
- Download codebases: `./scripts/download_sources.sh`
- Download ptau files: `./scripts/download_ptau.sh`
- Compile all circom bugs: `./scripts/test_all_circom.sh --compile-only --mode both`
- Full test (direct mode): `./scripts/test_all_circom.sh --skip-large`
- Print status table: `python3 scripts/print_bug_status.py Circom`
- Per-bug workflow (run inside the bug folder): `./zkbugs_setup.sh` → `./zkbugs_compile.sh` or `./zkbugs_compile_setup.sh` → `./zkbugs_positive_test.sh` → `./zkbugs_clean.sh`.
- Two modes via `ZKBUGS_MODE` env var: `direct` (isolated wrapper) or `original` (full project entrypoint).
- Circom tooling: `scripts/install_circom.sh` installs `circom`, `snarkjs`, and `ffjavascript` when needed.

## Coding Style & Naming Conventions
- Python: PEP 8, 4-space indent; keep scripts in `scripts/` with descriptive names.
- Shell: portable Bash; prefer `set -euo pipefail` where safe; name per-bug scripts `zkbugs_*.sh`; mark executable.
- JSON: four-space indent, stable key order; required file name: `zkbugs_config.json`.
- Bug paths: snake_case, descriptive (e.g., `.../zksecurity_unsound_left_rotation`).

## Testing Guidelines
- Each bug must include `zkbugs_positive_test.sh` (witness + proof + verify).
- Each bug supports two compilation modes: `direct` (isolated wrapper) and `original` (full codebase).
- Set `Compiled Direct`, `Compiled Original`, `Executed`, and `Reproduced` flags in `zkbugs_config.json`.
- Validate locally with `ZKBUGS_MODE=direct ./zkbugs_compile.sh` and `./zkbugs_compile.sh` before opening a PR.

## Commit & Pull Request Guidelines
- Commit messages: `<dsl>/<org>/<repo>: <short change>`
  - Example: `circom/reclaimprotocol/circom-chacha20: add unsound rotation PoC`.
- PRs must include: clear description, reproduction steps, linked sources (audit/report/issue), and updated/added `zkbugs_config.json` + scripts. Ensure scripts are executable.
- After adding/updating bugs, regenerate READMEs: `python3 scripts/generate_readmes.py`.

## Adding New Bugs
- Use `scripts/zkbugs_new_bug.sh <dsl> <org/project> <bug_name> [--url <url>] [--commit <hash>]` to scaffold a new bug entry.
- Fill in `zkbugs_config.json`, `circuit.circom`, `direct_input.json`, and `zkbugs_vars.sh` TODOs.

## Security & Configuration Tips
- Pin upstream repos and commits in `zkbugs_config.json`.
- Avoid secrets in scripts; use deterministic inputs.
- Run exploits in isolated environments when possible.

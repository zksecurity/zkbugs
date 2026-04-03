# Repository Guidelines

## Project Structure & Module Organization
- `dataset/<dsl>/<org/<repo>/<bug>/` — Each vulnerability entry with reproduction scripts and `zkbugs_config.json`.
- `scripts/` — Infra and helpers (e.g., `runner_reproduce_vulns.py`, `install_circom.sh`).
- `template/`, `circom-template/` — Minimal scaffolds for new bug entries (standard `zkbugs_*.sh`).
- `tools/` — DSL‑specific utilities (e.g., `tools/circomspect`, `tools/picus`).
- `reports/`, `misc/`, `Picus/` — Reference materials and analysis outputs.

## Build, Test, and Development Commands
- Reproduce one bug: `python3 scripts/runner_reproduce_vulns.py single <partial-path>`
  - Example: `python3 scripts/runner_reproduce_vulns.py single circom/iden3/circomlib/kobi_gurkan_mimc_hash_assigned_but_not_constrained --verbose`
- Reproduce all for a DSL: `python3 scripts/runner_reproduce_vulns.py dsl circom`
- Reproduce all: `python3 scripts/runner_reproduce_vulns.py all`
- Per‑bug workflow (run inside the bug folder): `./zkbugs_setup.sh` → `./zkbugs_compile_setup.sh` → `./zkbugs_positive_test.sh` → `./zkbugs_exploit.sh` → `./zkbugs_clean.sh`.
- Circom tooling: `scripts/install_circom.sh` installs `circom`, `snarkjs`, and `ffjavascript` when needed.

## Coding Style & Naming Conventions
- Python: PEP 8, 4‑space indent; keep scripts in `scripts/` with descriptive names.
- Shell: portable Bash; prefer `set -euo pipefail` where safe; name per‑bug scripts `zkbugs_*.sh`; mark executable.
- JSON: two‑space indent, stable key order; required file name: `zkbugs_config.json`.
- Bug paths: snake_case, descriptive (e.g., `.../zksecurity_unsound_left_rotation`).

## Testing Guidelines
- Each bug must include `zkbugs_positive_test.sh` and `zkbugs_exploit.sh`.
- Set `Reproduced` in `zkbugs_config.json`; the runner skips non‑reproduced cases.
- If using solvers/Sage, include helper files (e.g., `detect.sage`) and wire via `zkbugs_find_exploit.sh`.
- Validate locally with the single‑bug runner before opening a PR.

## Commit & Pull Request Guidelines
- Commit messages: `<dsl>/<org>/<repo>: <short change>`
  - Example: `circom/reclaimprotocol/circom-chacha20: add unsound rotation PoC`.
- PRs must include: clear description, reproduction steps, linked sources (audit/report/issue), and updated/added `zkbugs_config.json` + scripts. Ensure scripts are executable.
- After adding/updating bugs, regenerate the summary: `python3 scripts/runner_create_bugs_md.py`.

## Security & Configuration Tips
- Pin upstream repos and commits in `zkbugs_get_sources.sh` and `zkbugs_config.json`.
- Avoid secrets in scripts; use deterministic inputs.
- Run exploits in isolated environments when possible.


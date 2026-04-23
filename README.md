# zkbugs

> __NOTE__: This repository is actively under development. Some scripts or reproduced vulnerabilities may contain errors or inconsistencies. If you encounter any issues or inaccuracies, we encourage you to create an issue on GitHub so we can address it promptly.

> Giveth URL: https://giveth.io/project/zkbugs-ai

Reproduce ZKP vulnerabilities.
This repo includes 139 vulnerabilities in the following DSLs:

* Circom (70)
* Halo2 (35)
* Cairo (8)
* Bellperson (7)
* Arkworks (5)
* PIL (2)
* Gnark (1)
* Plonky3 (8)
* Risc0 (3)

# Sources

The bugs have been selected from the following resources:

- the [SoK paper](https://arxiv.org/pdf/2402.15293) [database](https://docs.google.com/spreadsheets/d/1E97ulMufitGSKo_Dy09KYGv-aBcLPXtlN5QUpwyv66A/edit?gid=0#gid=0),
- the [zk-bug-tracker](https://github.com/0xPARC/zk-bug-tracker) repo.

We are focusing on bugs for which the source code is available and there is a complete description of the vulnerability. Ideally, we also want to have access to a PoC explanation, the fix, and some test cases that test either the vulnerable code or similar code in the repo. Beyond those, we always look for new data sources for vulnerabilities. Such examples are:

- Audit reports.
- Various disclosures from independent security researchers, auditing firms, or projects.
- Auditing contests (typically, they have a high probability of including PoCs for critical and high vulnerabilities).

# Structure

For each vulnerability in this dataset, we aim to provide complete end-to-end reproducible scripts to exploit the vulnerability.
As an exploit, we mainly consider producing a proof for a witness that is not supposed to be accepted by the verifier and then demonstrate that the verifier accepts it.
Note that for some bugs we have not created a PoC.

## Directories

The structure we follow is: `dsl/project/repo/source-bug/`. 
For example, `circom/reclaimprotocol/circom_chacha/zksecurity_unsound_left_rotation` contains a vulnerability in the [reclaimprotocol/circom-chacha20 repo](https://github.com/reclaimprotocol/circom-chacha20) which is written in Circom.

## Config

Each bug contains a JSON configuration file, like the following, that provides all the details we want to keep track of.

```
{
  "Unsound Left Rotation": {
    "Id": "reclaimprotocol/circom-chacha20/zksecurity-1",
    "Path": "dataset/circom/reclaimprotocol/circom-chacha20/zksecurity_unsound_left_rotation",
    "Project": "https://github.com/reclaimprotocol/circom-chacha20",
    "Commit": "ef9f5a5ad899d852740a26b30eabe5765673c71f",
    "Fix Commit": "e5e756375fc1fc8dc48667b00cdf38c79a0fdf50",
    "DSL": "Circom",
    "Vulnerability": "Under-Constrained",
    "Impact": "Soundness",
    "Root Cause": "Wrong translation of logic into constraints",
    "Reproduced": false,
    "Codebase": "dataset/codebases/circom/reclaimprotocol/circom-chacha20/ef9f5a5ad899d852740a26b30eabe5765673c71f",
    "Original Entrypoint": ["circuits/chacha20.circom"],
    "Direct Entrypoint": "circuit.circom",
    "Location": {
      "Path": "circuits/generics.circom",
      "Function": "RotateLeft32Bits",
      "Line": "39-45"
    },
    "Source": {
      "Audit Report": {
        "Source Link": "https://www.zksecurity.xyz/blog/2023-reclaim-chacha20.pdf",
        "Bug ID": "#1 Unsound Left Rotation Gadget"
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
    "Short Description of the Vulnerability": "The `part1` and `part2` signals are not sufficiently constrained. One can arbitrarily set a value to `part1` or `part2` and find a value for the other signal to satisfy the constraint on line 45. This way you can get another `out` value for a given `in`.",
    "Proposed Mitigation": "The recommendation to fix this issue was to constrain `part1` (resp. `part2`) to be (resp. ) bit-sized values. For the concrete mitigation applied, check the commit of the fix."
  }
}
```

## Setup (Circom)

Circom bugs use full project codebases that are downloaded on demand. Before running any circom bug, you need to:

```bash
# 1. Install circom and snarkjs
./scripts/install_circom.sh

# 2. Download project codebases, apply patches, and install dependencies
./scripts/download_sources.sh

# 3. Download ptau files (needed for proof generation)
./scripts/download_ptau.sh            # all ptau files (includes large Hermez downloads)
./scripts/download_ptau.sh --small-only  # pot12/14/16 only (fast, sufficient for most bugs)
```

Each circom bug supports two compilation modes via `ZKBUGS_MODE`:

* **`direct`** (default): compiles an isolated wrapper circuit that instantiates only the vulnerable template.
* **`original`**: compiles the project's actual entrypoint from the full codebase.

## Commands

Before reproducing a bug, please install all the relevant dependencies for the DSL in which the code is written. We provide helper scripts in the `scripts` directory (e.g., `scripts/install_circom.sh`).

Then, you can go to the respective directory of the vulnerability and get the command you need to run. The following commands are supported:

* Setup Environment: Ensures all dependencies are installed and circomlib symlinks are in place.
* Compile: Compiles the circuit without performing a zkey ceremony.
* Compile and Preprocess: Compiles the circuit and performs the full zkey ceremony (requires ptau files).
* Positive Test: Generates a witness, produces a proof, and verifies it.
* Clean: Removes all build artifacts.

## Testing (Circom)

```bash
# Compile-only (fast, ~15s):
./scripts/test_all_circom.sh --compile-only

# Compile both modes (~30min for original due to large circuits):
./scripts/test_all_circom.sh --compile-only --mode both

# Full test with proof generation (~15min, needs ptau files):
./scripts/test_all_circom.sh --skip-large

# Print status table:
python3 scripts/print_bug_status.py Circom
```

## Infra scripts

These infrastructure scripts help maintain consistency, automate common tasks, and keep the repository organized as new vulnerabilities are added and existing ones are updated.

- `scripts/download_sources.sh`
  - Downloads project codebases for circom bugs, applies circom 2.x compatibility patches, installs npm dependencies, and generates entrypoints.
  - Usage: Run `./scripts/download_sources.sh` from the root directory. Use `--force` to re-download.

- `scripts/test_all_circom.sh`
  - Tests all circom bugs. Supports `--compile-only`, `--mode direct|original|both`, and `--skip-large`.
  - Usage: `./scripts/test_all_circom.sh --compile-only --mode both`

- `scripts/print_bug_status.py`
  - Prints a status table with Compiled Direct, Compiled Original, Executed, and Reproduced flags.
  - Usage: `python3 scripts/print_bug_status.py Circom`

- `scripts/zkbugs_new_bug.sh`
  - Creates a new bug entry with all required files in the new format.
  - Usage: `./scripts/zkbugs_new_bug.sh <dsl> <org/project> <bug_name> [--url <url>] [--commit <hash>]`

- `scripts/generate_readmes.py`
  - Regenerates README.md files for all bugs from their zkbugs_config.json.
  - Usage: `python3 scripts/generate_readmes.py Circom`

- `scripts/migrate_bug.sh`
  - Migration script used during the refactoring (kept for reference).
  - Usage: `./scripts/migrate_bug.sh <bug_dir> [--clone] [--dry-run]`

- `scripts/runner_create_bugs_md.py`
  - Creates the `BUGS.md` file from all bug configs.
  - Usage: `python3 scripts/runner_create_bugs_md.py`

- `scripts/runner_update_similar_bugs.py`
  - Updates cross-references between similar bugs.
  - Usage: `python3 scripts/runner_update_similar_bugs.py`

## Adding bugs with Claude

Use the built-in Claude Code skills to extract bugs from audit reports or GitHub issues. Each skill follows a three-phase architecture: parse source, scaffold bugs via sub-agents, cross-reference and summarize.

### From audit reports

```
/process-audit-report reports/documents/auditor-project.pdf
```

### From GitHub issues or pull requests

```
/process-github-issue https://github.com/org/repo/issues/123
```

Both skills will create a branch, extract all medium+ severity circuit bugs, scaffold directories, fill in all config fields, download codebases (for Circom), attempt compilation, find similar bugs, and produce a JSON summary. Review the output and fix any blockers listed at the end.

The detailed prompts are also available standalone at `prompts/process_audit_report.md` and `prompts/process_github_issue.md`.

# Contributing

If you want to contribute by any means, please consider first opening an issue to make sure that no one else is already working on it. 
You could start working on open non-assigned issues.
If you want to add more bugs to the dataset, you simply need to follow the current structure, provide a config file with all the details, and implement all the required commands.

# Acknowledgements

Most bugs reproduced in this repository have been gathered from audit reports and disclosures. So far, we have used bugs found and reported by the following individuals and teams:

* [Veridise](https://veridise.com/audits/)
* [0xParc](https://github.com/0xPARC/zk-bug-tracker)
* [Yacademy](https://github.com/RajeshRk18/ZK-Audit-Report)
* Daira Hopwood
* Kobi Gurkan
* [ZKSecurity](https://www.zksecurity.xyz/reports/)

This project has been partially funded by the EF with support from Aztec, Polygon, Scroll, Taiko, and zkSync.

# Cite

If you are using the original dataset of this work, consider citing the following paper:

* Stefanos Chaliasos, Jens Ernstberger, David Theodore, David Wong, Mohammad Jahanara, and Benjamin Livshits. [SoK: What Don't We Know? Understanding Security Vulnerabilities in SNARKs](https://arxiv.org/pdf/2402.15293). In 33rd USENIX Security Symposium, USENIX SECURITY'24, 14-16 August 2024.

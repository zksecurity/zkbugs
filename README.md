# zkbugs

> __NOTE__: This repository is actively under development. Some scripts or reproduced vulnerabilities may contain errors or inconsistencies. If you encounter any issues or inaccuracies, we encourage you to create an issue on GitHub so we can address it promptly.

Reproduce ZKP vulnerabilities.
This repo includes 89 vulnerabilities in the following DSLs:

* Circom (31)
* Halo2 (35)
* Cairo (8)
* Bellperson (7)
* Arkworks (5)
* PIL (2)
* Gnark (1)

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
    "Root Cause": "Wrong translation of logic into constraints"
    "Reproduced": true,
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
    "Commands": {
      "Setup Environment": "./zkbugs_setup.sh",
      "Reproduce": "./zkbugs_exploit.sh",
      "Compile and Preprocess": "./zkbugs_compile_setup.sh",
      "Positive Test": "./zkbugs_positive_test.sh",
      "Find Exploit": "./zkbugs_find_exploit.sh",
      "Clean": "./zkbugs_clean.sh"
    },
    "Short Description of the Vulnerability": "The `part1` and `part2` signals are not sufficiently constrained. One can arbitrarily set a value to `part1` or `part2` and find a value for the other signal to satisfy the constraint on line 45. This way you can get another `out` value for a given `in`.",
    "Short Description of the Exploit": "To exploit the vulnerability, one has to simply find a witness that produces a different value for `out` rather than the one produced by the witness generator. The sage script demonstrates how to find another witness that satisfies the constraints. Then, you simply need to produce a new proof.",
    "Proposed Mitigation": "The recommendation to fix this issue was to constrain `part1` (resp. `part2`) to be (resp. ) bit-sized values. For the concrete mitigation applied, check the commit of the fix."
  }
}
```

## Commands

Before reproducing a bug, please install all the relevant dependencies for the DSL in which the code is written. We provide helper scripts in the `scripts` directory (e.g., `scripts/install_circom.sh`).

Then, you can go to the respective directory of the vulnerability and get the command you need to run to reproduce the bug. Typically, we support the following commands:

* Setup Environment: You should always run this command to ensure that all the dependencies are installed.
* Reproduce: This command will do all the work and will produce and perform an exploit.
* Compile and Preprocess: This step is used in the previous command and simply performs the compilation and preprocessing of the circuit.
* Positive Test: This is a helper command to execute a positive end-to-end test for the circuit.
* Find Exploit (Optional): This is a helper script that typically either uses SageMath or SMT solvers to detect a solution for the witness to pass the constraints without following the intended behavior.
* Clean: A helper command to clean any produced artifacts.

## Infra scripts

These infrastructure scripts help maintain consistency, automate common tasks, and keep the repository organized as new vulnerabilities are added and existing ones are updated.

- `scripts/zkbugs_new_bugs.sh`
  - This script is used to create a new bug entry in the repository.
  - It prompts the user for various details about the bug, such as the project name, vulnerability type, and location.
  - The script then creates the necessary directory structure and files for the new bug, including the config JSON file.
  - Usage: Run `./zkbugs_new_bugs.sh <dsl> <project> <bug_name>` from the root directory of the project.

- `scripts/runner_reproduce_vulns.py`
  - This is the main Python script that orchestrates the bug reproduction process.
  - It reads the config files for all bugs, executes the specified commands, and generates reports.
  - The script can be used to reproduce individual bugs, all bugs under a specific DSL, or run tests on all bugs in the repository.
  - Usage examples:
    - `python3 scripts/runner_reproduce_vulns.py single circom/iden3/circomlib/kobi_gurkan_mimc_hash_assigned_but_not_constrained --verbose`
    - `python3 scripts/runner_reproduce_vulns.py dsl circom`
    - `python3 scripts/runner_reproduce_vulns.py all`

- `scripts/runner_create_bugs_md.py`
  - This script creates the `BUGS.md` file in the root directory.
  - It crawls through all bug directories, reads their config files, and generates a markdown summary of all bugs.
  - The resulting `BUGS.md` file serves as a centralized index of all vulnerabilities in the repository.
  - Usage: Run `python3 scripts/runner_create_bugs_md.py` from the root directory.

- `scripts/runner_update_similar_bugs.py`
  - This script is used to update information about similar bugs across the repository.
  - It analyzes the existing bugs and identifies similarities based on various criteria (e.g., vulnerability type, affected components).
  - The script then updates the config files of related bugs with cross-references to similar vulnerabilities.
  - Usage: Run `python3 scripts/runner_update_similar_bugs.py` from the root directory.

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

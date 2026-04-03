#!/usr/bin/env python3
"""Regenerate README.md files for all bugs from their zkbugs_config.json.

Usage:
    python3 scripts/generate_readmes.py              # all DSLs
    python3 scripts/generate_readmes.py Circom        # only Circom
"""

import json
import glob
import os
import sys


def generate_readme(cfg_path):
    bugdir = os.path.dirname(cfg_path)

    with open(cfg_path) as f:
        data = json.load(f)

    key = list(data.keys())[0]
    bug = data[key]

    lines = []
    lines.append(f"# {key}")
    lines.append("")

    for label, field in [
        ("Id", "Id"), ("Project", "Project"), ("Commit", "Commit"),
        ("Fix Commit", "Fix Commit"), ("DSL", "DSL"),
        ("Vulnerability", "Vulnerability"), ("Impact", "Impact"),
        ("Root Cause", "Root Cause"), ("Reproduced", "Reproduced"),
        ("Codebase", "Codebase"),
    ]:
        val = bug.get(field, "")
        lines.append(f"* {label}: {val}")

    ep = bug.get("Original Entrypoint", [])
    if isinstance(ep, list) and ep:
        lines.append(f"* Original Entrypoint: {', '.join(ep)}")
    elif isinstance(ep, list):
        lines.append("* Original Entrypoint: (same as direct)")
    else:
        lines.append(f"* Original Entrypoint: {ep}")

    lines.append(
        f"* Direct Entrypoint: {bug.get('Direct Entrypoint', '')}"
    )

    loc = bug.get("Location", {})
    lines.append("* Location")
    lines.append(f"  - Path: {loc.get('Path', '')}")
    lines.append(f"  - Function: {loc.get('Function', '')}")
    lines.append(f"  - Line: {loc.get('Line', '')}")

    source = bug.get("Source", {})
    for src_type, src_data in source.items():
        lines.append(f"* Source: {src_type}")
        if isinstance(src_data, dict):
            for k, v in src_data.items():
                lines.append(f"  - {k}: {v}")

    inp = bug.get("Input", {})
    if inp:
        lines.append("* Input")
        lines.append(
            f"  - Original: {inp.get('Original', 'input.json')}"
        )
        lines.append(
            f"  - Direct: {inp.get('Direct', 'direct_input.json')}"
        )

    lines.append("* Commands")
    for cmd_name, cmd_val in bug.get("Commands", {}).items():
        lines.append(f"  - {cmd_name}: `{cmd_val}`")

    lines.append("")
    lines.append("## Running")
    lines.append("")
    lines.append(
        "Scripts support two modes controlled by the "
        "`ZKBUGS_MODE` environment variable:"
    )
    lines.append("")
    lines.append(
        "- **`original`** (default): compiles the project's main "
        "circuit from the full codebase."
    )
    lines.append(
        "- **`direct`**: compiles an isolated wrapper "
        "(`circuit.circom`) that only instantiates the vulnerable "
        "template."
    )
    lines.append("")
    lines.append("```bash")
    lines.append("# Setup (run once)")
    lines.append("./zkbugs_setup.sh")
    lines.append("")
    lines.append("# Compile only (no zkey ceremony)")
    lines.append(
        "./zkbugs_compile.sh                        # original mode"
    )
    lines.append(
        "ZKBUGS_MODE=direct ./zkbugs_compile.sh     # direct mode"
    )
    lines.append("")
    lines.append(
        "# Full setup with zkey ceremony + positive test (direct mode)"
    )
    lines.append("ZKBUGS_MODE=direct ./zkbugs_compile_setup.sh")
    lines.append("ZKBUGS_MODE=direct ./zkbugs_positive_test.sh")
    lines.append("")
    lines.append("# Clean build artifacts")
    lines.append("./zkbugs_clean.sh")
    lines.append("```")

    vuln_desc = bug.get("Short Description of the Vulnerability", "")
    if vuln_desc:
        lines.append("")
        lines.append("## Short Description of the Vulnerability")
        lines.append("")
        lines.append(vuln_desc)

    mitigation = bug.get("Proposed Mitigation", "")
    if mitigation:
        lines.append("")
        lines.append("## Proposed Mitigation")
        lines.append("")
        lines.append(mitigation)

    lines.append("")

    readme_path = os.path.join(bugdir, "README.md")
    with open(readme_path, "w") as f:
        f.write("\n".join(lines))

    return readme_path


if __name__ == "__main__":
    dsl_filter = sys.argv[1] if len(sys.argv) > 1 else None

    count = 0
    for cfg_path in sorted(
        glob.glob("dataset/*/*/*/*/*/zkbugs_config.json")
        + glob.glob("dataset/*/*/*/*/zkbugs_config.json")
    ):
        if "dependencies" in cfg_path or "codebases" in cfg_path:
            continue
        if not os.path.isfile(cfg_path):
            continue

        if dsl_filter:
            with open(cfg_path) as f:
                data = json.load(f)
            key = list(data.keys())[0]
            dsl = data[key].get("DSL", "")
            if dsl.lower() != dsl_filter.lower():
                continue

        generate_readme(cfg_path)
        count += 1

    print(f"Regenerated {count} README files")

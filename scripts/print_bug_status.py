#!/usr/bin/env python3
"""Print a status table for all bugs in the dataset.

Usage:
    python3 scripts/print_bug_status.py              # all DSLs
    python3 scripts/print_bug_status.py Circom        # only Circom
    python3 scripts/print_bug_status.py Halo2         # only Halo2
"""

import json
import glob
import os
import sys


def load_bugs(dsl_filter=None):
    bugs = []
    for cfg_path in sorted(
        glob.glob("dataset/*/*/*/*/*/zkbugs_config.json")
        + glob.glob("dataset/*/*/*/*/zkbugs_config.json")
    ):
        if "dependencies" in cfg_path or "codebases" in cfg_path:
            continue
        if not os.path.isfile(cfg_path):
            continue

        with open(cfg_path) as f:
            try:
                data = json.load(f)
            except json.JSONDecodeError:
                continue

        key = list(data.keys())[0]
        bug = data[key]
        dsl = bug.get("DSL", "")

        if dsl_filter and dsl.lower() != dsl_filter.lower():
            continue

        project = bug.get("Project", "").replace("https://github.com/", "")

        # Support both old ("Compiled") and new ("Compiled Direct"/"Compiled Original") format
        compiled_direct = bug.get("Compiled Direct", bug.get("Compiled", False))
        compiled_original = bug.get("Compiled Original", False)

        bugs.append({
            "name": key,
            "project": project,
            "dsl": dsl,
            "compiled_direct": compiled_direct,
            "compiled_original": compiled_original,
            "executed": bug.get("Executed", False),
            "reproduced": bug.get("Reproduced", False),
        })

    return bugs


def print_table(bugs):
    if not bugs:
        print("No bugs found.")
        return

    max_proj = max(len(b["project"]) for b in bugs)
    max_proj = min(max_proj, 35)
    max_name = max(len(b["name"]) for b in bugs)
    max_name = min(max_name, 50)

    def flag(v):
        return "Y" if v else "N"

    header = (
        f"| {'#':>2} "
        f"| {'Project':<{max_proj}} "
        f"| {'Bug':<{max_name}} "
        f"| Direct | Original | Executed | Reproduced |"
    )
    sep = (
        f"|{'-' * 4}"
        f"|{'-' * (max_proj + 2)}"
        f"|{'-' * (max_name + 2)}"
        f"|--------|----------|----------|------------|"
    )

    print(header)
    print(sep)

    for i, b in enumerate(bugs, 1):
        proj = b["project"][:max_proj]
        name = b["name"][:max_name]
        print(
            f"| {i:>2} "
            f"| {proj:<{max_proj}} "
            f"| {name:<{max_name}} "
            f"| {flag(b['compiled_direct']):^6} "
            f"| {flag(b['compiled_original']):^8} "
            f"| {flag(b['executed']):^8} "
            f"| {flag(b['reproduced']):^10} |"
        )

    print()

    total = len(bugs)
    cd = sum(1 for b in bugs if b["compiled_direct"])
    co = sum(1 for b in bugs if b["compiled_original"])
    ex = sum(1 for b in bugs if b["executed"])
    rp = sum(1 for b in bugs if b["reproduced"])

    dsls = sorted(set(b["dsl"] for b in bugs))
    dsl_str = ", ".join(dsls) if len(dsls) > 1 else dsls[0]

    print(f"DSL:               {dsl_str}")
    print(f"Total:             {total}")
    print(f"Compiled Direct:   {cd}/{total} ({100*cd//total}%)")
    print(f"Compiled Original: {co}/{total} ({100*co//total}%)")
    print(f"Executed:          {ex}/{total} ({100*ex//total}%)")
    print(f"Reproduced:        {rp}/{total} ({100*rp//total}%)")


if __name__ == "__main__":
    dsl_filter = sys.argv[1] if len(sys.argv) > 1 else None
    bugs = load_bugs(dsl_filter)
    print_table(bugs)

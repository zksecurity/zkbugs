#!/usr/bin/env python3
import os
import json
from collections import defaultdict, OrderedDict


def repo_root() -> str:
    here = os.path.dirname(os.path.abspath(__file__))
    return os.path.abspath(os.path.join(here, ".."))


def dataset_dir(root: str) -> str:
    return os.path.join(root, "dataset")


SPECIAL_TITLE = {
    "halo2": "Halo2",
    "pil": "PIL",
    "plonky3": "Plonky3",
    "risc0": "Risc0",
}


def dsl_title(name: str) -> str:
    if name in SPECIAL_TITLE:
        return SPECIAL_TITLE[name]
    return name.capitalize()


def count_bugs(ds_root: str):
    counts_all = defaultdict(int)
    counts_reproduced = defaultdict(int)

    for root, _, files in os.walk(ds_root):
        if "zkbugs_config.json" in files:
            # DSL is the first path component after dataset/
            rel = os.path.relpath(root, ds_root)
            dsl = rel.split(os.sep, 1)[0]
            counts_all[dsl] += 1
            # Try to read Reproduced flag
            reproduced = True
            try:
                cfg_path = os.path.join(root, "zkbugs_config.json")
                with open(cfg_path, "r") as fh:
                    cfg = json.load(fh)
                first_key = next(iter(cfg))
                reproduced = bool(cfg[first_key].get("Reproduced", True))
            except Exception:
                reproduced = True
            if reproduced:
                counts_reproduced[dsl] += 1

    return counts_all, counts_reproduced


def ordered_dsls(counts: dict) -> OrderedDict:
    # Primary ordering by DSL name ascending for determinism
    return OrderedDict(sorted(counts.items(), key=lambda kv: kv[0]))


def main():
    root = repo_root()
    ds_root = dataset_dir(root)
    if not os.path.isdir(ds_root):
        raise SystemExit(f"dataset directory not found at: {ds_root}")

    counts_all, counts_repr = count_bugs(ds_root)

    total_all = sum(counts_all.values())
    total_repr = sum(counts_repr.values())

    print(f"This repo currently includes {total_all} vulnerabilities across DSLs.")
    if total_repr != total_all:
        print(f"Reproduced: {total_repr} / {total_all}")
    print()

    print("By DSL (all):")
    for dsl, count in ordered_dsls(counts_all).items():
        print(f"- {dsl_title(dsl)} ({count})")

    if total_repr != total_all:
        print("\nBy DSL (reproduced only):")
        for dsl, count in ordered_dsls(counts_repr).items():
            print(f"- {dsl_title(dsl)} ({count})")


if __name__ == "__main__":
    main()


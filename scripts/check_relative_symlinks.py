#!/usr/bin/env python3
"""Fail if any symlink under dataset/codebases/ is absolute or dangling.

Relative, working symlinks are portable across hosts and Docker images.
Absolute symlinks bake in the build host's filesystem layout; dangling
symlinks silently break compiles for downstream consumers.
"""

import os
import pathlib
import sys


def main() -> int:
    root = pathlib.Path("dataset/codebases")
    if not root.exists():
        print(f"{root} does not exist", file=sys.stderr)
        return 1

    bad: list[tuple[pathlib.Path, str]] = []
    for p in root.rglob("*"):
        if not p.is_symlink():
            continue
        target = os.readlink(p)
        if os.path.isabs(target):
            bad.append((p, target))
        elif not p.exists():
            bad.append((p, f"{target}  (dangling)"))

    if bad:
        print(f"{len(bad)} portability-broken symlinks under {root}:")
        for link, target in bad:
            print(f"  {link}")
            print(f"    -> {target}")
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())

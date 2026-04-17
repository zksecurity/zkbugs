#!/bin/bash
# Validate scripts/print_bug_vars.sh output across every circom bug.
#
# For each bug dir under dataset/circom/*/*/*/ and each mode in {direct, original}:
#   - run print_bug_vars.sh
#   - require the output parses as JSON
#   - require the "circuit" file exists on disk
#   - require every path following a "-l" token in "link_flags" exists on disk
#
# Assumes scripts/download_sources.sh has populated dataset/codebases/...
#
# Usage: test_print_vars.sh

set -uo pipefail

ROOT=$(dirname "$(dirname "$(realpath "$0")")")
cd "$ROOT"

PRINT_VARS="$ROOT/scripts/print_bug_vars.sh"
if [ ! -x "$PRINT_VARS" ]; then
    echo "error: $PRINT_VARS not executable" >&2
    exit 1
fi

pass=0
fail=0
skip=0
total=0
FAILED_BUGS=()
SKIPPED_BUGS=()

for d in dataset/circom/*/*/*/; do
    [ -f "$d/zkbugs_vars.sh" ] || continue
    echo "$d" | grep -q "dependencies" && continue

    for mode in direct original; do
        total=$((total + 1))
        out=$(bash "$PRINT_VARS" "$d" --mode "$mode" 2>&1)
        rc=$?
        if [ $rc -ne 0 ]; then
            echo "FAIL [$mode] $d: print_bug_vars.sh exited $rc"
            echo "$out" | sed 's/^/    /'
            fail=$((fail + 1))
            FAILED_BUGS+=("$mode:$d")
            continue
        fi

        # Validate with python: parse JSON, check circuit + every -l path
        # exists. Exits 0 pass, 1 fail, 2 skip (codebase not downloaded).
        err=$(printf '%s' "$out" | python3 -c '
import json, os, sys
data = sys.stdin.read()
try:
    obj = json.loads(data)
except Exception as e:
    print(f"json parse error: {e}"); sys.exit(1)

if not obj.get("codebase_exists", False):
    print("codebase not downloaded: " + str(obj.get("codebase")))
    sys.exit(2)

missing = []
circuit = obj.get("circuit")
if not circuit or not os.path.isfile(circuit):
    missing.append(f"circuit missing: {circuit!r}")

flags = obj.get("link_flags", [])
i = 0
while i < len(flags):
    tok = flags[i]
    if tok == "-l":
        if i + 1 >= len(flags):
            missing.append("link_flags ended with dangling -l")
            break
        p = flags[i + 1]
        if not os.path.isdir(p):
            missing.append(f"link path missing: {p}")
        i += 2
    else:
        missing.append(f"unexpected token in link_flags: {tok!r}")
        i += 1

if missing:
    for m in missing:
        print(m)
    sys.exit(1)
' 2>&1)
        rc=$?
        if [ $rc -eq 2 ]; then
            echo "SKIP [$mode] $d (codebase not downloaded)"
            skip=$((skip + 1))
            SKIPPED_BUGS+=("$mode:$d")
        elif [ $rc -ne 0 ]; then
            echo "FAIL [$mode] $d"
            printf '%s\n' "$err" | sed 's/^/    /'
            fail=$((fail + 1))
            FAILED_BUGS+=("$mode:$d")
        else
            pass=$((pass + 1))
        fi
    done
done

echo ""
echo "=== Results ==="
echo "Total checks: $total"
echo "Passed:       $pass"
echo "Skipped:      $skip"
echo "Failed:       $fail"

if [ $skip -gt 0 ]; then
    echo ""
    echo "Skipped entries (codebase not downloaded):"
    for s in "${SKIPPED_BUGS[@]}"; do
        echo "  $s"
    done
fi

if [ $fail -gt 0 ]; then
    echo ""
    echo "Failed entries:"
    for f in "${FAILED_BUGS[@]}"; do
        echo "  $f"
    done
    exit 1
fi

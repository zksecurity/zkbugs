#!/bin/bash
set -uo pipefail

# Validate print_bug_vars.sh for all circom bugs in both modes.
# Checks: JSON parses, circuit file exists, every -l path exists.
# Assumes download_sources.sh has already been run.

ROOT=$(dirname "$(dirname "$(realpath "$0")")")
PRINT_SCRIPT="$ROOT/scripts/print_bug_vars.sh"

pass=0
fail=0
total=0

for d in "$ROOT"/dataset/circom/*/*/*/; do
    [ -f "$d/zkbugs_vars.sh" ] || continue
    echo "$d" | grep -q "dependencies" && continue

    bugname=$(basename "$d")
    total=$((total + 1))

    for mode in direct original; do
        output=$(bash "$PRINT_SCRIPT" "$d" --mode "$mode" 2>&1)
        rc=$?

        if [ $rc -ne 0 ]; then
            echo "FAIL [$mode]: $bugname -- exit code $rc"
            echo "  $output" | head -3 | sed 's/^/  /'
            fail=$((fail + 1))
            continue
        fi

        # Validate JSON and check paths
        result=$(python3 -c "
import json, sys, os

try:
    doc = json.loads(sys.stdin.read())
except json.JSONDecodeError as e:
    print(f'invalid JSON: {e}')
    sys.exit(1)

errors = []

# Check circuit file exists
circuit = doc.get('circuit', '')
if not os.path.isfile(circuit):
    errors.append(f'circuit not found: {circuit}')

# Check every -l path exists
flags = doc.get('link_flags', [])
i = 0
while i < len(flags):
    if flags[i] == '-l' and i + 1 < len(flags):
        path = flags[i + 1]
        if not os.path.exists(path):
            errors.append(f'-l path not found: {path}')
        i += 2
    else:
        i += 1

if errors:
    for e in errors:
        print(e)
    sys.exit(1)
" <<< "$output" 2>&1)
        rc2=$?

        if [ $rc2 -ne 0 ]; then
            echo "FAIL [$mode]: $bugname"
            echo "$result" | sed 's/^/  /'
            fail=$((fail + 1))
        else
            pass=$((pass + 1))
        fi
    done
done

echo ""
echo "=== print_bug_vars validation ==="
echo "Total bugs: $total"
echo "Tests run:  $((pass + fail)) (2 modes x $total bugs)"
echo "PASS:       $pass"
echo "FAIL:       $fail"

[ "$fail" -eq 0 ] && exit 0 || exit 1

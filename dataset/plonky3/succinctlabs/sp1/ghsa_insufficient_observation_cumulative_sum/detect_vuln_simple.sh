#!/usr/bin/env bash
# detect_vuln_simple.sh - Simplified version for Windows/Git Bash
# Exit codes for git bisect:
#   0 = good (fixed)      -> not vulnerable
#   1 = bad  (vulnerable) -> vulnerable
# 125 = skip (inapplicable) -> doesn't have permutation/zeta yet

set -eu

# Use old layout (core/src)
SEARCH_PATHS="core/src curta/src prover/src"

# Check 1: Does code have cumulative_sum or permutation machinery?
if ! git grep -E --quiet "cumulative[ _]*sum|permutation_trace|generate_permutation_trace" -- $SEARCH_PATHS 2>/dev/null; then
  echo "[SKIP] No permutation machinery found" >&2
  exit 125
fi

# Check 2: Does code sample zeta?
if ! git grep -E --quiet "zeta|sample.*element" -- $SEARCH_PATHS 2>/dev/null; then
  echo "[SKIP] No zeta sampling found" >&2
  exit 125
fi

# Check 3: Does code have PCS commits?
if ! git grep -E --quiet "commit_batches|pcs.*commit" -- $SEARCH_PATHS 2>/dev/null; then
  echo "[SKIP] No PCS commit machinery found" >&2
  exit 125
fi

# At this point, commit has permutation + zeta machinery
# Check 4: Does code observe permutation_commit or main_commit?
if git grep -E --quiet "challenger\.observe.*commit|observe\(.*commit\)" -- $SEARCH_PATHS 2>/dev/null; then
  # Check specifically for permutation_commit observation
  if git grep -E --quiet "observe.*permutation_commit|permutation_commit.*observe" -- $SEARCH_PATHS 2>/dev/null; then
    echo "[GOOD] Found permutation_commit observation - FIXED" >&2
    exit 0
  else
    # Has observe(main_commit) but not observe(permutation_commit) - VULNERABLE!
    echo "[BAD] Has permutation machinery and main_commit observation, but NO permutation_commit observation - VULNERABLE" >&2
    exit 1
  fi
else
  echo "[SKIP] No challenger.observe calls found" >&2
  exit 125
fi


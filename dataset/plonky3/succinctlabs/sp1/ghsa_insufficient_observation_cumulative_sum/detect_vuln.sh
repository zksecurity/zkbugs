#!/usr/bin/env bash
# detect_vuln.sh
# Exit codes for git bisect:
#   0 = good (fixed)      -> not vulnerable
#   1 = bad  (vulnerable) -> vulnerable
# 125 = skip (inapplicable) -> doesn't have permutation/zeta yet

set -eu
# choose mode: "modern" or "old". Default modern.
MODE="${MODE:-modern}"

if [ "$MODE" = "modern" ]; then
  # pathspecs tuned for modern monorepo recursion / prover / air code
  PATHS=( 'crates/recursion' 'crates/prover' 'crates/**/air' )
else
  # old curta-style layout (adjust if necessary)
  PATHS=( 'core/src' 'curta/src' 'prover/src' )
fi

# Regex patterns (POSIX ERE)
PERM_PAT='(cumulative[ _]*sum|permutation_trace|generate_permutation_trace|eval_permutation_constraints|permutation[ _]*commit)'
ZETA_PAT='(zeta|sample_([a-z_]*_)?element|sample.*challenge|draw.*challenge)'
PCS_PAT='(commit_batches|pcs[[:space:]]*\\()'
OBS_PAT='challenger[[:space:]]*\\.[[:space:]]*observe[[:space:]]*\\([^)]*commit'

# helper: git grep across PATHS; returns 0 if match
function greps_any() {
  pattern="$1"
  shift
  # build path list for git grep; only include existing paths to avoid errors
  args=()
  for p in "$@"; do
    if git ls-files --error-unmatch "$p" >/dev/null 2>&1; then
      args+=( "$p" )
    else
      # glob fallback: expand if any file matches
      matches=$(git ls-files "$p" 2>/dev/null | head -n1 || true)
      [ -n "$matches" ] && args+=( "$p" )
    fi
  done
  if [ "${#args[@]}" -eq 0 ]; then
    return 1
  fi
  git grep -n -E --quiet "$pattern" -- "${args[@]}" >/dev/null 2>&1
  return $?
}

# Check presence
if ! greps_any "$PERM_PAT" "${PATHS[@]}"; then
  # no permutation/cumulative -> irrelevant
  exit 125
fi
if ! greps_any "$ZETA_PAT" "${PATHS[@]}"; then
  # no zeta sampling -> irrelevant
  exit 125
fi
if ! greps_any "$PCS_PAT" "${PATHS[@]}"; then
  # no commit/pcs flow -> probably irrelevant
  exit 125
fi

# At this point, the commit *has* the permutation machinery and zeta sampling.
# Now check for an observation of a commit.
if greps_any "$OBS_PAT" "${PATHS[@]}"; then
  # observe(...commit) present -> fixed (GOOD)
  exit 0
else
  # no observe(commit) -> vulnerable (BAD)
  exit 1
fi


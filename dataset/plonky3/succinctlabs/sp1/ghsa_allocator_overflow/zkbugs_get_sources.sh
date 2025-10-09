#!/usr/bin/env bash
# zkbugs_get_sources.sh
# Fetches the vulnerable source code at a specific commit

set -e  # Exit on error

# ---- Configuration (modify per bug) ----
PROJECT_URL="https://github.com/succinctlabs/sp1"
VULNERABLE_REF="f1628aa2204b2a6936a41182db71338ef58cecca"  # From GHSA-6248-228x-mmvh advisory (parent of ba053c3b)
CLONE_DIR="sources"
# ---- End Configuration ----

# Check if git is available
if ! command -v git &> /dev/null; then
    echo "Error: git is not installed"
    exit 1
fi

# Idempotency: skip if already cloned
if [ -d "$CLONE_DIR/.git" ]; then
    echo "[zkbugs] Sources already exist in '$CLONE_DIR' - skipping"
    exit 0
fi

echo "[zkbugs] Cloning $PROJECT_URL into $CLONE_DIR..."
git clone --recursive "$PROJECT_URL" "$CLONE_DIR"

cd "$CLONE_DIR"

echo "[zkbugs] Checking out vulnerable ref: $VULNERABLE_REF"
# Fetch the specific commit (needed if it's not on any branch)
git fetch origin "$VULNERABLE_REF" || true
git checkout "$VULNERABLE_REF"

# Update submodules to match this exact commit
if [ -f .gitmodules ]; then
    echo "[zkbugs] Updating submodules..."
    git submodule update --init --recursive
fi

echo "[zkbugs] Sources fetched successfully"

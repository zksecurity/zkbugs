#!/usr/bin/env bash
# zkbugs_get_sources.sh
# Fetches the vulnerable source code at a specific commit

set -e  # Exit on error

# ---- Configuration (modify per bug) ----
PROJECT_URL="https://github.com/0xPolygonHermez/zisk"
VULNERABLE_REF="6182c8be9f4ec6baf7ee9771dd0668324f7112ed"  # Vulnerable commit (the one reported in GHSA-qjgg-fcj3-p9x3)
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
echo "[zkbugs] Vulnerable table filter: state-machines/arith/pil/arith_table.pil:144-163"
echo "[zkbugs] Magnitude-only identity and bound: state-machines/arith/pil/arith.pil"

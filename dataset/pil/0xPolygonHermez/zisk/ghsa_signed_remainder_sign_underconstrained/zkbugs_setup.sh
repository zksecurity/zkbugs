#!/bin/bash
# Setup script: Get sources and check dependencies

set -e

echo "=========================================="
echo "zkBugs Setup: GHSA-qjgg-fcj3-p9x3"
echo "=========================================="
echo ""

# 1. Get sources
echo "[1/2] Fetching vulnerable sources..."
./zkbugs_get_sources.sh

# 2. Check Rust toolchain
echo ""
echo "[2/2] Checking dependencies..."

MISSING_TOOLS=()

if ! command -v rustc &> /dev/null; then
    MISSING_TOOLS+=("rustc")
fi

if ! command -v cargo &> /dev/null; then
    MISSING_TOOLS+=("cargo")
fi

if [ ${#MISSING_TOOLS[@]} -ne 0 ]; then
    echo "❌ The following tools are missing: ${MISSING_TOOLS[*]}"
    echo "   Please install Rust: https://rustup.rs/"
    exit 1
else
    echo "✓ Rust toolchain found:"
    rustc --version
    cargo --version
fi

echo ""
echo "=========================================="
echo "✓ Setup completed successfully!"
echo "=========================================="
echo ""
echo "The vulnerable constraints are in the fetched sources at:"
echo "  sources/state-machines/arith/pil/arith_table.pil  (lines 144-163)"
echo "  sources/state-machines/arith/pil/arith.pil"
echo ""
echo "No PoC is included for this entry. An end-to-end repro for the"
echo "quotient-sign sibling of this bug is at https://github.com/codygunton/zisk/pull/12"
echo ""

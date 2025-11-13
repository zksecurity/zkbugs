#!/bin/bash
# Setup script: Get sources and check dependencies

set -e

echo "=========================================="
echo "zkBugs Setup: GHSA-6248-228x-mmvh"
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
echo "Next steps:"
echo "  1. Compile tests:  ./zkbugs_compile_setup.sh"
echo "  2. Run tests:      ./zkbugs_exploit.sh"
echo ""

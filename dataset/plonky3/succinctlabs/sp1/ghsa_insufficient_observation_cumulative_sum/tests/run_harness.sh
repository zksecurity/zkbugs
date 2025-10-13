#!/usr/bin/env bash
# run_harness.sh
# Compiles and runs harness test for Fiat-Shamir observation order bug
#
# REQUIRES: Sources to be fetched via ../zkbugs_get_sources.sh

set -e

echo "=========================================="
echo "SP1 Fiat-Shamir Observation Order"
echo "Harness Test (Static Analysis)"
echo "=========================================="
echo ""

# Check for rustc
if ! command -v rustc &> /dev/null; then
    echo "❌ Error: rustc not found"
    echo "   Install Rust: https://rustup.rs/"
    exit 1
fi

echo "✓ Found rustc: $(rustc --version)"
echo ""

# Check if sources exist
if [ ! -d "../sources" ]; then
    echo "⚠️  Warning: ../sources/ directory not found"
    echo "   Run: cd .. && ./zkbugs_get_sources.sh"
    echo ""
    echo "Continuing anyway (harness will report missing files)..."
    echo ""
fi

# Compile harness
echo "Compiling harness..."
rustc harness_fiat_shamir_observation.rs -o harness_runner

echo "✓ Compilation successful"
echo ""

# Run harness
echo "Running harness analysis..."
echo ""
./harness_runner

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "✅ Harness analysis complete!"
    echo "=========================================="
else
    echo ""
    echo "=========================================="
    echo "❌ Harness analysis failed"
    echo "=========================================="
    exit 1
fi

# Cleanup
echo ""
echo "Cleaning up..."
rm -f harness_runner

echo "Done!"


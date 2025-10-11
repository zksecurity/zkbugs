#!/usr/bin/env bash
# run_harness.sh
# Runs harness test for vk_root validation vulnerability

set -e

echo "=============================================="
echo "SP1 vk_root Validation - Harness Test"
echo "=============================================="
echo "Vulnerability: GHSA-6248-228x-mmvh Bug 1"
echo "Missing vk_root validation in Rust verifier"
echo "=============================================="
echo ""

# Check if sources exist
if [ ! -d "../sources" ]; then
    echo "❌ Error: sources/ directory not found"
    echo "   Run: cd .. && ./zkbugs_get_sources.sh"
    exit 1
fi

echo "✓ Sources found"
echo ""

# Compile harness test
echo "Compiling harness test..."
if command -v rustc &> /dev/null; then
    rustc harness_vk_root_validation.rs -o harness_runner
    echo "✓ Compilation successful"
else
    echo "❌ Error: rustc not found"
    echo "   Install Rust from https://rustup.rs"
    exit 1
fi

echo ""
echo "=============================================="
echo "Running Harness Test..."
echo "=============================================="
echo ""

# Run harness
./harness_runner

# Save exit code
EXIT_CODE=$?

# Cleanup
rm -f harness_runner

echo ""
echo "=============================================="
if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ Harness test completed successfully"
else
    echo "❌ Harness test failed (exit code: $EXIT_CODE)"
fi
echo "=============================================="

exit $EXIT_CODE


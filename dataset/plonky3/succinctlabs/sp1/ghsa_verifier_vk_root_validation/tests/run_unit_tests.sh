#!/usr/bin/env bash
# run_unit_tests.sh
# Runs unit tests for vk_root validation vulnerability

set -e

echo "=============================================="
echo "SP1 vk_root Validation - Unit Tests"
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

# Check if verify.rs exists
if [ ! -f "../sources/crates/prover/src/verify.rs" ]; then
    echo "❌ Error: verify.rs not found"
    echo "   The sources may not be checked out correctly"
    exit 1
fi

echo "✓ Sources found"
echo ""

# Compile unit tests
echo "Compiling unit tests..."
if command -v rustc &> /dev/null; then
    rustc --test unit_vk_root_validation.rs -o unit_test_runner
    echo "✓ Compilation successful"
else
    echo "❌ Error: rustc not found"
    echo "   Install Rust from https://rustup.rs"
    exit 1
fi

echo ""
echo "=============================================="
echo "Running Unit Tests..."
echo "=============================================="
echo ""

# Run tests
./unit_test_runner

# Save exit code
EXIT_CODE=$?

# Cleanup
rm -f unit_test_runner

echo ""
echo "=============================================="
if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ All unit tests passed"
else
    echo "❌ Some tests failed (exit code: $EXIT_CODE)"
fi
echo "=============================================="

exit $EXIT_CODE


#!/usr/bin/env bash
# run_unit_tests.sh
# Compiles and runs unit tests for Fiat-Shamir observation order bug
#
# NO DEPENDENCIES REQUIRED - just rustc

set -e

echo "=========================================="
echo "SP1 Fiat-Shamir Observation Order"
echo "Unit Tests"
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

# Compile unit tests
echo "Compiling unit tests..."
rustc --test unit_fiat_shamir_observation.rs -o unit_test_runner

echo "✓ Compilation successful"
echo ""

# Run tests
echo "Running tests..."
echo ""
./unit_test_runner

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "✅ All tests passed!"
    echo "=========================================="
else
    echo ""
    echo "=========================================="
    echo "❌ Some tests failed"
    echo "=========================================="
    exit 1
fi

# Cleanup
echo ""
echo "Cleaning up..."
rm -f unit_test_runner

echo "Done!"


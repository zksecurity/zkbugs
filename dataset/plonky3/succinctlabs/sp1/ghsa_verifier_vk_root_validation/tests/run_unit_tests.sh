#!/bin/bash
# Unit test runner for GHSA-6248-228x-mmvh (vk_root)

set -e

echo "=========================================="
echo "SP1 vk_root Validation Unit Tests"
echo "Vulnerability: GHSA-6248-228x-mmvh"
echo "=========================================="
echo ""

# Check if unit test file exists
if [ ! -f "unit_vk_root_validation.rs" ]; then
    echo "Error: Unit test file not found"
    exit 1
fi

# Compile unit tests
echo "Compiling unit tests..."
rustc --test unit_vk_root_validation.rs \
    --edition 2021 \
    -o unit_test_runner \
    2>&1 | tee compile.log

if [ $? -ne 0 ]; then
    echo "Compilation failed. See compile.log"
    exit 1
fi

echo "✓ Compilation successful"
echo ""

# Run the tests
echo "Running tests..."
./unit_test_runner --test-threads=1 2>&1 | tee test_output.log

TEST_STATUS=$?

echo ""
if [ $TEST_STATUS -eq 0 ]; then
    echo "✓ All tests passed!"
else
    echo "✗ Some tests failed"
fi

echo ""
exit $TEST_STATUS

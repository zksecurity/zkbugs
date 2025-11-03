#!/bin/bash
# Unit test runner for GHSA-g3qg-6746-3mg9

set -e

echo "=========================================="
echo "RISC0 zkVM 3-Reg Instructions Unit Tests"
echo "Vulnerability: GHSA-g3qg-6746-3mg9"
echo "=========================================="
echo ""

# Check if unit test file exists
if [ ! -f "unit_same_cycle_io.rs" ]; then
    echo "Error: Unit test file not found"
    exit 1
fi

# Compile unit tests
echo "Compiling unit tests..."
rustc --test unit_same_cycle_io.rs \
    --edition 2021 \
    -o unit_tests \
    2>&1 | tee compile.log

if [ $? -ne 0 ]; then
    echo "Compilation failed. See compile.log"
    exit 1
fi

echo "✓ Compilation successful"
echo ""

# Run the tests
echo "Running tests..."
./unit_tests --test-threads=1 2>&1 | tee test_output.log

TEST_STATUS=$?

echo ""
if [ $TEST_STATUS -eq 0 ]; then
    echo "✓ All tests passed!"
else
    echo "✗ Some tests failed"
fi

echo ""
exit $TEST_STATUS

#!/bin/bash
# Run unit tests for chip_ordering validation vulnerability
# These tests require NO SP1 dependencies and run in milliseconds

set -e

echo "========================================"
echo "Running chip_ordering Unit Tests"
echo "========================================"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Clean previous builds
echo "Cleaning previous builds..."
rm -f unit_runner
rm -f unit_runner.exe

# Compile the unit test
echo "Compiling unit_chip_ordering_validation.rs..."
rustc --test unit_chip_ordering_validation.rs -o unit_runner 2>&1

if [ $? -eq 0 ]; then
    echo "✓ Compilation successful"
    echo ""
else
    echo "✗ Compilation failed"
    exit 1
fi

# Run the tests
echo "Running tests..."
echo "========================================"
./unit_runner "$@"
TEST_RESULT=$?

echo ""
echo "========================================"
if [ $TEST_RESULT -eq 0 ]; then
    echo "✅ All unit tests passed"
else
    echo "❌ Some tests failed (exit code: $TEST_RESULT)"
fi
echo "========================================"

exit $TEST_RESULT


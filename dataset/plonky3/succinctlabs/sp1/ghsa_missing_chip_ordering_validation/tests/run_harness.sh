#!/bin/bash
# Run harness test for chip_ordering validation vulnerability
# This test analyzes the actual verifier.rs source code

set -e

echo "========================================"
echo "Running chip_ordering Harness Test"
echo "========================================"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check if sources exist
if [ ! -d "../sources" ]; then
    echo "⚠️  Sources not found!"
    echo "Run zkbugs_get_sources.sh first to clone the repository"
    echo ""
    echo "Expected structure:"
    echo "  ../sources/crates/stark/src/verifier.rs"
    echo ""
    exit 1
fi

# Clean previous builds
echo "Cleaning previous builds..."
rm -f harness_runner
rm -f harness_runner.exe

# Compile the harness test
echo "Compiling harness_chip_ordering_validation.rs..."
rustc harness_chip_ordering_validation.rs -o harness_runner 2>&1

if [ $? -eq 0 ]; then
    echo "✓ Compilation successful"
    echo ""
else
    echo "✗ Compilation failed"
    exit 1
fi

# Run the harness
echo "Running harness test..."
echo "========================================"
./harness_runner "$@"
HARNESS_RESULT=$?

echo ""
echo "========================================"
if [ $HARNESS_RESULT -eq 0 ]; then
    echo "✅ Harness test completed"
else
    echo "⚠️  Harness test completed with warnings (exit code: $HARNESS_RESULT)"
fi
echo "========================================"

exit $HARNESS_RESULT


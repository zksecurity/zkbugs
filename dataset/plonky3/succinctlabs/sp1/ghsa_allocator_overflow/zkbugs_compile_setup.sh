#!/bin/bash
# Compile unit tests

set -e

echo "=========================================="
echo "Compiling Unit Tests"
echo "=========================================="
echo ""

TESTS_DIR="tests"
UNIT_TEST_FILE="$TESTS_DIR/unit_allocator_overflow.rs"
OUTPUT_BINARY="$TESTS_DIR/test_runner"

if [ ! -f "$UNIT_TEST_FILE" ]; then
    echo "❌ Unit test file not found: $UNIT_TEST_FILE"
    exit 1
fi

cd "$TESTS_DIR"

echo "Compiling unit_allocator_overflow.rs..."
rustc --test unit_allocator_overflow.rs -o test_runner 2>&1

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo ""
    echo "✓ Compilation successful!"
    echo "  Binary: test_runner"
else
    echo ""
    echo "❌ Compilation failed"
    exit 1
fi

cd ..
echo ""

#!/bin/bash
# Compile unit tests

set -e

echo "=========================================="
echo "Compiling Unit Tests"
echo "=========================================="
echo ""

TESTS_DIR="tests"
UNIT_TEST_FILE="$TESTS_DIR/unit_is_complete_underconstrained.rs"
OUTPUT_BINARY="$TESTS_DIR/unit_tests"

if [ ! -f "$UNIT_TEST_FILE" ]; then
    echo "❌ Unit test file not found: $UNIT_TEST_FILE"
    exit 1
fi

cd "$TESTS_DIR"

echo "Compiling unit_is_complete_underconstrained.rs..."
rustc --test unit_is_complete_underconstrained.rs -o unit_tests 2>&1

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo ""
    echo "✓ Compilation successful!"
    echo "  Binary: unit_tests"
else
    echo ""
    echo "❌ Compilation failed"
    exit 1
fi

cd ..
echo ""

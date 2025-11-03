#!/bin/bash
# Compile unit tests

set -e

echo "=========================================="
echo "Compiling Unit Tests"
echo "=========================================="
echo ""

TESTS_DIR="tests"
UNIT_TEST_FILE="$TESTS_DIR/unit_fiat_shamir_observation.rs"
OUTPUT_BINARY="$TESTS_DIR/unit_test_runner"

if [ ! -f "$UNIT_TEST_FILE" ]; then
    echo "❌ Unit test file not found: $UNIT_TEST_FILE"
    exit 1
fi

cd "$TESTS_DIR"

echo "Compiling unit_fiat_shamir_observation.rs..."
rustc --test unit_fiat_shamir_observation.rs -o unit_test_runner 2>&1

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo ""
    echo "✓ Compilation successful!"
    echo "  Binary: unit_test_runner"
else
    echo ""
    echo "❌ Compilation failed"
    exit 1
fi

cd ..
echo ""

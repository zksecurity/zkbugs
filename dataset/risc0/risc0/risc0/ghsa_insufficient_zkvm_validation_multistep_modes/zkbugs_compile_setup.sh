#!/bin/bash
# Compile unit tests

set -e

echo "=========================================="
echo "Compiling Unit Tests"
echo "=========================================="
echo ""

TESTS_DIR="tests"
UNIT_TEST_FILE="$TESTS_DIR/unit_composite_receipt_integrity.rs"
OUTPUT_BINARY="$TESTS_DIR/unit_tests"

if [ ! -f "$UNIT_TEST_FILE" ]; then
    echo "❌ Unit test file not found: $UNIT_TEST_FILE"
    exit 1
fi

echo "Compiling $UNIT_TEST_FILE..."
rustc --test "$UNIT_TEST_FILE" \
    --edition 2021 \
    -o "$OUTPUT_BINARY" \
    2>&1 | tee "$TESTS_DIR/compile.log"

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo ""
    echo "✓ Compilation successful!"
    echo "  Binary: $OUTPUT_BINARY"
else
    echo ""
    echo "❌ Compilation failed. See $TESTS_DIR/compile.log"
    exit 1
fi

echo ""

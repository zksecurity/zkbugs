#!/bin/bash
# Clean script: Remove downloaded sources and generated test artifacts

set -e

echo "Cleaning up..."

# 1. Remove downloaded sources
if [ -d "sources" ]; then
    echo "  - Removing sources/ directory..."
    rm -rf sources
fi

# 2. Remove test artifacts
if [ -d "tests" ]; then
    echo "  - Removing test artifacts..."
    rm -f tests/unit_tests tests/test_runner tests/unit_test_runner
    rm -f tests/*.exe tests/*.pdb
    rm -f tests/compile.log tests/test_output.log
    rm -f tests/UNIT_TESTS_REPORT.md
fi

echo "✓ Cleanup complete"

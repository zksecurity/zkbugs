#!/usr/bin/env bash
# run_unit_tests.sh
# Compiles and runs the standalone unit tests for underconstrained is_complete flag bug

set -e

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
cd "$SCRIPT_DIR"

echo "=============================================="
echo "SP1 is_complete Underconstrained - Unit Tests"
echo "GHSA-c873-wfhp-wx5m Bug 2"
echo "=============================================="
echo

# Check if rustc is available
if ! command -v rustc &> /dev/null; then
    echo "Error: rustc not found. Please install Rust:"
    echo "  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    exit 1
fi

echo "[1/3] Compiling unit tests..."
rustc --test unit_is_complete_underconstrained.rs -o test_runner 2>&1 | head -n 20

if [ ! -f test_runner ] && [ ! -f test_runner.exe ]; then
    echo "Error: Compilation failed"
    exit 1
fi

echo
echo "[2/3] Running tests..."
echo

# Run with test binary name (cross-platform)
if [ -f test_runner ]; then
    ./test_runner
elif [ -f test_runner.exe ]; then
    ./test_runner.exe
fi

TEST_RESULT=$?

echo
echo "[3/3] Summary"
echo "=============================================="

if [ $TEST_RESULT -eq 0 ]; then
    echo "✅ All unit tests passed!"
    echo
    echo "What this demonstrates:"
    echo "  - Vulnerable version accepts is_complete=1 with next_pc!=0"
    echo "  - Fixed version rejects this via assert_complete constraints"
    echo "  - Differential oracle detects the discrepancy"
    echo
    echo "Test runtime: < 100ms (no dependencies required)"
else
    echo "❌ Some tests failed (exit code: $TEST_RESULT)"
    exit $TEST_RESULT
fi

echo
echo "For source code analysis, run: ./run_harness.sh"
echo "For full documentation, see: README.md"


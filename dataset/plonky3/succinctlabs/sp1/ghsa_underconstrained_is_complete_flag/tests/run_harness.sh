#!/usr/bin/env bash
# run_harness.sh
# Compiles and runs the source code analysis harness for underconstrained is_complete flag bug

set -e

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
cd "$SCRIPT_DIR"

echo "=================================================="
echo "SP1 is_complete Underconstrained - Harness Tests"
echo "GHSA-c873-wfhp-wx5m Bug 2"
echo "=================================================="
echo

# Check if rustc is available
if ! command -v rustc &> /dev/null; then
    echo "Error: rustc not found. Please install Rust:"
    echo "  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    exit 1
fi

# Check if sources exist
SOURCES_DIR="../sources/crates/recursion/circuit/src/machine"
if [ ! -d "$SOURCES_DIR" ]; then
    echo "⚠️  Warning: Sources not found at $SOURCES_DIR"
    echo
    echo "Please run the following to fetch vulnerable sources:"
    echo "  cd .."
    echo "  ./zkbugs_get_sources.sh"
    echo "  cd tests"
    echo
    echo "The harness will still compile, but tests will skip source analysis."
    echo
fi

echo "[1/3] Compiling harness..."
rustc harness_is_complete_underconstrained.rs -o harness_runner 2>&1 | head -n 20

if [ ! -f harness_runner ] && [ ! -f harness_runner.exe ]; then
    echo "Error: Compilation failed"
    exit 1
fi

echo
echo "[2/3] Running harness tests..."
echo

# Run with test binary name (cross-platform)
if [ -f harness_runner ]; then
    ./harness_runner
elif [ -f harness_runner.exe ]; then
    ./harness_runner.exe
fi

TEST_RESULT=$?

echo
echo "[3/3] Summary"
echo "=================================================="

if [ $TEST_RESULT -eq 0 ]; then
    echo "✅ All harness tests completed!"
    echo
    
    if [ -d "$SOURCES_DIR" ]; then
        echo "Source code analysis results:"
        echo "  - Checked for assert_complete() calls in core.rs"
        echo "  - Checked for assert_complete() calls in wrap.rs"
        echo "  - Verified compress.rs has assert_complete() (control)"
        echo
        echo "See test output above for vulnerability detection."
    else
        echo "⚠️  Source files not available - tests skipped"
        echo "   Run ../zkbugs_get_sources.sh to fetch sources"
    fi
else
    echo "❌ Some tests failed (exit code: $TEST_RESULT)"
    exit $TEST_RESULT
fi

echo
echo "For unit tests, run: ./run_unit_tests.sh"
echo "For full documentation, see: README.md"


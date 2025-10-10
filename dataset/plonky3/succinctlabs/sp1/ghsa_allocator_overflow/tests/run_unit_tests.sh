#!/usr/bin/env bash
# Run unit tests for SP1 allocator overflow vulnerability
# No SP1 dependencies required - pure Rust arithmetic tests

set -e

echo "=================================================="
echo "SP1 Allocator Overflow Unit Tests"
echo "=================================================="
echo "Vulnerability: GHSA-6248-228x-mmvh (Bug 2)"
echo "Buggy commit:  ad212dd52bdf8f630ea47f2b58aa94d5b6e79904"
echo "Fix commit:    aa9a8e40b6527a06764ef0347d43ac9307d7bf63"
echo "=================================================="
echo ""

# Compile the test
echo "[1/2] Compiling unit tests..."
rustc --test unit_allocator_overflow.rs -o test_runner 2>&1

if [ $? -ne 0 ]; then
    echo "❌ Compilation failed"
    exit 1
fi

echo "✅ Compilation successful"
echo ""

# Run the tests
echo "[2/2] Running tests..."
./test_runner --test-threads=1

if [ $? -eq 0 ]; then
    echo ""
    echo "=================================================="
    echo "✅ All tests passed!"
    echo "=================================================="
    echo ""
    echo "Summary:"
    echo "  - Demonstrated ptr + capacity wrapping overflow"
    echo "  - Showed memory corruption scenario"
    echo "  - Verified saturating_add fix works correctly"
    echo "  - Created reusable fuzzing oracles"
    echo ""
    echo "These tests prove the vulnerability exists without"
    echo "requiring SP1 SDK, guest programs, or proving!"
else
    echo ""
    echo "❌ Some tests failed"
    exit 1
fi

# Cleanup
rm -f test_runner
echo "Cleaned up test artifacts"


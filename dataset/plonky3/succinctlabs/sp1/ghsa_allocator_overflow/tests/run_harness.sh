#!/usr/bin/env bash
# Run harness test for SP1 allocator overflow
# Tests the actual SP1 code for vulnerable patterns

set -e

echo "=================================================="
echo "SP1 Allocator Overflow Harness Test"
echo "=================================================="
echo "This test validates the vulnerability using actual"
echo "SP1 source code analysis (no full build required)"
echo "=================================================="
echo ""

# Ensure sources are cloned
if [ ! -d "../sources" ]; then
    echo "⚠️  Sources not found. Cloning..."
    cd ..
    ./zkbugs_get_sources.sh
    cd tests
fi

# Compile and run the harness
echo "[1/2] Compiling harness..."
rustc harness_read_vec_overflow.rs -o harness_runner 2>&1

if [ $? -ne 0 ]; then
    echo "❌ Harness compilation failed"
    exit 1
fi

echo "✅ Compilation successful"
echo ""

# Run the harness
echo "[2/2] Running harness tests..."
./harness_runner

echo ""
echo "=================================================="
echo "✅ Harness test completed!"
echo "=================================================="

# Cleanup
rm -f harness_runner


#!/bin/bash
# No compilation required for this bug

echo "=========================================="
echo "No Unit Tests Available"
echo "=========================================="
echo ""
echo "This bug (GHSA-f77q-r5qm-w4m8) has no standalone unit tests."
echo "The vulnerability is in Gnark recursion circuit (Go code)."
echo ""
echo "To inspect the vulnerable code:"
echo "  cd sources/crates/recursion/gnark-ffi/go/sp1/babybear/"
echo "  cat babybear.go  # Check lines 136-156 (invF) and 255-286 (InvE)"
echo ""

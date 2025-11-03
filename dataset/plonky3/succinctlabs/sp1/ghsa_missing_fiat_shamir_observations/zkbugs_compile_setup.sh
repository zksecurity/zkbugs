#!/bin/bash
# No compilation required for this bug

echo "=========================================="
echo "No Unit Tests Available"
echo "=========================================="
echo ""
echo "This bug (GHSA-c873-wfhp-wx5m) has no standalone unit tests."
echo "The vulnerability is in Plonky3 dependency (FRI batching)."
echo ""
echo "To inspect the vulnerable Plonky3 dependency:"
echo "  cd sources/"
echo "  grep -r 'p3-fri\|p3-uni-stark' Cargo.toml"
echo ""
echo "The bug: Individual polynomial evaluation claims were not"
echo "observed into Fiat-Shamir challenger before sampling coefficients."
echo ""

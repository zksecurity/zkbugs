#!/bin/bash
# Setup script: Get sources and check dependencies

set -e

echo "=========================================="
echo "zkBugs Setup: GHSA-c873-wfhp-wx5m"
echo "=========================================="
echo ""

# 1. Get sources
echo "[1/1] Fetching vulnerable sources..."
./zkbugs_get_sources.sh

echo ""
echo "=========================================="
echo "✓ Setup completed successfully!"
echo "=========================================="
echo ""
echo "Note: This bug has no standalone unit tests."
echo "The vulnerability is in Plonky3 FRI batching logic."
echo "See zkbugs_config.json for details."
echo ""

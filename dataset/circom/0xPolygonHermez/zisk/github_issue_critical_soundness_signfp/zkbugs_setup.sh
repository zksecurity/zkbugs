#!/bin/bash
# Setup script: Get sources and check dependencies

set -e

echo "=========================================="
echo "zkBugs Setup: Zisk SignFp Bug"
echo "Bug: github-issue-477"
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
echo "Note: This bug has no reproducible test case."
echo "The vulnerability is in the pil2-proofman dependency (code generation)."
echo "See zkbugs_config.json for details."
echo ""

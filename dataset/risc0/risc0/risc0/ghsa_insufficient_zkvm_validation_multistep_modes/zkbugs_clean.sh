#!/bin/bash
# Clean script: Remove downloaded sources and generated test artifacts

set -e

echo "Cleaning up..."

# 1. Remove downloaded sources
if [ -d "sources" ]; then
    echo "  - Removing sources/ directory..."
    rm -rf sources
fi

echo "✓ Cleanup complete"

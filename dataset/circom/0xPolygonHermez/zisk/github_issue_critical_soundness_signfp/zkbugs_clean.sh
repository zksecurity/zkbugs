#!/bin/bash
# Clean script: Remove downloaded sources

set -e

echo "Cleaning up..."

# Remove downloaded sources
if [ -d "sources" ]; then
    echo "  - Removing sources/ directory..."
    rm -rf sources
fi

echo "✓ Cleanup complete"

#!/bin/bash
set -euo pipefail
source zkbugs_vars.sh

echo "Root path: $ROOT_PATH"

MISSING_TOOLS=()
if ! command -v circom &> /dev/null; then MISSING_TOOLS+=("circom"); fi
if ! command -v snarkjs &> /dev/null; then MISSING_TOOLS+=("snarkjs"); fi

if [ ${#MISSING_TOOLS[@]} -ne 0 ]; then
    echo "The following tools are missing: ${MISSING_TOOLS[*]}"
    echo "Please install them using the script: $ROOT_PATH/scripts/install_circom.sh"
    exit 1
else
    echo "circom and snarkjs are already installed."
fi

if [ -f "$PTAU_FILE" ]; then
    echo "The PTAU file exists at: $PTAU_FILE"
else
    echo "The PTAU file does not exist: $PTAU_FILE"
    exit 1
fi

# Symlink circomlib into the codebase's parent node_modules
CODEBASE_PARENT=$(dirname "$CODEBASE_PATH")
CIRCOMLIB_NODE_MODULES="$CODEBASE_PARENT/node_modules/circomlib/circuits"
if [ ! -L "$CIRCOMLIB_NODE_MODULES" ]; then
    mkdir -p "$(dirname "$CIRCOMLIB_NODE_MODULES")"
    ln -s "$CIRCOMLIB_PATH/circuits" "$CIRCOMLIB_NODE_MODULES"
    echo "Symlinked circomlib into $CODEBASE_PARENT/node_modules/"
else
    echo "circomlib symlink already exists."
fi

echo "Setup is completed."

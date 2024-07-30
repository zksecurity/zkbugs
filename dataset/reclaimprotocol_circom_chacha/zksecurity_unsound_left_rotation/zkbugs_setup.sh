#!/bin/bash

# 1. Get the script path
SCRIPT_PATH=$(realpath "$0")

# 2. Compute the root path by going three directories up
ROOT_PATH=$(dirname "$(dirname "$(dirname "$(dirname "$SCRIPT_PATH")")")")

# 3. Print the root path
echo "Root path: $ROOT_PATH"

# 4. Check if circom and snarkjs are installed
MISSING_TOOLS=()
if ! command -v circom &> /dev/null; then
    MISSING_TOOLS+=("circom")
fi
if ! command -v snarkjs &> /dev/null; then
    MISSING_TOOLS+=("snarkjs")
fi

if [ ${#MISSING_TOOLS[@]} -ne 0 ]; then
    echo "The following tools are missing: ${MISSING_TOOLS[*]}"
    echo "Please install them using the script: $ROOT_PATH/scripts/install_circom.sh"
    exit 1
else
    echo "circom and snarkjs are already installed."
fi

# 5. Check if root_path/misc/circom/bn128_pot12_0001.ptau exists
PTAU_FILE="$ROOT_PATH/misc/circom/bn128_pot12_0001.ptau"
if [ -f "$PTAU_FILE" ]; then
    echo "The PTAU file exists at: $PTAU_FILE"
else
    echo "The PTAU file does not exist."
    echo "Please generate it using the script: $ROOT_PATH/scripts/generate_ptau_snarkjs.sh bn128 12"
fi

# 6. Print that setup is completed
echo "Setup is completed."

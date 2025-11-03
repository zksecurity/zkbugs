#!/bin/bash
source zkbugs_vars.sh

echo "Root path: $ROOT_PATH"

# Check if circom and snarkjs are installed
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

# Check if initial ptau file exists
if [ -f "$PTAU_FILE" ]; then
    echo "The PTAU file exists at: $PTAU_FILE"
else
    echo "The PTAU file does not exist."
    echo "Please generate it using the script: $ROOT_PATH/scripts/generate_ptau_snarkjs.sh bn128 12"
fi

# 6. Print that setup is completed
echo "Setup is completed."

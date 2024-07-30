#!/bin/bash

# 0. Read two params: curve and size
if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <curve> <size>"
    exit 1
fi

CURVE=$1
SIZE=$2

# Check if snarkjs is installed
if ! command -v snarkjs &> /dev/null; then
    echo "snarkjs is not installed. Please install snarkjs with the command: npm -g install snarkjs"
    exit 1
fi

# 1. Get the initial path
INITIAL_PATH=$(pwd)

# 2. Get the file path
SCRIPT_PATH=$(realpath "$0")

# 3. Get the root path (one up from the file path)
ROOT_DIR=$(dirname "$SCRIPT_PATH")
PARENT_DIR=$(dirname "$ROOT_DIR")

# 4. Save to a variable the file path: root/misc/circom/${curve}_pot${size}_0000.ptau
PTAU_PATH="${PARENT_DIR}/misc/circom/${CURVE}_pot${SIZE}_0000.ptau"

# Ensure the directory exists
mkdir -p "${PARENT_DIR}/misc/circom"

# 5. Check if the .ptau file exists. If it exists, exit and say it already exists.
if [ -f "$PTAU_PATH" ]; then
    echo "The file $PTAU_PATH already exists."
else
    snarkjs powersoftau new $CURVE $SIZE $PTAU_PATH -v
fi

# 6. Save to a variable the path root/misc/circom/${curve}_pot${size}_0001.ptau. If this ptau_final file exists, then exit and say it already exists
PTAU_FINAL_PATH="${PARENT_DIR}/misc/circom/${CURVE}_pot${SIZE}_0001.ptau"
if [ -f "$PTAU_FINAL_PATH" ]; then
    echo "The file $PTAU_FINAL_PATH already exists."
    exit 1
fi


# 7. Run the following command
snarkjs powersoftau contribute $PTAU_PATH $PTAU_FINAL_PATH --name="First contribution" -v

# Print the ptau_final path and exit
echo "The final ptau file is located at: $PTAU_FINAL_PATH"

# Return to the initial path
cd "$INITIAL_PATH"

exit 0

#!/bin/bash

# Save the initial path
INITIAL_PATH=$(pwd)

# 1. Save its path in a variable
SCRIPT_PATH=$(realpath "$0")

# 2. Save the path one level above of its path as root directory variable
ROOT_DIR=$(dirname "$SCRIPT_PATH")
PARENT_DIR=$(dirname "$ROOT_DIR")

# 3. Check if cargo exists, if not print a message and exit
if ! command -v cargo &> /dev/null; then
    echo "cargo could not be found, please install cargo and try again."
    exit 1
fi

# 4. Check if circom exists, if it does not then ask user to set a path to install circom
if ! command -v circom &> /dev/null; then
    read -p "circom is not installed. Please provide a path to install circom (default: $HOME): " CIRCOM_INSTALL_DIR
    CIRCOM_INSTALL_DIR=${CIRCOM_INSTALL_DIR:-$HOME}

    # Install circom
    git clone https://github.com/iden3/circom.git "$CIRCOM_INSTALL_DIR/circom"
    cd "$CIRCOM_INSTALL_DIR/circom"
    cargo build --release
    cargo install --path circom
fi

# 5. Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "npm could not be found, please install npm and try again."
    cd "$INITIAL_PATH"
    exit 1
fi

# Check if snarkjs is installed, if not, try to install it
if ! command -v snarkjs &> /dev/null; then
    if ! npm -g install snarkjs; then
        echo "Failed to install snarkjs due to permissions. Please install snarkjs manually with the command: npm -g install snarkjs"
        cd "$INITIAL_PATH"
        exit 1
    fi
fi

# Return to the initial path
cd "$INITIAL_PATH"

echo "Setup complete. Both circom and snarkjs are installed."

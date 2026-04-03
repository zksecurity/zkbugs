#!/bin/bash
set -euo pipefail
source zkbugs_vars.sh

MISSING_TOOLS=()
if ! command -v circom &> /dev/null; then MISSING_TOOLS+=("circom"); fi
if ! command -v snarkjs &> /dev/null; then MISSING_TOOLS+=("snarkjs"); fi
if [ ! -f "$PTAU_FILE" ]; then MISSING_TOOLS+=("PTAU file"); fi

if [ ${#MISSING_TOOLS[@]} -ne 0 ]; then
    echo "The following are missing: ${MISSING_TOOLS[*]}"
    echo "Please ensure they are installed and available."
    exit 1
else
    echo "circom, snarkjs, and the PTAU file are already installed."
fi

# Check if setup has been run (circomlib symlink exists)
CODEBASE_PARENT=$(dirname "$CODEBASE_PATH")
if [ ! -L "$CODEBASE_PARENT/node_modules/circomlib/circuits" ]; then
    echo "Setup has not been run. Please run ./zkbugs_setup.sh first."
    exit 1
fi

echo "Compiling the target circuit: $CIRCOM_CIRCUIT"
circom $CIRCOM_CIRCUIT --O0 --r1cs --wasm --sym -l $CODEBASE_PATH -l $CIRCOMLIB_PATH -l $CIRCOMLIB_PATH/circomlib/circuits -l $CODEBASE_PATH/circuits/node_modules

echo "Phase 2 of the ceremony producing zkey and verification key: ${ZKEY_FINAL}"
snarkjs powersoftau prepare phase2 ${PTAU_FILE} ${PTAU_FINAL} -v
snarkjs groth16 setup $R1CS ${PTAU_FINAL} ${ZKEY_INIT}
echo "zkbugs" | snarkjs zkey contribute ${ZKEY_INIT} ${ZKEY_FINAL} --name="1st Contributor Name" -v
snarkjs zkey export verificationkey ${ZKEY_FINAL} $VKEY

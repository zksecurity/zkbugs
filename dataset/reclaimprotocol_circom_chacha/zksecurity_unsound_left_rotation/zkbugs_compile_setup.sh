#!/bin/bash

# 1. Get the script path
SCRIPT_PATH=$(realpath "$0")

# 2. Compute the root path by going four directories up
ROOT_PATH=$(dirname "$(dirname "$(dirname "$(dirname "$SCRIPT_PATH")")")")

# 3. Define the PTAU file path
PTAU_FILE="$ROOT_PATH/misc/circom/bn128_pot12_0001.ptau"
PTAU_FINAL="final.ptau"
R1CS="circuit.r1cs"
ZKEY_INIT=circuit_0000.zkey
ZKEY_FINAL=circuit_0001.zkey
VKEY=verification_key.json

# 4. Check if circom, snarkjs, and the ptau file exist
MISSING_TOOLS=()
if ! command -v circom &> /dev/null; then
    MISSING_TOOLS+=("circom")
fi
if ! command -v snarkjs &> /dev/null; then
    MISSING_TOOLS+=("snarkjs")
fi
if [ ! -f "$PTAU_FILE" ]; then
    MISSING_TOOLS+=("PTAU file")
fi

if [ ${#MISSING_TOOLS[@]} -ne 0 ]; then
    echo "The following are missing: ${MISSING_TOOLS[*]}"
    echo "Please ensure they are installed and available."
    exit 1
else
    echo "circom, snarkjs, and the PTAU file are already installed."
fi

# 5. Define the target circuit
TARGET="circuits/circuit.circom"

# 6. Print the message to compile the target and then compile it
echo "Compiling the target circuit: $TARGET"
circom $TARGET --O0 --r1cs --wasm --sym

# 7. Print message and then perform phase 2 of the ceremony.
echo "Phase 2 of the ceremony producing zkey and verifiaction key: ${ZKEY_FINAL} ${}"
snarkjs powersoftau prepare phase2 ${PTAU_FILE} ${PTAU_FINAL} -v
snarkjs groth16 setup $R1CS ${PTAU_FINAL} ${ZKEY_INIT}
snarkjs zkey contribute ${ZKEY_INIT} ${ZKEY_FINAL} --name="1st Contributor Name" -v
snarkjs zkey export verificationkey ${ZKEY_FINAL} $VKEY

# Exit
exit 0

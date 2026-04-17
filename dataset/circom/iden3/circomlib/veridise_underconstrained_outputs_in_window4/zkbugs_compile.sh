#!/bin/bash
set -euo pipefail
source zkbugs_vars.sh

if ! command -v circom &> /dev/null; then
    echo "circom is not installed."
    echo "Please install it using the script: $ROOT_PATH/scripts/install_circom.sh"
    exit 1
fi


echo "Compiling the target circuit: $CIRCOM_CIRCUIT"
circom "$CIRCOM_CIRCUIT" --O0 --r1cs --wasm --sym "${CIRCOM_LINK_FLAGS[@]}"

echo "Compilation successful."
echo "  R1CS:  $R1CS"
echo "  WASM:  $CIRCUITWASM"
echo "  SYM:   $TARGET.sym"

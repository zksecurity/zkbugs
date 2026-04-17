#!/bin/bash
SCRIPT_PATH=$(realpath "$0")
BUG_DIR=$(dirname "$SCRIPT_PATH")
ROOT_PATH=$(dirname "$(dirname "$(dirname "$(dirname "$(dirname "$(dirname "$SCRIPT_PATH")")")")")")
CODEBASE_PATH="$ROOT_PATH/dataset/codebases/circom/Arianee/arianee-sdk/b7da01e0c81b9cccdc257040997c3500eb59db4f"
CIRCOMLIB_PATH="$ROOT_PATH/dataset/circom/dependencies/circomlib"
VKEY=verification_key.json

ZKBUGS_MODE=${ZKBUGS_MODE:-original}
CIRCOM_CIRCUIT_ORIGINAL="$CODEBASE_PATH/packages/privacy-circuits/src/circom/creditVerifier/generated/creditVerifier_main.circom"
CIRCOM_CIRCUIT_DIRECT="$BUG_DIR/circuit.circom"

if [ "$ZKBUGS_MODE" = "direct" ]; then
    CIRCOM_CIRCUIT="$CIRCOM_CIRCUIT_DIRECT"
    PTAU_TARGET=bn128_pot16_0001.ptau
    INPUTJSON=direct_input.json
else
    CIRCOM_CIRCUIT="$CIRCOM_CIRCUIT_ORIGINAL"
    PTAU_TARGET=bn128_pot16_0001.ptau
    INPUTJSON=input.json
fi

PTAU_FILE="$ROOT_PATH/misc/circom/$PTAU_TARGET"
PTAU_FINAL="final.ptau"

CIRCOM_LINK_FLAGS=(-l "$CODEBASE_PATH" -l "$CIRCOMLIB_PATH")

TARGET=$(basename "$CIRCOM_CIRCUIT" .circom)
R1CS="$TARGET.r1cs"
ZKEY_INIT=${TARGET}_0000.zkey
ZKEY_FINAL=${TARGET}_0001.zkey
CIRCUITJS=${TARGET}_js
CIRCUITWASM=${CIRCUITJS}/${TARGET}.wasm
WTNS=$CIRCUITJS/witness.wtns

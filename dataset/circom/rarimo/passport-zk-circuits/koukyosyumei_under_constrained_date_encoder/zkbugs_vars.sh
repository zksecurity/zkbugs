#!/bin/bash
SCRIPT_PATH=$(realpath "$0")
BUG_DIR=$(dirname "$SCRIPT_PATH")
ROOT_PATH=$(dirname "$(dirname "$(dirname "$(dirname "$(dirname "$(dirname "$SCRIPT_PATH")")")")")")
CODEBASE_PATH="$ROOT_PATH/dataset/codebases/circom/rarimo/passport-zk-circuits/9143bc77eb2bdbd174eaa61b25b11adb5ee99f61"
CIRCOMLIB_PATH="$ROOT_PATH/dataset/circom/dependencies/circomlib"
VKEY=verification_key.json

# Entrypoints: "original" uses the project's main circuits, "direct" uses the isolated wrapper.
# DateEncoder is a building-block template with no standalone entrypoint in the project,
# so the original mode falls back to the direct wrapper.
ZKBUGS_MODE=${ZKBUGS_MODE:-original}
CIRCOM_CIRCUIT_DIRECT="$BUG_DIR/circuit.circom"
CIRCOM_CIRCUIT_ORIGINAL="$CIRCOM_CIRCUIT_DIRECT"

if [ "$ZKBUGS_MODE" = "direct" ]; then
    CIRCOM_CIRCUIT="$CIRCOM_CIRCUIT_DIRECT"
    PTAU_TARGET=bn128_pot12_0001.ptau
    INPUTJSON=direct_input.json
else
    CIRCOM_CIRCUIT="$CIRCOM_CIRCUIT_ORIGINAL"
    PTAU_TARGET=bn128_pot12_0001.ptau
    INPUTJSON=input.json
fi

PTAU_FILE="$ROOT_PATH/misc/circom/$PTAU_TARGET"
PTAU_FINAL="final.ptau"

TARGET=$(basename "$CIRCOM_CIRCUIT" .circom)
R1CS="$TARGET.r1cs"
ZKEY_INIT=${TARGET}_0000.zkey
ZKEY_FINAL=${TARGET}_0001.zkey
CIRCUITJS=${TARGET}_js
CIRCUITWASM=${CIRCUITJS}/${TARGET}.wasm
WTNS=$CIRCUITJS/witness.wtns

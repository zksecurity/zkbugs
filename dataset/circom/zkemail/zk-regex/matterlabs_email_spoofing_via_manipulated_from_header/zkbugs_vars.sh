#!/bin/bash
SCRIPT_PATH=$(realpath "$0")
BUG_DIR=$(dirname "$SCRIPT_PATH")
ROOT_PATH=$(dirname "$(dirname "$(dirname "$(dirname "$(dirname "$(dirname "$SCRIPT_PATH")")")")")")
CODEBASE_PATH="$ROOT_PATH/dataset/codebases/circom/zkemail/zk-regex/531575345558ba938675d725bd54df45c866ef74"
CIRCOMLIB_PATH="$ROOT_PATH/dataset/circom/dependencies"
VKEY=verification_key.json

# Entrypoints: "original" uses the project's main circuits, "direct" uses the isolated wrapper.
# zk-regex has no ready-made main for EmailAddrWithNameRegex, so original mode falls
# back to the direct wrapper.
ZKBUGS_MODE=${ZKBUGS_MODE:-original}
CIRCOM_CIRCUIT_DIRECT="$BUG_DIR/circuit.circom"
CIRCOM_CIRCUIT_ORIGINAL="$CIRCOM_CIRCUIT_DIRECT"

if [ "$ZKBUGS_MODE" = "direct" ]; then
    CIRCOM_CIRCUIT="$CIRCOM_CIRCUIT_DIRECT"
    PTAU_TARGET=bn128_pot14_0001.ptau
    INPUTJSON=direct_input.json
else
    CIRCOM_CIRCUIT="$CIRCOM_CIRCUIT_ORIGINAL"
    PTAU_TARGET=bn128_pot14_0001.ptau
    INPUTJSON=input.json
fi

PTAU_FILE="$ROOT_PATH/misc/circom/$PTAU_TARGET"
PTAU_FINAL="final.ptau"

CIRCOM_LINK_FLAGS=(-l "$CODEBASE_PATH" -l "$CODEBASE_PATH/node_modules" -l "$CIRCOMLIB_PATH")

TARGET=$(basename "$CIRCOM_CIRCUIT" .circom)
R1CS="$TARGET.r1cs"
ZKEY_INIT=${TARGET}_0000.zkey
ZKEY_FINAL=${TARGET}_0001.zkey
CIRCUITJS=${TARGET}_js
CIRCUITWASM=${CIRCUITJS}/${TARGET}.wasm
WTNS=$CIRCUITJS/witness.wtns

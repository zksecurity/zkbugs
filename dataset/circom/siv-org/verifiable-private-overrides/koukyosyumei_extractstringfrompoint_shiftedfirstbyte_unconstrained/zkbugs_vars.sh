#!/bin/bash
SCRIPT_PATH=$(realpath "$0")
BUG_DIR=$(dirname "$SCRIPT_PATH")
ROOT_PATH=$(dirname "$(dirname "$(dirname "$(dirname "$(dirname "$(dirname "$SCRIPT_PATH")")")")")")
CODEBASE_PATH="$ROOT_PATH/dataset/codebases/circom/siv-org/verifiable-private-overrides/7bda2311d7a33dcab611cfea0c67707b0b65c24c"
# Project uses `include "comparators.circom"` (circomkit node_modules-style).
# Point the include path at the circomlib `circuits/` subdir so that resolves
# directly via `-l $CIRCOMLIB_PATH` — matches what circomkit's
# `./node_modules/circomlib/circuits` include does in the upstream build.
CIRCOMLIB_PATH="$ROOT_PATH/dataset/circom/dependencies/circomlib/circuits"
VKEY=verification_key.json

# Entrypoints: "original" uses the project's main circuits, "direct" uses the isolated wrapper.
ZKBUGS_MODE=${ZKBUGS_MODE:-original}
CIRCOM_CIRCUIT_DIRECT="$BUG_DIR/circuit.circom"
CIRCOM_CIRCUIT_ORIGINAL="$CODEBASE_PATH/circuits/generated/extract_string_from_point_main.circom"

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

CIRCOM_LINK_FLAGS=(-l "$CODEBASE_PATH" -l "$CIRCOMLIB_PATH")

TARGET=$(basename "$CIRCOM_CIRCUIT" .circom)
R1CS="$TARGET.r1cs"
ZKEY_INIT=${TARGET}_0000.zkey
ZKEY_FINAL=${TARGET}_0001.zkey
CIRCUITJS=${TARGET}_js
CIRCUITWASM=${CIRCUITJS}/${TARGET}.wasm
WTNS=$CIRCUITJS/witness.wtns

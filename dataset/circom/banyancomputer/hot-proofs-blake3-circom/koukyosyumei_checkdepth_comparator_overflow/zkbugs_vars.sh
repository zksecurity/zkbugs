#!/bin/bash
SCRIPT_PATH=$(realpath "$0")
BUG_DIR=$(dirname "$SCRIPT_PATH")
ROOT_PATH=$(dirname "$(dirname "$(dirname "$(dirname "$(dirname "$(dirname "$SCRIPT_PATH")")")")")")
CODEBASE_PATH="$ROOT_PATH/dataset/codebases/circom/banyancomputer/hot-proofs-blake3-circom/76b83107eb00c8f886bde82172eaa3cdd5d57f25"
CIRCOMLIB_PATH="$ROOT_PATH/dataset/circom/dependencies/circomlib"
VKEY=verification_key.json

# Entrypoints: "original" uses the project's main circuits, "direct" uses the isolated wrapper.
# download_sources.sh symlinks $CIRCOMLIB_DEP to $CODEBASE_PATH/circomlib so
# `include "circomlib/circuits/…"` resolves via the existing `-l $CODEBASE_PATH` flag,
# and drops a thin entrypoint at circuits/main/check_depth_main.circom that
# instantiates Blake3NovaTreePath_CheckDepth via the real circuits/blake3_nova.circom.
ZKBUGS_MODE=${ZKBUGS_MODE:-original}
CIRCOM_CIRCUIT_DIRECT="$BUG_DIR/circuit.circom"
CIRCOM_CIRCUIT_ORIGINAL="$CODEBASE_PATH/circuits/main/check_depth_main.circom"

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

#!/bin/bash
SCRIPT_PATH=$(realpath "$0")
ROOT_PATH=$(dirname "$(dirname "$(dirname "$(dirname "$(dirname "$(dirname "$SCRIPT_PATH")")")")")")
PTAU_TARGET=bn128_pot12_0001.ptau
PTAU_FILE="$ROOT_PATH/misc/circom/$PTAU_TARGET"
PTAU_FINAL="final.ptau"
TARGET=circuit
R1CS="$TARGET.r1cs"
ZKEY_INIT=${TARGET}_0000.zkey
ZKEY_FINAL=${TARGET}_0001.zkey
VKEY=verification_key.json
CIRCOM_CIRCUIT="circuits/$TARGET.circom"
CIRCUITJS=${TARGET}_js
CIRCUITWASM=${CIRCUITJS}/${TARGET}.wasm
INPUTJSON=input.json
WTNS=$CIRCUITJS/witness.wtns
EXPLOITABLE_WTNS=exploitable_witness.json
CIRCOM_RUNTIME=${ROOT_PATH}/misc/circom_runtime

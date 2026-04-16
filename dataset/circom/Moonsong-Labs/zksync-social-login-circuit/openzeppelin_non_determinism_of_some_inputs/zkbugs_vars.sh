#!/bin/bash
SCRIPT_PATH=$(realpath "$0")
BUG_DIR=$(dirname "$SCRIPT_PATH")
ROOT_PATH=$(dirname "$(dirname "$(dirname "$(dirname "$(dirname "$(dirname "$SCRIPT_PATH")")")")")")
CODEBASE_PATH="$ROOT_PATH/dataset/codebases/circom/Moonsong-Labs/zksync-social-login-circuit/27cda6e74492fbad4aa3ca37ff5084ed391b534b"
CIRCOMLIB_PATH="$ROOT_PATH/dataset/circom/dependencies/circomlib"
VKEY=verification_key.json

ZKBUGS_MODE=${ZKBUGS_MODE:-original}
# No original entrypoint: JwtTxValidation requires a fully-generated RSA/SHA input set
# that is not part of the report. Both modes map to the direct wrapper for ExtractNonce.
CIRCOM_CIRCUIT_DIRECT="$BUG_DIR/circuit.circom"
CIRCOM_CIRCUIT_ORIGINAL="$CIRCOM_CIRCUIT_DIRECT"

if [ "$ZKBUGS_MODE" = "direct" ]; then
    CIRCOM_CIRCUIT="$CIRCOM_CIRCUIT_DIRECT"
    PTAU_TARGET=bn128_pot17_0001.ptau
    INPUTJSON=direct_input.json
else
    CIRCOM_CIRCUIT="$CIRCOM_CIRCUIT_ORIGINAL"
    PTAU_TARGET=bn128_pot17_0001.ptau
    INPUTJSON=direct_input.json
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

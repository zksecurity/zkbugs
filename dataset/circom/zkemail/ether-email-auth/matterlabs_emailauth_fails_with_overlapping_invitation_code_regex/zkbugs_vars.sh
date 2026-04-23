#!/bin/bash
SCRIPT_PATH=$(realpath "$0")
BUG_DIR=$(dirname "$SCRIPT_PATH")
ROOT_PATH=$(dirname "$(dirname "$(dirname "$(dirname "$(dirname "$(dirname "$SCRIPT_PATH")")")")")")
CODEBASE_PATH="$ROOT_PATH/dataset/codebases/circom/zkemail/ether-email-auth/8a62db1e676aedbb20a403be95fffebef12b97e4"
CIRCOMLIB_PATH="$ROOT_PATH/dataset/circom/dependencies"
VKEY=verification_key.json

# Entrypoints: "original" uses the project's main circuits, "direct" uses the isolated wrapper.
# The project's published main is `packages/circuits/src/email_auth.circom` — the bug
# is about the overlap between InvitationCodeWithPrefixRegex / EmailAddrRegex /
# InvitationCodeRegex inside EmailAuth, so the real context matters. Needs
# @zk-email/circuits@6.1.5 (installed by download_sources.sh). 3.09M non-linear
# constraints, so pot22. Positive test stays direct-only (no RSA/SHA input set).
ZKBUGS_MODE=${ZKBUGS_MODE:-original}
CIRCOM_CIRCUIT_DIRECT="$BUG_DIR/circuit.circom"
CIRCOM_CIRCUIT_ORIGINAL="$CODEBASE_PATH/packages/circuits/src/email_auth.circom"

if [ "$ZKBUGS_MODE" = "direct" ]; then
    CIRCOM_CIRCUIT="$CIRCOM_CIRCUIT_DIRECT"
    PTAU_TARGET=bn128_pot14_0001.ptau
    INPUTJSON=direct_input.json
else
    CIRCOM_CIRCUIT="$CIRCOM_CIRCUIT_ORIGINAL"
    PTAU_TARGET=powersOfTau28_hez_final_22.ptau
    INPUTJSON=direct_input.json
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

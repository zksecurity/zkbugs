#!/bin/bash
set -euo pipefail
source zkbugs_vars.sh

echo "Computing witness"
node $CIRCUITJS/generate_witness.js $CIRCUITWASM $INPUTJSON $WTNS

echo "Producing proof"
snarkjs groth16 prove $ZKEY_FINAL $WTNS proof.json public.json

echo "Verifying proof"
snarkjs groth16 verify $VKEY public.json proof.json

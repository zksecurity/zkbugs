#!/bin/bash

# Set the variables
CIRCUITJS=circuit_js
CIRCUITWASM=$CIRCUITJS/circuit.wasm
INPUTJSON=input.json
WTNS=$CIRCUITJS/witness.wtns
ZKEY_FINAL=circuit_0001.zkey
VKEY=verification_key.json

# Print message for computing witness
echo "Computing witness"

# Run the command to compute the witness
node $CIRCUITJS/generate_witness.js $CIRCUITWASM $INPUTJSON $WTNS

# Print message for producing proof
echo "Producing proof"

# Run the command to produce the proof
snarkjs groth16 prove $ZKEY_FINAL $WTNS proof.json public.json

# Print message for verifying proof
echo "Verifying proof"

# Run the command to verify the proof
snarkjs groth16 verify $VKEY public.json proof.json

# Exit
exit 0

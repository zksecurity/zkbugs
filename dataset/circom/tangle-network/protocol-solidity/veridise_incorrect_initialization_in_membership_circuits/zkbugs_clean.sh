#!/bin/bash
set -euo pipefail

# Clean all possible build artifacts
rm -rf *.sym *_0001.zkey *.r1cs *_0000.zkey *_js \
    final.ptau proof.json verification_key.json public.json

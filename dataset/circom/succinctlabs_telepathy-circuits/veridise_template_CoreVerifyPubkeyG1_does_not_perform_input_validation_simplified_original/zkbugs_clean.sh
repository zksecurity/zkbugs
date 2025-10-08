#!/bin/bash
source zkbugs_vars.sh

rm -rf ${TARGET}.sym ${TARGET}_0001.zkey ${TARGET}.r1cs ${TARGET}_0000.zkey ${TARGET}_js \
    final.ptau proof.json verification_key.json detect.sage.py witness.json \
    ${TARGET}.json public.json

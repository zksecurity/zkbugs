pragma circom 2.1.9;

include "../../../../dependencies/circomlib/circuits/bitify.circom";

template BigIntIsZero(CHUNK_SIZE, MAX_CHUNK_SIZE, CHUNK_NUMBER) {
    assert(CHUNK_NUMBER >= 2);

    var EPSILON = 3;

    assert(MAX_CHUNK_SIZE + EPSILON <= 253);

    signal input in[CHUNK_NUMBER];

    signal carry[CHUNK_NUMBER];
    for (var i = 0; i < CHUNK_NUMBER - 1; i++){
        if (i == 0){
            carry[i] <== in[i] / 2 ** CHUNK_SIZE;
        }
        else {
            carry[i] <== (in[i] + carry[i - 1]) / 2 ** CHUNK_SIZE;
        }
    }
    component carryRangeCheck = Num2Bits(MAX_CHUNK_SIZE + EPSILON - CHUNK_SIZE);
    carryRangeCheck.in <== carry[CHUNK_NUMBER - 2] + (1 << (MAX_CHUNK_SIZE + EPSILON - CHUNK_SIZE - 1));
    in[CHUNK_NUMBER - 1] + carry[CHUNK_NUMBER - 2] === 0;
}
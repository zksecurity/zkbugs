pragma circom 2.0.5;

include "./sha256/sha256.circom";

/*
 * Helper functions for computing sha256 commitments that take as input and 
 * output bytes instead of bits.
 */

template Sha256Bytes(n) {
    signal input in[n];
    signal output out[32];

    component byteToBits[n];
    for (var i = 0; i < n; i++) {
        byteToBits[i] = Num2Bits(8);
        byteToBits[i].in <== in[i];
    }

    component sha256 = Sha256(n*8);
    for (var i = 0; i < n; i++) {
        for (var j = 0; j < 8; j++) {
            sha256.in[i*8+j] <== byteToBits[i].out[7-j];
        }
    }

    component bitsToBytes[32];
    for (var i = 0; i < 32; i++) {
        bitsToBytes[i] = Bits2Num(8);
        for (var j = 0; j < 8; j++) {
            bitsToBytes[i].in[7-j] <== sha256.out[i*8+j];
        }
        out[i] <== bitsToBytes[i].out;
    }
}


template Sha256BytesOutputBits(n) {
    signal input in[n];
    signal output out[256];

    component byteToBits[n];
    for (var i = 0; i < n; i++) {
        byteToBits[i] = Num2Bits(8);
        byteToBits[i].in <== in[i];
    }

    component sha256 = Sha256(n*8);
    for (var i = 0; i < n; i++) {
        for (var j = 0; j < 8; j++) {
            sha256.in[i*8+j] <== byteToBits[i].out[7-j];
        }
    }

    for (var i = 0; i < 256; i++) {
        out[i] <== sha256.out[i];
    }
}
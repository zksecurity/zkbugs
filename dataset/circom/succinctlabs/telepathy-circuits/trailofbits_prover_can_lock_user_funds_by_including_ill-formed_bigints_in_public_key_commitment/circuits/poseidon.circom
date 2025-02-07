pragma circom 2.0.3;

include "../../node_modules/circomlib/circuits/poseidon.circom";

/*
 * Helper functions for computing Poseidon commitments to the sync committee's
 * validator public keys (inside UpdateNextSyncCommittee()).
 */

template PoseidonG1Array(LENGTH, N, K) {
    signal input pubkeys[LENGTH][2][K];
    signal output out;

    component hasher = PoseidonFieldArray(LENGTH * 2 * K);
    for (var i = 0; i < LENGTH; i++) {
        for (var j = 0; j < K; j++) {
            for (var l = 0; l < 2; l++) {
                hasher.in[(i * K * 2) + (j * 2) + l] <== pubkeys[i][l][j];
            }
        }
    }
    out <== hasher.out;
}

template PoseidonFieldArray(LENGTH) {
    signal input in[LENGTH];
    signal output out;

    var POSEIDON_SIZE = 15;
    var NUM_HASHERS = (LENGTH \ POSEIDON_SIZE) + 1;
    component hashers[NUM_HASHERS];

    for (var i = 0; i < NUM_HASHERS; i++) {
        if (i > 0) {
            POSEIDON_SIZE = 16;
        }
        hashers[i] = Poseidon(POSEIDON_SIZE);
        for (var j = 0; j < 15; j++) {
            if (i * 15 + j >= LENGTH ) {
                hashers[i].inputs[j] <== 0;
            } else {
                hashers[i].inputs[j] <== in[i*15 + j];
            }
        }
        if (i > 0) {
            hashers[i].inputs[15] <== hashers[i- 1].out;
        }
    }

    out <== hashers[NUM_HASHERS-1].out;
}
pragma circom 2.0.5;

include "./sha256.circom";

/*
 * Inside the EVM, you pay around 6000 gas for each public input into a zkSNARK. 
 * To get around this, we instead pass in a commitment, computed inside the
 * smart contract, to all public inputs for a given circuit. Thus, N public
 * inputs only requires 6000 gas instead of N*6000 gas. This file implements 
 * functions that compute these commitments for LightClientStep() and
 * UpdateNextSyncCommittee(). We also truncate SHA256 commitments to 
 * TRUNCATED_SHA256_SIZE so that the commitment fits in a single field element.
 */

template SerializeLightClientStepInputs(TRUNCATED_SHA256_SIZE) {
    signal input finalizedSlot[32];
    signal input finalizedHeaderRoot[32];
    signal input participation;
    signal input executionStateRoot[32];
    signal input syncCommitteePoseidon;
    signal output out[TRUNCATED_SHA256_SIZE];

    /* h = sha256(finalizedSlot, finalizedHeaderRoot) */
    component sha0 = Sha256Bytes(64);
    for (var i = 0; i < 32; i++) {
        sha0.in[i] <== finalizedSlot[i];
        sha0.in[32+i] <== finalizedHeaderRoot[i];
    }

    /* participationLE = toLittleEndian(participation) */
    component bitify0 = Num2Bits_strict();
    bitify0.in <== participation;
    component byteify0[32];
    for (var i = 0; i < 32; i++) {
        byteify0[i] = Bits2Num(8);
        for (var j = 0; j < 8; j++) {
            if (i*8+j < TRUNCATED_SHA256_SIZE) {
                byteify0[i].in[j] <== bitify0.out[i*8+j];
            } else {
                byteify0[i].in[j] <== 0;
            }
        }
    }

    /* h = sha256(h, participationLE) */
    component sha1 = Sha256Bytes(64);
    for (var i = 0; i < 32; i++) {
        sha1.in[i] <== sha0.out[i];
        sha1.in[32+i] <== byteify0[i].out;
    }

    /* h = sha256(h, executionStateRoot) */
    component sha2 = Sha256Bytes(64);
    for (var i = 0; i < 32; i++) {
        sha2.in[i] <== sha1.out[i];
        sha2.in[32+i] <== executionStateRoot[i];
    }

    /* syncCommitteePoseidonLE = toLittleEndian(syncCommitteePoseidon) */
    component bitify1 = Num2Bits_strict();
    bitify1.in <== syncCommitteePoseidon;
    component byteify1[32];
    for (var i = 0; i < 32; i++) {
        byteify1[i] = Bits2Num(8);
        for (var j = 0; j < 8; j++) {
            if (i*8+j < 254) {
                byteify1[i].in[j] <== bitify1.out[i*8+j];
            } else {
                byteify1[i].in[j] <== 0;
            }
        }
    }

    /* h = sha256(h, syncCommitteePoseidonLE) */
    component sha3 = Sha256Bytes(64);
    for (var i = 0; i < 32; i++) {
        sha3.in[i] <== sha2.out[i];
        sha3.in[32+i] <== byteify1[i].out;
    }

    /* out = toBinary(h & (1 << TRUNCATED_SHA256_SIZE - 1)) */
    component bitifiers[32];
    for (var i = 0; i < 32; i++) {
        bitifiers[i] = Num2Bits(8);
        bitifiers[i].in <== sha3.out[i];
    }
    signal bits[256];
    for (var i = 0; i < 32; i++) {
        for (var j = 0; j < 8; j++) {
            bits[i*8+j] <== bitifiers[i].out[j];
        }
    }
    for (var i = 0; i < TRUNCATED_SHA256_SIZE; i++) {
        out[i] <== bits[i];
    }
}


template SerializeUpdateNextSyncCommitteeInputs(TRUNCATED_SHA256_SIZE) {
    signal input syncCommitteeSSZ[32];
    signal output out[TRUNCATED_SHA256_SIZE];

    component sha0 = Sha256Bytes(64);
    for (var i = 0; i < 32; i++) {
        sha0.in[i] <== syncCommitteeSSZ[i];
        sha0.in[32+i] <== 0;
   }

    component bitifiers[32];
    for (var i = 0; i < 32; i++) {
        bitifiers[i] = Num2Bits(8);
        bitifiers[i].in <== sha0.out[i];
    }

    signal bits[256];
    for (var i = 0; i < 32; i++) {
        for (var j = 0; j < 8; j++) {
            bits[i*8+j] <== bitifiers[i].out[j];
        }
    }

    for (var i = 0; i < TRUNCATED_SHA256_SIZE; i++) {
        out[i] <== bits[i];
    }
}
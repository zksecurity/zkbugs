pragma circom 2.0.0;

include "../../../../dependencies/circomlib/circuits/bitify.circom";
include "../../../../dependencies/circomlib/circuits/comparators.circom";
include "../../../../dependencies/circomlib/circuits/poseidon.circom";

template EpochKeyLite(EPOCH_KEY_NONCE_PER_EPOCH) {
    signal input identity_secret;

    signal input reveal_nonce;
    signal input attester_id;
    signal input epoch;
    signal input nonce;

    signal input sig_data;

    signal output control;
    signal output epoch_key;

    /**
     * Control structure
     * 8 bits nonce
     * 64 bits epoch
     * 160 bits attester_id
     * 1 bit reveal nonce
     **/

    // check that reveal_nonce is 0 or 1
    reveal_nonce * (reveal_nonce - 1) === 0;

    // then range check the others

    component attester_id_bits = Num2Bits(254);
    attester_id_bits.in <== attester_id;
    for (var x = 160; x < 254; x++) {
        attester_id_bits.out[x] === 0;
    }

    component epoch_bits = Num2Bits(254);
    epoch_bits.in <== epoch;
    for (var x = 64; x < 254; x++) {
        epoch_bits.out[x] === 0;
    }

    component nonce_lt = LessThan(8);
    nonce_lt.in[0] <== nonce;
    nonce_lt.in[1] <== EPOCH_KEY_NONCE_PER_EPOCH;
    nonce_lt.out === 1;

    control <== reveal_nonce * 2**232 + attester_id * 2**72 + epoch * 2**8 + reveal_nonce * nonce;

    component epoch_key_hasher = Poseidon(4);
    epoch_key_hasher.inputs[0] <== identity_secret;
    epoch_key_hasher.inputs[1] <== attester_id;
    epoch_key_hasher.inputs[2] <== epoch;
    epoch_key_hasher.inputs[3] <== nonce;

    epoch_key <== epoch_key_hasher.out;
}

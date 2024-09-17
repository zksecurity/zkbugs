pragma circom 2.0.0;
include "../../../../dependencies/circomlib/circuits/poseidon.circom";

template SpendingPubKey() {
    signal input pubkey_x;
    signal input pubkey_y;
    signal input nullifier_seed;
    signal output out;

    component hash = Poseidon(3);   // Constant
    hash.inputs[0] <== pubkey_x;
    hash.inputs[1] <== pubkey_y;
    hash.inputs[2] <== nullifier_seed;
    hash.out ==> out;
}

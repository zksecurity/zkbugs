pragma circom 2.0.0;
include "../../../../dependencies/circomlib/circuits/poseidon.circom";

template Nullifier() {
    signal input nullifier_seed;
    signal input leaf_index;
    signal output out;

    component hash = Poseidon(2);   // Constant
    hash.inputs[0] <== nullifier_seed;
    hash.inputs[1] <== leaf_index;
    hash.out ==> out;
}

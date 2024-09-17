pragma circom 2.0.0;
include "../../../../dependencies/circomlib/circuits/poseidon.circom";

template NoteHash() {
    signal input spending_pubkey;
    signal input salt;
    signal input asset_hash;
    signal output out;

    component hash = Poseidon(3);
    hash.inputs[0] <== spending_pubkey;
    hash.inputs[1] <== salt;
    hash.inputs[2] <== asset_hash;
    hash.out ==> out;
}

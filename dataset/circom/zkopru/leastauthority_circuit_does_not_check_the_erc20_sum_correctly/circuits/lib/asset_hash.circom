pragma circom 2.0.0;
include "../../../../dependencies/circomlib/circuits/poseidon.circom";

template AssetHash() {
    signal input eth;
    signal input token_addr;
    signal input erc20;
    signal input erc721;
    signal output out;

    component hash = Poseidon(4);
    hash.inputs[0] <== eth;
    hash.inputs[1] <== token_addr;
    hash.inputs[2] <== erc20;
    hash.inputs[3] <== erc721;
    hash.out ==> out;
}

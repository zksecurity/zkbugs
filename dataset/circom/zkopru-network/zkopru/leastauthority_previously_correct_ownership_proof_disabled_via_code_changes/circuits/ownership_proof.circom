pragma circom 2.0.0;

include "../../../../dependencies/circomlib/circuits/eddsaposeidon.circom";

template OwnershipProof() {
    // Signal definitions
    /** Private inputs */
    signal input note;
    signal input pub_key[2];
    signal input sig[3];
    signal output out; // @audit To suppress "snarkJS: Error: Scalar size does not match"

    component eddsa = EdDSAPoseidonVerifier();
    eddsa.enabled <== 0;
    eddsa.M <== note;
    eddsa.Ax <== pub_key[0];
    eddsa.Ay <== pub_key[1];
    eddsa.R8x <== sig[0];
    eddsa.R8y <== sig[1];
    eddsa.S <== sig[2];
}

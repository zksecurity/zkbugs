pragma circom 2.0.0;

include "../../../../dependencies/circomlib/circuits/bitify.circom";

/// Source: https://github.com/iden3/circuits/blob/7a1e04de3e5f3a9f0cfb27a43c9f41c986c1b9ed/circuits/lib/utils/claimUtils.circom#L115-L137
// getClaimRevNonce gets the revocation nonce out of a claim outputing it as an integer.
template getClaimRevNonce() {
    signal input claim[8];

    signal output revNonce;

    component claimRevNonce = Bits2Num(64);

    component v0Bits = Num2Bits(254);
    v0Bits.in <== claim[4];
    for (var i=0; i<64; i++) {
        claimRevNonce.in[i] <== v0Bits.out[i];
    }
    revNonce <== claimRevNonce.out;

    // explicitly state that some of these signals are not used and it's ok
    for (var i=0; i<8; i++) {
        _ <== claim[i];
    }
    for (var i=0; i<254; i++) {
        _ <== v0Bits.out[i];
    }
}

component main = getClaimRevNonce();

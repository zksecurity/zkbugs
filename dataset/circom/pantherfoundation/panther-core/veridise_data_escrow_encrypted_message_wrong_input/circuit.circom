pragma circom 2.1.9;

include "circuits/circuits/templates/utils.circom";
include "circuits/circuits/templates/dataEscrowElGamalEncryption.circom";

// Direct entrypoint for V-PAN-VUL-021. DataEscrowElGamalEncryption writes
// `encryptedMessage[j][0] <== drv_mGrY[j].xout` for the padding segment when
// it should use `drv_mGrY_final[j].xout` — leaving the hiding point out of
// the ciphertext. The wrapper converts plain public inputs to the tagged
// types expected by the template (sub_order_bj_sf, uint64, sub_order_bj_p).
template Wrapper(paddingSize, scalarSize, pointSize) {
    signal input ephemeralRandom;
    signal input scalarMessage[scalarSize];
    signal input pointMessage[pointSize][2];
    signal input pubKey[2];

    var ACTIVE = Active();
    component erTag = BabyJubJubSubOrderTag(ACTIVE);
    erTag.in <== ephemeralRandom;

    component smTag[scalarSize];
    for (var i = 0; i < scalarSize; i++) {
        smTag[i] = Uint64Tag(ACTIVE);
        smTag[i].in <== scalarMessage[i];
    }

    component pkTag = BabyJubJubSubGroupPointTag(ACTIVE);
    pkTag.in[0] <== pubKey[0];
    pkTag.in[1] <== pubKey[1];

    component enc = DataEscrowElGamalEncryption(paddingSize, scalarSize, pointSize);
    enc.ephemeralRandom <== erTag.out;
    for (var i = 0; i < scalarSize; i++) {
        enc.scalarMessage[i] <== smTag[i].out;
    }
    for (var i = 0; i < pointSize; i++) {
        enc.pointMessage[i][0] <== pointMessage[i][0];
        enc.pointMessage[i][1] <== pointMessage[i][1];
    }
    enc.pubKey[0] <== pkTag.out[0];
    enc.pubKey[1] <== pkTag.out[1];
}

component main {public [ephemeralRandom, scalarMessage, pointMessage, pubKey]} = Wrapper(1, 1, 1);

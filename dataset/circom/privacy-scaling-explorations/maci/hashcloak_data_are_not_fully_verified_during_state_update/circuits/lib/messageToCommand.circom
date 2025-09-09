pragma circom 2.0.0;
include "./ecdh.circom";
include "./unpackElement.circom";
include "../../../../../dependencies/circomlib/circuits/bitify.circom";
include "../../../../../dependencies/circomlib/circuits/poseidon.circom";
include "./poseidon-cipher/poseidon_cipher.circom";

template MessageToCommand() {
    var MSG_LENGTH = 7;
    var PACKED_CMD_LENGTH = 4;
    var UNPACKED_CMD_LENGTH = 8;

    signal input message[11];
    signal input encPrivKey;
    signal input encPubKey[2];

    signal output stateIndex;
    signal output newPubKey[2];
    signal output voteOptionIndex;
    signal output newVoteWeight;
    signal output nonce;
    signal output pollId;
    signal output salt;
    signal output sigR8[2];
    signal output sigS;
    signal output packedCommandOut[PACKED_CMD_LENGTH];

    component ecdh = Ecdh();
    ecdh.privKey <== encPrivKey;
    ecdh.pubKey[0] <== encPubKey[0];
    ecdh.pubKey[1] <== encPubKey[1];

    // @audit code is here: https://github.com/privacy-scaling-explorations/zk-kit.circom/blob/326cef9fdb9a2f845b890cffea0594975768be1f/packages/poseidon-cipher/src/poseidon-cipher.circom#L64
    component decryptor = PoseidonDecryptWithoutCheck(MSG_LENGTH);
    decryptor.key[0] <== ecdh.sharedKey[0];
    decryptor.key[1] <== ecdh.sharedKey[1];
    decryptor.nonce <== 0;
    for (var i = 1; i < 11; i++) { // the first one is msg type, skip
        decryptor.ciphertext[i-1] <== message[i];
    }

    signal packedCommand[PACKED_CMD_LENGTH];
    for (var i = 0; i < PACKED_CMD_LENGTH; i ++) {
        packedCommand[i] <== decryptor.decrypted[i];
    }

    component unpack = UnpackElement(5);
    unpack.in <== packedCommand[0];

    stateIndex <== unpack.out[4];
    voteOptionIndex <== unpack.out[3];
    newVoteWeight <== unpack.out[2];
    nonce <== unpack.out[1];
    pollId <== unpack.out[0];

    newPubKey[0] <== packedCommand[1];
    newPubKey[1] <== packedCommand[2];
    salt <== packedCommand[3];

    sigR8[0] <== decryptor.decrypted[4];
    sigR8[1] <== decryptor.decrypted[5];
    sigS <== decryptor.decrypted[6];

    for (var i = 0; i < PACKED_CMD_LENGTH; i ++) {
        packedCommandOut[i] <== packedCommand[i];
    }
}

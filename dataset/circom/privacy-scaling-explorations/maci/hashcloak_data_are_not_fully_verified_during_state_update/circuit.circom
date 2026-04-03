pragma circom 2.0.0;
include "./poseidon-cipher/poseidon_cipher.circom";
include "circuits/circom/processMessages.circom";
component main {public [inputHash]} = ProcessMessages(10, 2, 1, 2);

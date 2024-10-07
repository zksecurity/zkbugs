pragma circom 2.0.5;

include "./bls.circom";
component main {public [pubkeys, bits]} = G1AddMany(4, 2, 55, 7);
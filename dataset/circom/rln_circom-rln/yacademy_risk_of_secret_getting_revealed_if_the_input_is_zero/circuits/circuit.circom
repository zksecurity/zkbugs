pragma circom 2.1.0;

include "./rln.circom";

component main { public [x, externalNullifier] } = RLN(20, 16);

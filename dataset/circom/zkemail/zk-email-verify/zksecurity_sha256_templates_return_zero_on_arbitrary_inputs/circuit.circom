pragma circom 2.1.6;

include "packages/circuits/lib/sha.circom";

component main { public [paddedIn, paddedInLength] } = Sha256Bytes(64);

pragma circom 2.1.8;

include "packages/privacy-circuits/src/circom/ownershipVerifier/ownershipVerifier.circom";

component main { public [pubCommitmentHash, pubIntentHash, pubNonce] } = OwnershipVerifier();

pragma circom 2.1.8;

include "packages/privacy-circuits/src/circom/creditVerifier/creditVerifier.circom";

component main { public [pubRoot, pubCreditType, pubNullifierHash] } = CreditVerifier(3);

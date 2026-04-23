pragma circom 2.1.6;

// Wraps ExtractNonce, which forwards the user-controlled `nonceLength` input to
// zkemail's RevealSubstring. RevealSubstring uses LessThan(log2Ceil(maxSubstringLength + 1))
// on `nonceLength` without first range-checking `nonceLength` itself, so a malicious
// prover can choose a `nonceLength` outside [0, maxNonceLength] and still satisfy
// the constraints (possibly producing a nonce with leading or trailing zeros).
include "utils/fields.circom";

component main = ExtractNonce(1024, 44);

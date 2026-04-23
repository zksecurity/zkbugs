pragma circom 2.1.9;

// Direct entrypoint for V-PAN-VUL-019. TrustProvidersKyt uses BinaryTag(ACTIVE)
// to wrap `kytDepositSignedMessageHash * (1 - isZeroDeposit.out)` which is
// non-binary when the hash is non-zero — causing the BinaryTag to fail and
// blocking legitimate swap proofs. The template is too large to reconstruct
// inputs for in isolation, so the original mainZSwapV1.circom entrypoint is
// used for verification.
include "circuits/circuits/mainZSwapV1.circom";

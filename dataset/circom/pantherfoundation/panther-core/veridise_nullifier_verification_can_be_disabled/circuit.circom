pragma circom 2.1.9;

// Direct entrypoint for V-PAN-VUL-004. The vulnerability is in the
// ZSwapV1 template which uses ForceEqualIfEnabled() with
// `.enabled <== zAccountUtxoInSpendPrivKey` — setting the private key to 0
// disables the nullifier verification entirely. The full ZSwapV1 circuit is
// too large to reconstruct inputs for in isolation, so the original
// mainZSwapV1.circom entrypoint is used for verification.
include "circuits/circuits/mainZSwapV1.circom";

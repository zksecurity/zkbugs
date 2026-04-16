pragma circom 2.1.9;

// Direct entrypoint for V-PAN-VUL-002. The vulnerability lives in the
// zAccountRenewalV1 template itself and depends on how nullifiers are
// computed from `zAccountUtxoInNullifierPrivKey`. Because no constraint
// ties `zAccountUtxoInNullifierPubKey[2]` to be derived from
// `zAccountUtxoInNullifierPrivKey`, multiple private keys can hash to valid
// (pubkey, commitment) pairs and produce distinct nullifiers. The full
// zAccountRenewalV1 circuit is too large to reconstruct inputs for in
// isolation, so the original mainZAccountRenewalV1.circom entrypoint is
// used for verification.
include "circuits/circuits/mainZAccountRenewalV1.circom";

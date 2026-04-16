pragma circom 2.1.0;

include "circomlib/circuits/poseidon.circom";

// Isolated wrapper around the vulnerable `Withdraw` template from
// circuits/withdraw.circom. `addressHash` is declared as a public input but
// is never used inside any constraint — the circuit only proves knowledge of
// the Poseidon pre-image of `identityCommitment`. Any holder of
// `identitySecret` (including the slashee) can therefore construct a valid
// `Withdraw` proof for an arbitrary `addressHash` and front-run the slasher.
template Withdraw() {
    signal input identitySecret;
    signal input addressHash;

    signal output identityCommitment <== Poseidon(1)([identitySecret]);
}

component main { public [addressHash] } = Withdraw();

pragma circom 2.1.9;

// utils.circom is required first so BinaryTag/ACTIVE are in scope for the
// zAccountBlackListLeafInclusionProver template body (which uses them
// without including utils.circom directly).
include "circuits/circuits/templates/utils.circom";
include "circuits/circuits/templates/zAccountBlackListLeafInclusionProver.circom";

// Direct entrypoint for V-PAN-VUL-009. The ZAccountBlackListLeafInclusionProver
// builds a 254-bit leaf, so blacklist states encoded as bit vectors with high
// bits set (e.g. 2^253 + 2^252 + 2^251) exceed the BN254 scalar-field prime
// and cannot be represented — making it impossible to blacklist certain
// zAccountIds. Wrapper template strips the {uint24} tag from zAccountId so
// the main component can expose it as an untagged public input.
template Wrapper(depth) {
    signal input zAccountId;
    signal input leaf;
    signal input merkleRoot;
    signal input pathElements[depth];

    component tagged = Uint24Tag(Active());
    tagged.in <== zAccountId;

    component checker = ZAccountBlackListLeafInclusionProver(depth);
    checker.zAccountId <== tagged.out;
    checker.leaf <== leaf;
    checker.merkleRoot <== merkleRoot;
    for (var i = 0; i < depth; i++) {
        checker.pathElements[i] <== pathElements[i];
    }
}

component main {public [zAccountId, leaf, merkleRoot]} = Wrapper(16);

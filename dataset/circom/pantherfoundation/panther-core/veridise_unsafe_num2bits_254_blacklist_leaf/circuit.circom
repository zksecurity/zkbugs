pragma circom 2.1.9;

// utils.circom is required first so BinaryTag/ACTIVE are in scope for the
// zAccountBlackListLeafInclusionProver template body (which uses them
// without including utils.circom directly).
include "circuits/circuits/templates/utils.circom";
include "circuits/circuits/templates/zAccountBlackListLeafInclusionProver.circom";

// Direct entrypoint for V-PAN-VUL-010. ZAccountBlackListLeafInclusionProver uses
// Num2Bits(254) on the blacklist leaf. Because Num2Bits is non-deterministic
// when n >= 254 (two different bit decompositions of the same field element
// exist), an attacker can choose a bit layout that marks their zAccountId as
// unbanned even if the leaf actually encodes a ban. The wrapper template
// strips the {uint24} tag from zAccountId so the main component can expose it
// as an untagged public input.
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

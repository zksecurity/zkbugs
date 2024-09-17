pragma circom 2.0.0;
include "../../../../dependencies/circomlib/circuits/poseidon.circom";
include "../../../../dependencies/circomlib/circuits/bitify.circom";
include "../../../../dependencies/circomlib/circuits/mux1.circom";

template BranchNode() {
    signal input left;
    signal input right;
    signal output parent;

    component hasher = Poseidon(2);   // Constant
    hasher.inputs[0] <== left;
    hasher.inputs[1] <== right;

    parent <== hasher.out;
}

template InclusionProof(depth) {
    // Signal definitions
    /** Public inputs */
    signal input root;
    /** Private inputs */
    signal input leaf;
    signal input path;
    signal input siblings[depth];

    component path_bits = Num2Bits(depth);
    path_bits.in <== path;

    // Constraint definition
    signal nodes[depth + 1];
    component branch_nodes[depth];
    nodes[0] <== leaf;
    component left[depth];
    component right[depth];
    for (var level = 0; level < depth; level++) {
        branch_nodes[level] = BranchNode();
        // If the bitified path_bits is 0, the branch node has a left sibling
        left[level] = Mux1();
        left[level].c[0] <== nodes[level];
        left[level].c[1] <== siblings[level];
        left[level].s <== path_bits.out[level];
        right[level] = Mux1();
        right[level].c[0] <== siblings[level];
        right[level].c[1] <== nodes[level];
        right[level].s <== path_bits.out[level];

        branch_nodes[level].left <== left[level].out;
        branch_nodes[level].right <== right[level].out;
        nodes[level+1] <== branch_nodes[level].parent;
    }
    nodes[depth] === root;
}

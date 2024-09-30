const { IncrementalMerkleTree } = require("@zk-kit/incremental-merkle-tree");
const poseidon = require("poseidon-lite");
const ffjavascript = require("ffjavascript");

const MERKLE_TREE_DEPTH = 20;
const MERKLE_TREE_ZERO_VALUE = BigInt(0);
const SNARK_FIELD_SIZE = BigInt('21888242871839275222246405745257275088548364400416034343698204186575808495617');
const F = new ffjavascript.ZqField(SNARK_FIELD_SIZE);

function genFieldElement() {
    return F.random();
}

function calculateLeaf(identitySecret, userMessageLimit) {
    const identityCommitment = poseidon([identitySecret]);
    const rateCommitment = poseidon([identityCommitment, userMessageLimit]);
    return rateCommitment;
}

function genMerkleProof(elements, leafIndex) {
    const tree = new IncrementalMerkleTree(poseidon, MERKLE_TREE_DEPTH, MERKLE_TREE_ZERO_VALUE, 2);
    for (let i = 0; i < elements.length; i++) {
        tree.insert(elements[i]);
    }
    const merkleProof = tree.createProof(leafIndex);
    merkleProof.siblings = merkleProof.siblings.map((s) => s[0]);
    return merkleProof;
}

function generateInput() {
    // Public inputs
    const x = BigInt(0); // This is the exploit, x = 0 makes y = identitySecret, leaking secret
    const externalNullifier = genFieldElement();

    // Private inputs
    const identitySecret = genFieldElement();
    const userMessageLimit = BigInt(10);
    const messageId = userMessageLimit - BigInt(1);

    const leaf = calculateLeaf(identitySecret, userMessageLimit);
    const merkleProof = genMerkleProof([leaf], 0);

    const input = {
        // Private inputs
        identitySecret: identitySecret.toString(),
        userMessageLimit: userMessageLimit.toString(),
        messageId: messageId.toString(),
        pathElements: merkleProof.siblings.map(e => e.toString()),
        identityPathIndex: merkleProof.pathIndices,

        // Public inputs
        x: x.toString(),
        externalNullifier: externalNullifier.toString()
    };

    return input;
}

const input = generateInput();
console.log(JSON.stringify(input, null, 2));

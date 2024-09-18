const { MaciState } = require('maci-core')
const { PrivKey, Keypair, PCommand, VerifyingKey } = require('maci-domainobjs')
const { hash5, G1Point, G2Point, stringifyBigInts } = require('maci-crypto')

// Trick from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt#use_within_json
BigInt.prototype.toJSON = function () {
    return { $bigint: this.toString() };
};

function generateInput() {
    const stateTreeDepth = 10;
    const messageTreeDepth = 2;
    const messageTreeSubDepth = 1;
    const voteOptionTreeDepth = 2;

    const voiceCreditBalance = BigInt(100);
    const duration = 30;
    const maxValues = {
        maxUsers: 25,
        maxMessages: 25,
        maxVoteOptions: 25,
    };

    const treeDepths = {
        intStateTreeDepth: stateTreeDepth,
        messageTreeDepth: messageTreeDepth,
        messageTreeSubDepth: messageTreeSubDepth,
        voteOptionTreeDepth: voteOptionTreeDepth,
    };

    const messageBatchSize = 5;

    const testProcessVk = new VerifyingKey(
        new G1Point(BigInt(0), BigInt(1)),
        new G2Point([BigInt(0), BigInt(0)], [BigInt(1), BigInt(1)]),
        new G2Point([BigInt(3), BigInt(0)], [BigInt(1), BigInt(1)]),
        new G2Point([BigInt(4), BigInt(0)], [BigInt(1), BigInt(1)]),
        [
            new G1Point(BigInt(5), BigInt(1)),
            new G1Point(BigInt(6), BigInt(1)),
        ],
    );

    const testTallyVk = new VerifyingKey(
        new G1Point(BigInt(2), BigInt(3)),
        new G2Point([BigInt(3), BigInt(0)], [BigInt(3), BigInt(1)]),
        new G2Point([BigInt(4), BigInt(0)], [BigInt(3), BigInt(1)]),
        new G2Point([BigInt(5), BigInt(0)], [BigInt(4), BigInt(1)]),
        [
            new G1Point(BigInt(6), BigInt(1)),
            new G1Point(BigInt(7), BigInt(1)),
        ],
    );

    const coordinatorKeypair = new Keypair();

    const maciState = new MaciState(stateTreeDepth);

    const userKeypair = new Keypair(new PrivKey(BigInt(1)));
    const stateIndex = maciState.signUp(
        userKeypair.pubKey,
        voiceCreditBalance,
        BigInt(1)
    );

    maciState.stateAq.mergeSubRoots(0)
    maciState.stateAq.merge(stateTreeDepth)

    const pollId = maciState.deployPoll(
        duration,
        BigInt(2 + duration),
        maxValues,
        treeDepths,
        messageBatchSize,
        coordinatorKeypair,
        testProcessVk,
        testTallyVk,
    )

    const poll = maciState.polls[pollId];

    // Publish two messages
    // First command
    const command = new PCommand(
        stateIndex,
        userKeypair.pubKey,
        BigInt(0), // voteOptionIndex
        BigInt(9), // voteWeight
        BigInt(2), // nonce
        BigInt(pollId)
    );

    const signature = command.sign(userKeypair.privKey);

    const ecdhKeypair = new Keypair();
    const sharedKey = Keypair.genEcdhSharedKey(
        ecdhKeypair.privKey,
        coordinatorKeypair.pubKey
    );
    const message = command.encrypt(signature, sharedKey);
    poll.publishMessage(message, ecdhKeypair.pubKey);

    // Second command
    const command2 = new PCommand(
        stateIndex,
        userKeypair.pubKey,
        BigInt(0), // voteOptionIndex
        BigInt(1), // voteWeight
        BigInt(1), // nonce
        BigInt(pollId)
    );
    const signature2 = command2.sign(userKeypair.privKey);

    const ecdhKeypair2 = new Keypair();
    const sharedKey2 = Keypair.genEcdhSharedKey(
        ecdhKeypair2.privKey,
        coordinatorKeypair.pubKey,
    );
    const message2 = command2.encrypt(signature2, sharedKey2);
    poll.publishMessage(message2, ecdhKeypair2.pubKey);

    poll.messageAq.mergeSubRoots(0);
    poll.messageAq.merge(messageTreeDepth);

    const generatedInputs = poll.processMessages();

    // Pack small values
    generatedInputs.packedVals = MaciState.packProcessMessageSmallVals(
        generatedInputs.maxVoteOptions,
        generatedInputs.numSignUps,
        BigInt(0), // batchStartIndex
        BigInt(2)  // batchEndIndex (2 messages)
    );

    // Calculate inputHash
    const coordPubKeyHash = hash5([
        poll.coordinatorKeypair.pubKey[0],
        poll.coordinatorKeypair.pubKey[1],
        BigInt(0), BigInt(0), BigInt(0)
    ]);

    generatedInputs.inputHash = hash5([
        generatedInputs.packedVals,
        coordPubKeyHash,
        generatedInputs.msgRoot,
        generatedInputs.currentSbCommitment,
        generatedInputs.newSbCommitment
    ]);

    return stringifyBigInts(generatedInputs);
}

const input = generateInput();
console.log(JSON.stringify(input, null, 2));
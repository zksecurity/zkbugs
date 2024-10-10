// JavaScript version of the ProcessMessages input generator
// This script generates inputs for the ProcessMessages circuit with parameters:
// stateTreeDepth = 10
// msgTreeDepth = 2
// msgBatchDepth = 1
// voteOptionTreeDepth = 2

const path = require('path');
const fs = require('fs');

const {
    MaciState,
    STATE_TREE_DEPTH,
} = require('maci-core');

const {
    PrivKey,
    Keypair,
    PCommand,
    Message,
    VerifyingKey,
    Ballot,
} = require('maci-domainobjs');

const {
    hash5,
    IncrementalQuinTree,
    stringifyBigInts,
} = require('maci-crypto');

// Set parameters according to the circuit template
const stateTreeDepth = 10;
const msgTreeDepth = 2;
const msgBatchDepth = 1;
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
    messageTreeDepth: msgTreeDepth,
    messageTreeSubDepth: msgBatchDepth,
    voteOptionTreeDepth: voteOptionTreeDepth,
};

const messageBatchSize = 5; // Since TREE_ARITY is 5

const testProcessVk = new VerifyingKey(
    null, null, null, null, null
);
const testTallyVk = new VerifyingKey(
    null, null, null, null, null
);

const coordinatorKeypair = new Keypair();

(async () => {
    const maciState = new MaciState();

    // Sign up a user
    const userKeypair = new Keypair(new PrivKey(BigInt(1)));
    const stateIndex = maciState.signUp(
        userKeypair.pubKey,
        voiceCreditBalance,
        BigInt(Math.floor(Date.now() / 1000)),
    );

    maciState.stateAq.mergeSubRoots(0);
    maciState.stateAq.merge(treeDepths.intStateTreeDepth);

    const pollId = maciState.deployPoll(
        duration,
        BigInt(Math.floor(Date.now() / 1000) + duration),
        maxValues,
        treeDepths,
        messageBatchSize,
        coordinatorKeypair,
        testProcessVk,
        testTallyVk,
    );

    const poll = maciState.polls[pollId];

    // Initialize message tree
    const messageTree = new IncrementalQuinTree(
        treeDepths.messageTreeDepth,
        poll.messageAq.zeroValue,
        5,
        hash5,
    );

    // Create commands and messages
    const messages = [];
    const commands = [];
    const numMessages = 2; // Number of messages less than batch size

    for (let i = 0; i < numMessages; i++) {
        const nonce = BigInt(numMessages - i); // Nonce decreases with each message
        const command = new PCommand(
            stateIndex,
            userKeypair.pubKey,
            BigInt(0),           // voteOptionIndex
            BigInt(1),           // voteWeight
            nonce,               // nonce
            BigInt(pollId),      // pollId
        );

        const signature = command.sign(userKeypair.privKey);

        const ecdhKeypair = new Keypair();
        const sharedKey = Keypair.genEcdhSharedKey(
            ecdhKeypair.privKey,
            coordinatorKeypair.pubKey,
        );
        const message = command.encrypt(signature, sharedKey);
        messages.push(message);
        commands.push(command);
        messageTree.insert(message.hash(ecdhKeypair.pubKey));
        poll.publishMessage(message, ecdhKeypair.pubKey);
    }

    // Pad messages array to match batch size
    while (messages.length < messageBatchSize) {
        // Create an empty message
        const emptyMessage = new Message(
            BigInt(0),
            [BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0)]
        );
        messages.push(emptyMessage);
    }

    poll.messageAq.mergeSubRoots(0);
    poll.messageAq.merge(treeDepths.messageTreeDepth);

    const generatedInputs = poll.processMessages();
    console.log(JSON.stringify(generatedInputs, null, 2));
})();

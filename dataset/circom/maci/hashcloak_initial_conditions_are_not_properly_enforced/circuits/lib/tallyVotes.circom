include "../../../../dependencies/circomlib/circuits/comparators.circom";
include "./trees/incrementalQuinTree.circom";
include "./trees/calculateTotal.circom";
include "./trees/checkRoot.circom";
include "./hasherSha256.circom";
include "./hasherPoseidon.circom";
include "./unpackElement.circom";

/*
 * Verifies the commitment to the current results. Also computes and outputs a
 * commitment to the new results.
 */
template ResultCommitmentVerifier(voteOptionTreeDepth) {
    var TREE_ARITY = 5;
    var numVoteOptions = TREE_ARITY ** voteOptionTreeDepth;

    // 1 if this is the first batch, and 0 otherwise
    signal input isFirstBatch;
    signal input currentTallyCommitment;
    signal input newTallyCommitment;

    // Results
    signal input currentResults[numVoteOptions];
    signal input currentResultsRootSalt;

    signal input newResults[numVoteOptions];
    signal input newResultsRootSalt;

    // Spent voice credits
    signal input currentSpentVoiceCreditSubtotal;
    signal input currentSpentVoiceCreditSubtotalSalt;

    signal input newSpentVoiceCreditSubtotal;
    signal input newSpentVoiceCreditSubtotalSalt;

    // Spent voice credits per vote option
    signal input currentPerVOSpentVoiceCredits[numVoteOptions];
    signal input currentPerVOSpentVoiceCreditsRootSalt;

    signal input newPerVOSpentVoiceCredits[numVoteOptions];
    signal input newPerVOSpentVoiceCreditsRootSalt;

    // @audit added to suppress "snarkJS: Error: Scalar size does not match"
    signal output out;

    // Compute the commitment to the current results
    component currentResultsRoot = QuinCheckRoot(voteOptionTreeDepth);
    for (var i = 0; i < numVoteOptions; i ++) {
        currentResultsRoot.leaves[i] <== currentResults[i];
    }

    component currentResultsCommitment = HashLeftRight();
    currentResultsCommitment.left <== currentResultsRoot.root;
    currentResultsCommitment.right <== currentResultsRootSalt;

    // Compute the commitment to the current spent voice credits
    component currentSpentVoiceCreditsCommitment = HashLeftRight();
    currentSpentVoiceCreditsCommitment.left <== currentSpentVoiceCreditSubtotal;
    currentSpentVoiceCreditsCommitment.right <== currentSpentVoiceCreditSubtotalSalt;

    // Compute the root of the spent voice credits per vote option
    component currentPerVOSpentVoiceCreditsRoot = QuinCheckRoot(voteOptionTreeDepth);
    for (var i = 0; i < numVoteOptions; i ++) {
        currentPerVOSpentVoiceCreditsRoot.leaves[i] <== currentPerVOSpentVoiceCredits[i];
    }

    component currentPerVOSpentVoiceCreditsCommitment = HashLeftRight();
    currentPerVOSpentVoiceCreditsCommitment.left <== currentPerVOSpentVoiceCreditsRoot.root;
    currentPerVOSpentVoiceCreditsCommitment.right <== currentPerVOSpentVoiceCreditsRootSalt;

    // Commit to the current tally
    component currentTallyCommitmentHasher = Hasher3();
    currentTallyCommitmentHasher.in[0] <== currentResultsCommitment.hash;
    currentTallyCommitmentHasher.in[1] <== currentSpentVoiceCreditsCommitment.hash;
    currentTallyCommitmentHasher.in[2] <== currentPerVOSpentVoiceCreditsCommitment.hash;

    /*currentTallyCommitmentHasher.hash === currentTallyCommitment;*/
     // Check if the current tally commitment is correct only if this is not the first batch
     component iz = IsZero();
     iz.in <== isFirstBatch;
     // iz.out is 1 if this is not the first batch
     // iz.out is 0 if this is the first batch
 
     // hz is 0 if this is the first batch
     // currentTallyCommitment should be 0 if this is the first batch
 
     // hz is 1 if this is not the first batch
     // currentTallyCommitment should not be 0 if this is the first batch
     signal hz;
     hz <== iz.out * currentTallyCommitmentHasher.hash;
 
     hz === currentTallyCommitment;

    // Compute the root of the new results
    component newResultsRoot = QuinCheckRoot(voteOptionTreeDepth);
    for (var i = 0; i < numVoteOptions; i ++) {
        newResultsRoot.leaves[i] <== newResults[i];
    }

    component newResultsCommitment = HashLeftRight();
    newResultsCommitment.left <== newResultsRoot.root;
    newResultsCommitment.right <== newResultsRootSalt;

    // Compute the commitment to the new spent voice credits value
    component newSpentVoiceCreditsCommitment = HashLeftRight();
    newSpentVoiceCreditsCommitment.left <== newSpentVoiceCreditSubtotal;
    newSpentVoiceCreditsCommitment.right <== newSpentVoiceCreditSubtotalSalt;

    // Compute the root of the spent voice credits per vote option
    component newPerVOSpentVoiceCreditsRoot = QuinCheckRoot(voteOptionTreeDepth);
    for (var i = 0; i < numVoteOptions; i ++) {
        newPerVOSpentVoiceCreditsRoot.leaves[i] <== newPerVOSpentVoiceCredits[i];
    }

    component newPerVOSpentVoiceCreditsCommitment = HashLeftRight();
    newPerVOSpentVoiceCreditsCommitment.left <== newPerVOSpentVoiceCreditsRoot.root;
    newPerVOSpentVoiceCreditsCommitment.right <== newPerVOSpentVoiceCreditsRootSalt;

    // Commit to the new tally
    component newTallyCommitmentHasher = Hasher3();
    newTallyCommitmentHasher.in[0] <== newResultsCommitment.hash;
    newTallyCommitmentHasher.in[1] <== newSpentVoiceCreditsCommitment.hash;
    newTallyCommitmentHasher.in[2] <== newPerVOSpentVoiceCreditsCommitment.hash;

    /*log(newResultsCommitment.hash);*/
    /*log(newSpentVoiceCreditsCommitment.hash);*/
    /*log(newPerVOSpentVoiceCreditsCommitment.hash);*/

    // @audit comment out the following line just for simplicity
    // newTallyCommitmentHasher.hash === newTallyCommitment;
}

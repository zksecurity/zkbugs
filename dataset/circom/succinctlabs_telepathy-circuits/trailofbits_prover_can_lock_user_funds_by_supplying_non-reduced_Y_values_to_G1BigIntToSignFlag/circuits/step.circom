/*
 _____         _                       _     _           
|_   _|  ___  | |  ___   _ __   __ _  | |_  | |_    _  _ 
  | |   / -_) | | / -_) | '_ \ / _` | |  _| | ' \  | || |
  |_|   \___| |_| \___| | .__/ \__,_|  \__| |_||_|  \_, |
                        |_|                         |__/ 

Created on October 28th 2022 by Succinct Labs
Code: https://github.com/succinctlabs/telepathy
License: GPL-3
*/

pragma circom 2.0.5;

include "./inputs.circom";
include "./bls.circom";
include "./constants.circom";
include "./poseidon.circom";
include "./ssz.circom";
include "./sync_committee.circom";

/*
 * Reduces the gas cost of processing a light client update by offloading the 
 * verification of the aggregated BLS signature by the sync committee and 
 * various merkle proofs (e.g., finality) into a zkSNARK which can be verified
 * on-chain for ~200K gas. This circuit is called by step() in the light client.
 *
 * @input  attestedHeader         The header attested by the sync committee
 * @input  finalizedHeader        The finalized header inside attested header
 * @input  pubkeys                Public keys of the sync committee
 * @input  aggregationBits        Bitmap indicating which validators have signed
 * @input  signature              An aggregated signature over signingRoot
 * @input  domain                 sha256(forkVersion, genesisValidatorsRoot)
 * @input  signingRoot            sha256(attestedHeaderRoot, domain)
 * @input  participation          sum(aggregationBits)
 * @input  syncCommitteePoseidon  A commitment to the sync committee pubkeys
 * @input  finalityBranch         A Merkle proof for finalizedHeader
 * @input  executionStateRoot     The eth1 state root inside finalizedHeader
 * @input  executionStateBranch   A Merkle proof for executionStateRoot
 * @input  publicInputsRoot       A commitment to all "public inputs"
 */
template Step() {
    var N = getNumBitsPerRegister();
    var K = getNumRegisters();
    var SYNC_COMMITTEE_SIZE = getSyncCommitteeSize();
    var LOG_2_SYNC_COMMITTEE_SIZE = getLog2SyncCommitteeSize();
    var FINALIZED_HEADER_DEPTH = getFinalizedHeaderDepth();
    var FINALIZED_HEADER_INDEX = getFinalizedHeaderIndex();
    var EXECUTION_STATE_ROOT_DEPTH = getExecutionStateRootDepth();
    var EXECUTION_STATE_ROOT_INDEX = getExecutionStateRootIndex();
    var TRUNCATED_SHA256_SIZE = getTruncatedSha256Size();

    /* Attested Header */
    signal input attestedHeaderRoot[32];
    signal input attestedSlot[32];
    signal input attestedProposerIndex[32];
    signal input attestedParentRoot[32];
    signal input attestedStateRoot[32];
    signal input attestedBodyRoot[32];

    /* Finalized Header */
    signal input finalizedHeaderRoot[32];
    signal input finalizedSlot[32];
    signal input finalizedProposerIndex[32];
    signal input finalizedParentRoot[32];
    signal input finalizedStateRoot[32];
    signal input finalizedBodyRoot[32];

    /* Sync Committee Protocol */
    signal input pubkeysX[SYNC_COMMITTEE_SIZE][K];
    signal input pubkeysY[SYNC_COMMITTEE_SIZE][K];
    signal input aggregationBits[SYNC_COMMITTEE_SIZE];
    signal input signature[2][2][K];
    signal input domain[32];
    signal input signingRoot[32];
    signal input participation;
    signal input syncCommitteePoseidon;

    /* Finality Proof */
    signal input finalityBranch[FINALIZED_HEADER_DEPTH][32];

    /* Execution State Proof */
    signal input executionStateRoot[32];
    signal input executionStateBranch[EXECUTION_STATE_ROOT_DEPTH][32];

    /* Commitment to Public Inputs */
    signal input publicInputsRoot;

    /* REDUCE CALLDATA COSTS VIA THE PUBLIC INPUTS ROOT */
    component serializeInputs = SerializeLightClientStepInputs(
        TRUNCATED_SHA256_SIZE
    );
    for (var i = 0; i < 32; i++) {
        serializeInputs.finalizedSlot[i] <== finalizedSlot[i];
        serializeInputs.finalizedHeaderRoot[i] <== finalizedHeaderRoot[i];
        serializeInputs.executionStateRoot[i] <== executionStateRoot[i];
    }
    serializeInputs.participation <== participation;
    serializeInputs.syncCommitteePoseidon <== syncCommitteePoseidon;

    component bitifyPublicInputsRoot = Num2Bits(TRUNCATED_SHA256_SIZE);
    bitifyPublicInputsRoot.in <== publicInputsRoot;
    for (var i = 0; i < TRUNCATED_SHA256_SIZE; i++) {
        bitifyPublicInputsRoot.out[i] === serializeInputs.out[i];
    }

    /* VALIDATE BEACON CHAIN DATA AGAINST SIGNING ROOT */
    component sszAttestedHeader = SSZPhase0BeaconBlockHeader();
    component sszFinalizedHeader = SSZPhase0BeaconBlockHeader();
    component sszSigningRoot = SSZPhase0SigningRoot();
    for (var i = 0; i < 32; i++) {
        sszAttestedHeader.slot[i] <== attestedSlot[i];
        sszAttestedHeader.proposerIndex[i] <== attestedProposerIndex[i];
        sszAttestedHeader.parentRoot[i] <== attestedParentRoot[i];
        sszAttestedHeader.stateRoot[i] <== attestedStateRoot[i];
        sszAttestedHeader.bodyRoot[i] <== attestedBodyRoot[i];

        sszFinalizedHeader.slot[i] <== finalizedSlot[i];
        sszFinalizedHeader.proposerIndex[i] <== finalizedProposerIndex[i];
        sszFinalizedHeader.parentRoot[i] <== finalizedParentRoot[i];
        sszFinalizedHeader.stateRoot[i] <== finalizedStateRoot[i];
        sszFinalizedHeader.bodyRoot[i] <== finalizedBodyRoot[i];

        sszSigningRoot.headerRoot[i] <== attestedHeaderRoot[i];
        sszSigningRoot.domain[i] <== domain[i];
    }
    for (var i = 0; i < 32; i++) {
        sszAttestedHeader.out[i] === attestedHeaderRoot[i];
        sszFinalizedHeader.out[i] === finalizedHeaderRoot[i];
        sszSigningRoot.out[i] === signingRoot[i];
    }
    
    /* VERIFY SYNC COMMITTEE SIGNATURE AND COMPUTE PARTICIPATION */
    component verifySignature = VerifySyncCommitteeSignature(
        SYNC_COMMITTEE_SIZE,
        LOG_2_SYNC_COMMITTEE_SIZE,
        N,
        K
    );
    for (var i = 0; i < SYNC_COMMITTEE_SIZE; i++) {
        verifySignature.aggregationBits[i] <== aggregationBits[i];
        for (var j = 0; j < K; j++) {
            verifySignature.pubkeys[i][0][j] <== pubkeysX[i][j];
            verifySignature.pubkeys[i][1][j] <== pubkeysY[i][j];
        }
    }
    for (var i = 0; i < 2; i++) {
        for (var j = 0; j < 2; j++) {
            for (var l = 0; l < K; l++) {
                verifySignature.signature[i][j][l] <== signature[i][j][l];
            }
        }
    }
    for (var i = 0; i < 32; i++) {
        verifySignature.signingRoot[i] <== signingRoot[i];
    }
    verifySignature.syncCommitteeRoot <== syncCommitteePoseidon;
    verifySignature.participation === participation;
   
    /* VERIFY FINALITY PROOF */
    component verifyFinality = SSZRestoreMerkleRoot(
        FINALIZED_HEADER_DEPTH,
        FINALIZED_HEADER_INDEX
    );
    for (var i = 0; i < 32; i++) {
        verifyFinality.leaf[i] <== finalizedHeaderRoot[i];
        for (var j = 0; j < FINALIZED_HEADER_DEPTH; j++) {
            verifyFinality.branch[j][i] <== finalityBranch[j][i];
        }
    }
    for (var i = 0; i < 32; i++) {
        verifyFinality.out[i] === attestedStateRoot[i];
    }

    /* VERIFY EXECUTION STATE PROOF */
    component verifyExecutionState = SSZRestoreMerkleRoot(
        EXECUTION_STATE_ROOT_DEPTH,
        EXECUTION_STATE_ROOT_INDEX
    );
    for (var i = 0; i < 32; i++) {
        verifyExecutionState.leaf[i] <== executionStateRoot[i];
        for (var j = 0; j < EXECUTION_STATE_ROOT_DEPTH; j++) {
            verifyExecutionState.branch[j][i] <== executionStateBranch[j][i];
        }
    }
    for (var i = 0; i < 32; i++) {
        verifyExecutionState.out[i] === finalizedBodyRoot[i];
    }
}

component main {public [publicInputsRoot]} = Step();

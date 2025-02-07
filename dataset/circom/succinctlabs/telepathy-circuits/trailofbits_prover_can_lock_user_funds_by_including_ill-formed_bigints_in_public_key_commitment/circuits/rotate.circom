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
 * Maps the SSZ commitment of the sync committee's pubkeys to a SNARK friendly
 * one using the Poseidon hash function. This is done once every sync committee
 * period to reduce the number of constraints (~70M) in the Step circuit. Called by rotate()
 * in the light client.
 *
 * @input  pubkeyBytes             The sync committee pubkeys in bytes
 * @input  aggregatePubkeyBytes    The aggregate sync committee pubkey in bytes
 * @input  pubkeysBigInt           The sync committee pubkeys in bigint
 * @input  aggregatePubkeyBigInt   The aggregate sync committee pubkey in bigint
 * @output syncCommitteeSSZ        A SSZ commitment to the sync committee
 * @output syncCommitteePoseidon   A Poseidon commitment ot the sync committee
 */
template Rotate() {
    var N = getNumBitsPerRegister();
    var K = getNumRegisters();
    var SYNC_COMMITTEE_SIZE = getSyncCommitteeSize();
    var LOG_2_SYNC_COMMITTEE_SIZE = getLog2SyncCommitteeSize();
    var SYNC_COMMITTEE_DEPTH = getSyncCommitteeDepth();
    var SYNC_COMMITTEE_INDEX = getSyncCommitteeIndex();
    var G1_POINT_SIZE = getG1PointSize();

    /* Sync Commmittee */
    signal input pubkeysBytes[SYNC_COMMITTEE_SIZE][G1_POINT_SIZE];
    signal input aggregatePubkeyBytesX[G1_POINT_SIZE];
    signal input pubkeysBigIntX[SYNC_COMMITTEE_SIZE][K];
    signal input pubkeysBigIntY[SYNC_COMMITTEE_SIZE][K];
    signal input syncCommitteeSSZ[32];
    signal input syncCommitteeBranch[SYNC_COMMITTEE_DEPTH][32];
    signal input syncCommitteePoseidon;

    /* Finalized Header */
    signal input finalizedHeaderRoot[32];
    signal input finalizedSlot[32];
    signal input finalizedProposerIndex[32];
    signal input finalizedParentRoot[32];
    signal input finalizedStateRoot[32];
    signal input finalizedBodyRoot[32];

    /* VALIDATE FINALIZED HEADER AGAINST FINALIZED HEADER ROOT */
    component sszFinalizedHeader = SSZPhase0BeaconBlockHeader();
    for (var i = 0; i < 32; i++) {
        sszFinalizedHeader.slot[i] <== finalizedSlot[i];
        sszFinalizedHeader.proposerIndex[i] <== finalizedProposerIndex[i];
        sszFinalizedHeader.parentRoot[i] <== finalizedParentRoot[i];
        sszFinalizedHeader.stateRoot[i] <== finalizedStateRoot[i];
        sszFinalizedHeader.bodyRoot[i] <== finalizedBodyRoot[i];
    }
    for (var i = 0; i < 32; i++) {
        sszFinalizedHeader.out[i] === finalizedHeaderRoot[i];
    }

    /* CHECK SYNC COMMITTEE SSZ PROOF */
    component verifySyncCommittee = SSZRestoreMerkleRoot(
        SYNC_COMMITTEE_DEPTH,
        SYNC_COMMITTEE_INDEX
    );
    for (var i = 0; i < 32; i++) {
        verifySyncCommittee.leaf[i] <== syncCommitteeSSZ[i];
        for (var j = 0; j < SYNC_COMMITTEE_DEPTH; j++) {
            verifySyncCommittee.branch[j][i] <== syncCommitteeBranch[j][i];
        }
    }
    for (var i = 0; i < 32; i++) {
        verifySyncCommittee.out[i] === finalizedStateRoot[i];
    }

    /* VERIFY BYTE AND BIG INT REPRESENTATION OF G1 POINTS MATCH */
    component g1BytesToBigInt[SYNC_COMMITTEE_SIZE];
    for (var i = 0; i < SYNC_COMMITTEE_SIZE; i++) {
        g1BytesToBigInt[i] = G1BytesToBigInt(N, K, G1_POINT_SIZE);
        for (var j = 0; j < 48; j++) {
            g1BytesToBigInt[i].in[j] <== pubkeysBytes[i][j];
        }
        for (var j = 0; j < K; j++) {
            g1BytesToBigInt[i].out[j] === pubkeysBigIntX[i][j];
        }
    }

    /* VERIFY THAT THE WITNESSED Y-COORDINATES MAKE THE PUBKEYS LAY ON THE CURVE */
    component isValidPoint[SYNC_COMMITTEE_SIZE];
    for (var i = 0; i < SYNC_COMMITTEE_SIZE; i++) {
        isValidPoint[i] = SubgroupCheckG1WithValidX(N, K);
        for (var j = 0; j < K; j++) {
            isValidPoint[i].in[0][j] <== pubkeysBigIntX[i][j];
            isValidPoint[i].in[1][j] <== pubkeysBigIntY[i][j];
        }
    }

    /* VERIFY THAT THE WITNESSESED Y-COORDINATE HAS THE CORRECT SIGN */
    component bytesToSignFlag[SYNC_COMMITTEE_SIZE];
    component bigIntToSignFlag[SYNC_COMMITTEE_SIZE];
    for (var i = 0; i < SYNC_COMMITTEE_SIZE; i++) {
        bytesToSignFlag[i] = G1BytesToSignFlag(N, K, G1_POINT_SIZE);
        bigIntToSignFlag[i] = G1BigIntToSignFlag(N, K);
        for (var j = 0; j < G1_POINT_SIZE; j++) {
            bytesToSignFlag[i].in[j] <== pubkeysBytes[i][j];
        }
        for (var j = 0; j < K; j++) {
            bigIntToSignFlag[i].in[j] <== pubkeysBigIntY[i][j];
        }
        bytesToSignFlag[i].out === bigIntToSignFlag[i].out;
    }

    /* VERIFY THE SSZ ROOT OF THE SYNC COMMITTEE */
    component sszSyncCommittee = SSZPhase0SyncCommittee(
        SYNC_COMMITTEE_SIZE,
        LOG_2_SYNC_COMMITTEE_SIZE,
        G1_POINT_SIZE
    );
    for (var i = 0; i < SYNC_COMMITTEE_SIZE; i++) {
        for (var j = 0; j < 48; j++) {
            sszSyncCommittee.pubkeys[i][j] <== pubkeysBytes[i][j];
        }
    }
    for (var i = 0; i < 48; i++) {
        sszSyncCommittee.aggregatePubkey[i] <== aggregatePubkeyBytesX[i];
    }
    for (var i = 0; i < 32; i++) {
        syncCommitteeSSZ[i] === sszSyncCommittee.out[i];
    }

    /* VERIFY THE POSEIDON ROOT OF THE SYNC COMMITTEE */
    component computePoseidonRoot = PoseidonG1Array(
        SYNC_COMMITTEE_SIZE,
        N,
        K
    );
    for (var i = 0; i < SYNC_COMMITTEE_SIZE; i++) {
        for (var j = 0; j < K; j++) {
            computePoseidonRoot.pubkeys[i][0][j] <== pubkeysBigIntX[i][j];
            computePoseidonRoot.pubkeys[i][1][j] <== pubkeysBigIntY[i][j];
        }
    }
    syncCommitteePoseidon === computePoseidonRoot.out;
}

component main {public [finalizedHeaderRoot, syncCommitteeSSZ, syncCommitteePoseidon]} = Rotate();
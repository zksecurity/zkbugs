/// Source: https://github.com/selfxyz/self/blob/3905a30aeb19016d22c5493b8b34ade2d118da4e/circuits/circuits/utils/aadhaar/ofac/ofac_name_yob.circom

pragma circom 2.1.9;

include "../../../../../../dependencies/circomlib/circuits/poseidon.circom";
include "../../smt.circom";

/// @title OFAC_NAME_YOB_AADHAAR
/// @notice Verify if the name-YOB is in the OFAC list
/// @param nLevels Maximum number of levels in the merkle tree
/// @input name[2] Name of the user(packed into 2 field elements)
/// @input YOB Year of birth
/// @input smt_leaf_key Leaf key for name-YOB SMT verification
/// @input smt_root Root of name-YOB SMT
/// @input smt_siblings Siblings for name-YOB SMT proof
/// @output ofacCheckResult Result of the OFAC check
template OFAC_NAME_YOB_AADHAAR(nLevels) {
    signal input name[2];
    signal input YOB;

    signal input smt_leaf_key;
    signal input smt_root;
    signal input smt_siblings[nLevels];

    signal name_yob_hash <== Poseidon(3)([name[0], name[1], YOB]);

    signal output ofacCheckResult <== SMTVerify(nLevels)(name_yob_hash, smt_leaf_key, smt_root, smt_siblings, 0);
}
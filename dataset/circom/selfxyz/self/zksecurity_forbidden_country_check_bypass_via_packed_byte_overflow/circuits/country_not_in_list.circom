pragma circom 2.1.9;

include "../../../../dependencies/circomlib/circuits/comparators.circom";


/// Source: https://github.com/zkemail/zk-email-verify/blob/abe9d839d2518ef3f3f0a5fab2283fd672672dde/packages/circuits/utils/constants.circom#L12-L15
// Field support maximum of ~253 bit
function MAX_BYTES_IN_FIELD() {
    return 31;
}


/// Source: https://github.com/zkemail/zk-email-verify/blob/abe9d839d2518ef3f3f0a5fab2283fd672672dde/packages/circuits/utils/bytes.circom#L10-L60
function computeIntChunkLength(byteLength) {
    var packSize = MAX_BYTES_IN_FIELD();

    var remain = byteLength % packSize;
    var numChunks = (byteLength - remain) / packSize;
    if (remain > 0) {
        numChunks += 1;
    }

    return numChunks;
}


/// @title PackBytes
/// @notice Pack an array of bytes to numbers that fit in the field
/// @param maxBytes the maximum number of bytes in the input array
/// @input in the input byte array; assumes elements to be bytes
/// @output out the output integer array
template PackBytes(maxBytes) {
    var packSize = MAX_BYTES_IN_FIELD();
    var maxInts = computeIntChunkLength(maxBytes);

    signal input in[maxBytes];
    signal output out[maxInts];

    signal intSums[maxInts][packSize];

    for (var i = 0; i < maxInts; i++) {
        for(var j=0; j < packSize; j++) {
            var idx = packSize * i + j;

            // Copy the previous value if we are out of bounds - we take last item as final result
            if(idx >= maxBytes) {
                intSums[i][j] <== intSums[i][j-1];
            } 
            // First item of each chunk is the byte itself
            else if (j == 0){
                intSums[i][j] <== in[idx];
            }
            // Every other item is 256^j * byte
            else {
                intSums[i][j] <== intSums[i][j-1] + (1 << (8*j)) * in[idx];
            }
        }
    }
    
    // Last item of each chunk is the final sum
    for (var i = 0; i < maxInts; i++) {
        out[i] <== intSums[i][packSize-1];
    }
}


/// Source: https://github.com/selfxyz/self/blob/3905a30aeb19016d22c5493b8b34ade2d118da4e/circuits/circuits/utils/aadhaar/disclose/country_not_in_list.circom#L6-L29
/// @notice CountryNotInList template — used to prove that the user is not from a list of forbidden countries
/// @param MAX_FORBIDDEN_COUNTRIES_LIST_LENGTH Maximum number of countries present in the forbidden countries list
/// @input country Country of the user
/// @input forbidden_countries_list Forbidden countries list user wants to prove he is not from
/// @output forbidden_countries_list_packed Packed forbidden countries list — gas optimized
template CountryNotInList(MAX_FORBIDDEN_COUNTRIES_LIST_LENGTH) {
    signal input country[3];
    signal input forbidden_countries_list[MAX_FORBIDDEN_COUNTRIES_LIST_LENGTH * 3];

    signal equality_result[MAX_FORBIDDEN_COUNTRIES_LIST_LENGTH][4];
    signal is_equal[MAX_FORBIDDEN_COUNTRIES_LIST_LENGTH][3];
    for (var i = 0; i < MAX_FORBIDDEN_COUNTRIES_LIST_LENGTH; i++) {
        equality_result[i][0] <== 1;
        for (var j = 1; j < 3 + 1; j++) {
            is_equal[i][j - 1] <== IsEqual()([country[j - 1], forbidden_countries_list[i * 3 + j - 1]]);
            equality_result[i][j] <== is_equal[i][j - 1] * equality_result[i][j - 1];
        }
        0 === equality_result[i][3];
    }

    var chunkLength = computeIntChunkLength(MAX_FORBIDDEN_COUNTRIES_LIST_LENGTH * 3);
    signal output forbidden_countries_list_packed[chunkLength]  <== PackBytes(MAX_FORBIDDEN_COUNTRIES_LIST_LENGTH * 3)(forbidden_countries_list);
}

pragma circom 2.1.9;

include "../../../../dependencies/circomlib/circuits/poseidon.circom";
include "./bytes.circom";

/// Source: https://github.com/selfxyz/self/blob/629dfdad1a867eb82ccba6857a545f3ef838e123/circuits/circuits/utils/passport/customHashers.circom
/// @notice CutomHasher circuit - used to Poseidon up to 256 signals
/// @param k Number of signals to hash
/// @input in Input signals
/// @output out Output hash

template CustomHasher(k) {
    signal input in[k];
    signal output out;

    if (k < 16){ // if k is less than 16, we can use a single poseidon hash
        component hash = Poseidon(k);
        for (var i = 0; i < k; i++){
            hash.inputs[i] <== in[i];
        }
        out <== hash.out;
    }

    else{
        // do up to 16 rounds of poseidon
        var rounds =  div_ceil(k, 16);
        assert(rounds < 17);
        component hash[rounds];
        for (var i = 0; i < rounds ; i ++){
            hash[i] = Poseidon(16);
        }

        for (var i = 0; i < rounds ; i ++){
            for (var j = 0; j < 16 ; j ++){
                if (i * 16 + j < k){
                    hash[i].inputs[j] <== in[i * 16 + j];
                } else {
                    hash[i].inputs[j] <== 0;
                }
            }
        }

        component finalHash = Poseidon(rounds);
        for (var i = 0 ; i < rounds ; i++) {
            finalHash.inputs[i] <== hash[i].out;
        }
        out <== finalHash.out;
    }
}

/// @notice PackBytesAndPoseidon circuit — used to pack a byte array and hash it
/// @param k Size of the array to pack
/// @param in Input array
/// @param out Output hash
template PackBytesAndPoseidon(k) {
    var packed_length = computeIntChunkLength(k);

    signal input in[k];
    signal packed[packed_length] <== PackBytes(k)(in);
    signal output out <== CustomHasher(packed_length)(packed);
}


/// Source: https://github.com/0xbok/circom-bigint/blob/master/circuits/bigint_func.circom
function div_ceil(m, n) {
    var ret = 0;
    if (m % n == 0) {
        ret = m \ n;
    } else {
        ret = m \ n + 1;
    }
    return ret;
}
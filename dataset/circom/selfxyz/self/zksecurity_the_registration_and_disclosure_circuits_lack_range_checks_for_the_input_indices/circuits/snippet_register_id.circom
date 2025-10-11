pragma circom 2.1.9;

include "../../../../dependencies/circomlib/circuits/comparators.circom";


template SnippetRegisterID {
    signal input dsc_pubKey_offset, dsc_pubKey_actual_size, raw_dsc_actual_length;

    signal output dsc_pubKey_offset_in_range;

    dsc_pubKey_offset_in_range <== LessEqThan(12)([
        dsc_pubKey_offset + dsc_pubKey_actual_size,
        raw_dsc_actual_length
    ]); 
    dsc_pubKey_offset_in_range === 1;
}
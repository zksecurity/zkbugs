pragma circom 2.0.0;
include "../../../../dependencies/circomlib/circuits/babyjub.circom";
include "../../../../dependencies/circomlib/circuits/comparators.circom";
include "./if_else_then.circom";

template CountSameNFT(n) {
    signal input addr;
    signal input nft;
    signal input comp_addr[n];
    signal input comp_nft[n];
    signal output out;

    component counter[n];
    component nft_exist[n];
    signal intermediates[n+1];
    intermediates[0] <== 0;
    for(var i = 0; i < n; i++) {
        nft_exist[i] = IsZero();
        nft_exist[i].in <== comp_nft[i];

        counter[i] = IfElseThen(3);
        counter[i].obj1[0] <== addr;
        counter[i].obj2[0] <== comp_addr[i];
        counter[i].obj1[1] <== nft;
        counter[i].obj2[1] <== comp_nft[i];
        counter[i].obj1[2] <== nft_exist[i].out; // only count the non-zero nfts
        counter[i].obj2[2] <== 0;
        counter[i].if_v <== intermediates[i] + 1;
        counter[i].else_v <== intermediates[i];
        counter[i].out ==> intermediates[i+1];
    }

    out <== intermediates[n];
}

template NonFungible(n_i, n_o) {
    signal input prev_token_addr[n_i];
    signal input prev_token_nft[n_i];
    signal input post_token_addr[n_o];
    signal input post_token_nft[n_o];

    component token_count_1[n_i];
    component expected_count_1[n_i];
    for(var i = 0; i < n_i; i++) {
        expected_count_1[i] = IfElseThen(1);
        expected_count_1[i].obj1[0] <== prev_token_nft[i];
        expected_count_1[i].obj2[0] <== 0;
        expected_count_1[i].if_v <== 0;
        expected_count_1[i].else_v <== 1;

        token_count_1[i] = CountSameNFT(n_o);
        token_count_1[i].addr <== prev_token_addr[i];
        token_count_1[i].nft <== prev_token_nft[i];
        for(var j = 0; j < n_o; j++) {
            token_count_1[i].comp_addr[j] <== post_token_addr[j];
            token_count_1[i].comp_nft[j] <== post_token_nft[j];
        }
        token_count_1[i].out === expected_count_1[i].out;
    }

    component token_count_2[n_o];
    component expected_count_2[n_o];
    for(var i = 0; i < n_o; i++) {
        expected_count_2[i] = IfElseThen(1);
        expected_count_2[i].obj1[0] <== post_token_nft[i];
        expected_count_2[i].obj2[0] <== 0;
        expected_count_2[i].if_v <== 0;
        expected_count_2[i].else_v <== 1;
        token_count_2[i] = CountSameNFT(n_i);
        token_count_2[i].addr <== post_token_addr[i];
        token_count_2[i].nft <== post_token_nft[i];
        for(var j = 0; j < n_i; j++) {
            token_count_2[i].comp_addr[j] <== prev_token_addr[j];
            token_count_2[i].comp_nft[j] <== prev_token_nft[j];
        }
        token_count_2[i].out === expected_count_2[i].out;
    }
}

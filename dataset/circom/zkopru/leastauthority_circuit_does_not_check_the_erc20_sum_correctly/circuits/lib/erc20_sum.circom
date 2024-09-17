pragma circom 2.0.0;
include "../../../../dependencies/circomlib/circuits/babyjub.circom";
include "./if_else_then.circom";

template ERC20Sum(n) {
    signal input addr;
    signal input note_addr[n];
    signal input note_amount[n];
    signal output out;

    component sum[n];
    signal intermediates[n+1];
    intermediates[0] <== 0;
    for(var i = 0; i < n; i++) {
        sum[i] = IfElseThen(1);
        sum[i].obj1[0] <== addr;
        sum[i].obj2[0] <== note_addr[i];
        sum[i].if_v <== intermediates[i] + note_amount[i];
        sum[i].else_v <== intermediates[i];
        sum[i].out ==> intermediates[i+1];
    }
    out <== intermediates[n];
}

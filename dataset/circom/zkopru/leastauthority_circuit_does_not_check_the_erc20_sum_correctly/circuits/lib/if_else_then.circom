pragma circom 2.0.0;
include "../../../../dependencies/circomlib/circuits/mux1.circom";
include "../../../../dependencies/circomlib/circuits/comparators.circom";

template IfElseThen(n) {
    signal input obj1[n];
    signal input obj2[n];
    signal input if_v;
    signal input else_v;
    signal output out;
    component comparators[n];
    signal result[n + 1];
    result[0] <== 1;
    for(var i = 0; i < n; i++) {
        comparators[i] = IsEqual();
        comparators[i].in[0] <== obj1[i];
        comparators[i].in[1] <== obj2[i];
        result[i + 1] <== result[i] * comparators[i].out;
    }
    component mux = Mux1();
    mux.c[1] <== if_v;
    mux.c[0] <== else_v;
    mux.s <== result[n];
    out <== mux.out;
}

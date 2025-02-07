pragma circom 2.0.0;

template Edwards2Montgomery() {
    signal input in[2];
    signal output out[2];

    out[0] <-- (1 + in[1]) / (1 - in[1]);
    out[1] <-- out[0] / in[0];


    out[0] * (1-in[1]) === (1 + in[1]);
    out[1] * in[0] === out[0];
}

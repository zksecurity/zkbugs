pragma circom 2.0.0;

template MontgomeryAdd() {
    signal input in1[2];
    signal input in2[2];
    signal output out[2];

    var a = 168700;
    var d = 168696;

    var A = (2 * (a + d)) / (a - d);
    var B = 4 / (a - d);

    signal lamda;

    lamda <-- (in2[1] - in1[1]) / (in2[0] - in1[0]);
    lamda * (in2[0] - in1[0]) === (in2[1] - in1[1]);

    out[0] <== B*lamda*lamda - A - in1[0] -in2[0];
    out[1] <== lamda * (in1[0] - out[0]) - in1[1];
}

template MontgomeryDouble() {
    signal input in[2];
    signal output out[2];

    var a = 168700;
    var d = 168696;

    var A = (2 * (a + d)) / (a - d);
    var B = 4 / (a - d);

    signal lamda;
    signal x1_2;

    x1_2 <== in[0] * in[0];

    lamda <-- (3*x1_2 + 2*A*in[0] + 1 ) / (2*B*in[1]);
    lamda * (2*B*in[1]) === (3*x1_2 + 2*A*in[0] + 1 );

    out[0] <== B*lamda*lamda - A - 2*in[0];
    out[1] <== lamda * (in[0] - out[0]) - in[1];
}

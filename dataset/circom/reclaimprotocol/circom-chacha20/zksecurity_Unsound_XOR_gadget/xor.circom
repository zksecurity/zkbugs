pragma circom 2.0.0;

// Vulnerable XorWords: bit constraints are missing.
// The bit decomposition does not enforce that bits are 0 or 1,
// allowing a malicious prover to set arbitrary bit values.
template XorBits(M) {
    signal input a;
    signal input b;
    signal output out;

    signal a_bits[M];
    signal b_bits[M];
    signal xor_bits[M];

    var sum_a = 0;
    var sum_b = 0;
    var sum_xor = 0;

    for (var i = 0; i < M; i++) {
        a_bits[i] <-- (a >> i) & 1;
        b_bits[i] <-- (b >> i) & 1;

        // BUG: bit constraints are commented out / missing
        // a_bits[i] * (a_bits[i] - 1) === 0;
        // b_bits[i] * (b_bits[i] - 1) === 0;

        // XOR: res = a + b - 2*a*b
        xor_bits[i] <== a_bits[i] + b_bits[i] - 2 * a_bits[i] * b_bits[i];

        sum_a += a_bits[i] * (1 << i);
        sum_b += b_bits[i] * (1 << i);
        sum_xor += xor_bits[i] * (1 << i);
    }

    out <== sum_xor;
}

template XorWords() {
    signal input a;
    signal input b;
    signal output out;

    component xor = XorBits(32);
    xor.a <== a;
    xor.b <== b;
    out <== xor.out;
}

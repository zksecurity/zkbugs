pragma circom 2.0.5;

template ArrayXOR(n) {
    signal input a[n];
    signal input b[n];
    signal output out[n];

    for (var i = 0; i < n; i++) {
        out[i] <-- a[i] ^ b[i];
    }
}

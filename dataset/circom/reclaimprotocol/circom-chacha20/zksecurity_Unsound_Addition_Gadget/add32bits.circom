pragma circom 2.0.0;

// Vulnerable Add32Bits: carry bit tmp is not constrained to be correct.
// A malicious prover can set tmp=0 when overflow occurs (getting 33-bit output)
// or tmp=1 when no overflow (causing underflow).
template Add32Bits() {
    signal input a;
    signal input b;
    signal output out;

    // Witness the carry bit (unconstrained!)
    signal tmp;
    tmp <-- (a + b) >> 32;

    // Remove carry if tmp is set
    out <== a + b - tmp * (1 << 32);
}

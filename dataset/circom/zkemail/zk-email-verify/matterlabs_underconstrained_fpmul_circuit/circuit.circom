pragma circom 2.1.6;

include "packages/circuits/lib/fp.circom";

// FpMul(n, k) is under-constrained: it range-checks q[i] and r[i] to n bits
// via Num2Bits(n) but never asserts r < p, allowing a malicious prover to
// satisfy the circuit with a remainder >= p.
// We instantiate with small parameters to keep the circuit cheap to compile
// while still exhibiting the bug. The full issue targets the FpMul(121, 17)
// instance used by RSAVerifier65537 in zk-email.
component main = FpMul(64, 4);

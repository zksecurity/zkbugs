pragma circom 2.1.3;

include "circuits/comparators.circom";

// Faithful reproduction of the vulnerable `Base64DecodedLength(maxN)` template
// from aptos-labs/keyless-zk-proofs @ fd160220 (circuit/templates/helpers/misc.circom).
// `decoded_len` is declared as a `signal output` but never assigned or constrained
// in the template body — the lines that would have defined it are commented out.
template Base64DecodedLength(maxN) {
    var max_q = (3 * maxN) \ 4;
    signal input n;
    signal output decoded_len;
    signal q <-- 3*n \ 4;
    signal r <-- 3*n % 4;

    3*n - 4*q - r === 0;
    signal r_correct_reminder <== LessThan(2)([r, 4]);
    r_correct_reminder === 1;

    signal q_correct_quotient <== LessThan(252)([q, max_q]);
    q_correct_quotient === 1;

    // Intentionally leaving `decoded_len` unassigned — this is the bug.
}

component main = Base64DecodedLength(8);

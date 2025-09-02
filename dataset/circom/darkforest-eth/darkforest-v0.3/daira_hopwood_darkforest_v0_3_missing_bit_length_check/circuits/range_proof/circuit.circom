pragma circom 2.0.0;

include "../../../../../dependencies/circomlib/circuits/comparators.circom";

// NB: RangeProof is inclusive.
// input: field element, whose abs is claimed to be less than max_abs_value
// output: none
// we also want something like 4 * (abs(in) + max_abs_value) < 2 ** bits
// and bits << 256
template RangeProof(bits, max_abs_value) {
    signal input in;
    signal output out;

    component lowerBound = LessThan(bits);
    component upperBound = LessThan(bits);

    lowerBound.in[0] <== max_abs_value + in;
    lowerBound.in[1] <== 0;
    lowerBound.out === 0;

    upperBound.in[0] <== 2 * max_abs_value;
    upperBound.in[1] <== max_abs_value + in;
    upperBound.out === 0;
}

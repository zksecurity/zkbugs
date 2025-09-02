pragma circom 2.0.0;

include "../../../../dependencies/circomlib/circuits/bitify.circom";
include "../../../../dependencies/circomlib/circuits/comparators.circom";

template Modulo() {
    signal input divisor;
    signal input dividend;
    signal output remainder;

    signal output quotient;

    // circom's best practices state that we should avoid using <-- unless
    // we know what we are doing. But this is the only way to perform the
    // modulo operation.
    quotient <-- dividend \ divisor;
    remainder <-- dividend % divisor;

    // check that remainder and divisor are both < 2**252
    component remainder_bits = Num2Bits(254);
    remainder_bits.in <== remainder;
    for (var x = 252; x < 254; x++) {
        remainder_bits.out[x] === 0;
    }

    component divisor_bits = Num2Bits(254);
    divisor_bits.in <== divisor;
    for (var x = 252; x < 254; x++) {
        divisor_bits.out[x] === 0;
    }

    // now we can safely do a range check on remainder
    component remainder_lt;
    // Range check on remainder
    remainder_lt = LessThan(252);
    remainder_lt.in[0] <== remainder;
    remainder_lt.in[1] <== divisor;
    remainder_lt.out === 1;

    // Check equality
    dividend === divisor * quotient + remainder;
}
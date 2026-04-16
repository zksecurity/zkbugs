pragma circom 2.1.9;

include "circuits/circuits/templates/utils.circom";

// Direct entrypoint for V-PAN-VUL-001. BabyJubJubSubOrderTag(isActive=1)
// is supposed to enforce `in < suborder` but does not constrain the
// LessThan(251) output to be 1, and does not range-check `in` to 251 bits.
component main {public [in]} = BabyJubJubSubOrderTag(1);

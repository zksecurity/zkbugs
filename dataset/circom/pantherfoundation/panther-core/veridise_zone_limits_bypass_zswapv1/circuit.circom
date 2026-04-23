pragma circom 2.1.9;

// Direct entrypoint for V-PAN-VUL-016. The vulnerability is in the ZSwapV1
// template where `zAccountUtxoOutTotalAmountPerTimePeriod` is gated by
// `isDeltaTimeLessEqThen.out` and collapses to 0 whenever deltaTime exceeds
// `zZoneTimePeriodPerMaximumAmount` — allowing the zone transfer limit to be
// bypassed by providing an out-of-range deltaTime. The template is too
// large to reconstruct inputs for in isolation, so the original
// mainZSwapV1.circom entrypoint is used for verification.
include "circuits/circuits/mainZSwapV1.circom";

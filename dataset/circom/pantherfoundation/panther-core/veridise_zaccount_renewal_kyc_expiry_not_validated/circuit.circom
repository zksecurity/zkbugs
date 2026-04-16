pragma circom 2.1.9;

// Direct entrypoint for V-PAN-VUL-017. The zAccountRenewalV1 circuit accepts
// `kycSignedMessageTimestamp` as an input but never constrains it against
// the current block time, so expired KYC certificates pass verification. The
// template is too large to reconstruct inputs for in isolation, so the
// original mainZAccountRenewalV1.circom entrypoint is used for verification.
include "circuits/circuits/mainZAccountRenewalV1.circom";

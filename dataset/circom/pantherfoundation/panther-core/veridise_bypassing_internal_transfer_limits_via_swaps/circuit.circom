pragma circom 2.1.9;

// Minimal direct-mode wrapper that reproduces the vulnerable swap-UTXO
// zone-limit check from `ZSwapV1` in circuits/circuits/zSwapV1.circom,
// lines 605-631 at commit 06a8186. The wrapper isolates the bug: when a
// swap UTXO is processed, `utxoOutAmount` is constrained to `0`, so the
// comparator input becomes `0 * isNotOwner = 0` and the
// `ForceLessEqThan(96)` check against `zZoneInternalMaxAmount` trivially
// passes even when the UTXO is sent to another zAccount
// (`isNotOwner == 1`) with a large implicit swapped amount.
//
// The extracted logic matches the real template exactly; only the
// unrelated I/O of ZSwapV1 (merkle proofs, KYC, EdDSA, etc.) is stripped.

include "circuits/circuits/templates/utils.circom";
include "circuits/comparators.circom";

template SwapUtxoLimitCheckBug() {
    // Analogues of the ZSwapV1 signals used by lines 605-631.
    signal input zAccountUtxoInRootSpendPubKey[2];
    signal input utxoOutRootSpendPubKey[2];
    signal input utxoOutAmount;          // swap UTXO is constrained to 0
    signal input zAssetWeightSwapToken;
    signal input zZoneInternalMaxAmount;

    // Match the protocol constraint: swap UTXO amount must be zero.
    utxoOutAmount === 0;

    // `isNotOwner` calculation identical to the vulnerable template.
    component isEqX = IsEqual();
    isEqX.in[0] <== zAccountUtxoInRootSpendPubKey[0];
    isEqX.in[1] <== utxoOutRootSpendPubKey[0];

    component isEqY = IsEqual();
    isEqY.in[0] <== zAccountUtxoInRootSpendPubKey[1];
    isEqY.in[1] <== utxoOutRootSpendPubKey[1];

    signal isNotOwner <== 1 - (isEqX.out * isEqY.out);

    // Vulnerable swap-UTXO branch replicated from lines 620-623. Because
    // `utxoOutAmount === 0`, `utxoOutWeightedAmount` is always 0 and the
    // ForceLessEqThan check trivially holds regardless of ownership.
    signal utxoOutWeightedAmount <== utxoOutAmount * zAssetWeightSwapToken;

    component isLessThanEq = ForceLessEqThan(96);
    isLessThanEq.in[0] <== utxoOutWeightedAmount * isNotOwner;
    isLessThanEq.in[1] <== zZoneInternalMaxAmount;
}

component main = SwapUtxoLimitCheckBug();

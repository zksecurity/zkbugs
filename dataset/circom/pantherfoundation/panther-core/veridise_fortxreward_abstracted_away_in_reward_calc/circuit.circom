pragma circom 2.1.9;

include "circuits/circuits/templates/utils.circom";
include "circuits/circuits/templates/rewardsExtended.circom";

// Direct entrypoint for V-PAN-VUL-020. RewardsExtended computes the final
// PRP reward as (S1 + S5) >> prpScaleFactor, where S1 = forTxReward (unscaled)
// and S5 is multiplied by a large asset weight. Because prpScaleFactor = 60
// and S1 has only 40 bits, forTxReward is abstracted away (rounded to 0) in
// the final amount. The wrapper template converts plain inputs to the tagged
// types expected by RewardsExtended.
template Wrapper(nUtxoIn) {
    signal input depositScaledAmount;
    signal input forTxReward;
    signal input forUtxoReward;
    signal input forDepositReward;
    signal input spendTime;
    signal input assetWeight;
    signal input utxoInAmount[nUtxoIn];
    signal input utxoInCreateTime[nUtxoIn];

    var ACTIVE = Active();
    component depTag = Uint64Tag(ACTIVE);
    depTag.in <== depositScaledAmount;
    component txTag = Uint40Tag(ACTIVE);
    txTag.in <== forTxReward;
    component utxoRewTag = Uint40Tag(ACTIVE);
    utxoRewTag.in <== forUtxoReward;
    component depRewTag = Uint40Tag(ACTIVE);
    depRewTag.in <== forDepositReward;
    component stTag = Uint32Tag(ACTIVE);
    stTag.in <== spendTime;
    component wTag = Uint48Tag(ACTIVE);
    wTag.in <== assetWeight;

    component amtTag[nUtxoIn];
    component ctTag[nUtxoIn];
    for (var i = 0; i < nUtxoIn; i++) {
        amtTag[i] = Uint64Tag(ACTIVE);
        amtTag[i].in <== utxoInAmount[i];
        ctTag[i] = Uint32Tag(ACTIVE);
        ctTag[i].in <== utxoInCreateTime[i];
    }

    component r = RewardsExtended(nUtxoIn);
    r.depositScaledAmount <== depTag.out;
    r.forTxReward <== txTag.out;
    r.forUtxoReward <== utxoRewTag.out;
    r.forDepositReward <== depRewTag.out;
    r.spendTime <== stTag.out;
    r.assetWeight <== wTag.out;
    for (var i = 0; i < nUtxoIn; i++) {
        r.utxoInAmount[i] <== amtTag[i].out;
        r.utxoInCreateTime[i] <== ctTag[i].out;
    }
}

component main {public [depositScaledAmount, forTxReward, forUtxoReward, forDepositReward, spendTime, assetWeight, utxoInAmount, utxoInCreateTime]} = Wrapper(2);

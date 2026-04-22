pragma circom 2.2.2;

include "circuits/comparators.circom";
include "circuits/mimcsponge.circom";

// Faithful reproduction of the vulnerable `Spend()` template from
// worm-privacy/proof-of-burn @ 0802485d24. The project's own
// `circuits/spend.circom` pulls in unused Keccak/RLP helpers whose files
// were removed, so we redefine Spend here using circomlib directly.
template Spend() {
    signal input balance;
    signal input salt;
    signal output coin;

    component coinHasher = MiMCSponge(2, 220, 1);
    coinHasher.ins[0] <== balance;
    coinHasher.ins[1] <== salt;
    coinHasher.k <== 0;
    coin <== coinHasher.outs[0];

    signal input withdrawnBalance;
    signal input remainingCoinSalt;
    signal output remainingCoin;

    component sufficientBalanceChecker = GreaterEqThan(252);
    sufficientBalanceChecker.in[0] <== balance;
    sufficientBalanceChecker.in[1] <== withdrawnBalance;
    sufficientBalanceChecker.out === 1;

    component remainingCoinHasher = MiMCSponge(2, 220, 1);
    remainingCoinHasher.ins[0] <== balance - withdrawnBalance;
    remainingCoinHasher.ins[1] <== remainingCoinSalt;
    remainingCoinHasher.k <== 0;
    remainingCoin <== remainingCoinHasher.outs[0];
}

component main {public [withdrawnBalance]} = Spend();

function genValues(n, neg, bitsPerWord) {
    bitsPerWord = bitsPerWord || 32;
    const res = [];
    res.push(0n);
    for (let i=0; i<n; i++) {
        if (i>0) {
            res.push( (1n << BigInt(bitsPerWord*i)) - 1n);
        }
        if (i<n-1) {
            res.push( 1n << BigInt(bitsPerWord*i));
            res.push( (1n << BigInt(bitsPerWord*i)) + 1n);
        }
    }

    if (neg) {
        const nt= res.length;
        for (let i=0; i<nt; i++) res.push(0n - res[i]);
    }

    return res;
}

module.exports.genValues = genValues;

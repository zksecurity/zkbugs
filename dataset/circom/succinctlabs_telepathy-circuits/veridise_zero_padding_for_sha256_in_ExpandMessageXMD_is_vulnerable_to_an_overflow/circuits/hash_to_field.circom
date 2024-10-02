pragma circom 2.0.5;

template I2OSP(l) {
    signal input in;
    signal output out[l];
  
    var value = in;
    for (var i = l - 1; i >= 0; i--) {
        out[i] <-- value & 255;
        value = value \ 256;
    }
  
    signal acc[l];
    for (var i = 0; i < l; i++) {
        if (i == 0) {
            acc[i] <== out[i];
        } else {
            acc[i] <== 256 * acc[i-1] + out[i];
        }
    }
  
    acc[l-1] === in;
}

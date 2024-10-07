pragma circom 2.0.5;

include "./sha256.circom";

/*
 * Based on github.com/paulmillr/noble-bls12-381. Implements the logic for
 * converting a series of bytes (a messgage you want a signature over) into a
 * field element according to the BLS12-381 spec.
 */

template HashToField(MSG_LEN, COUNT) {
    signal input msg[MSG_LEN];

    var DST[43] = getDomainSeperatorTag();
    var P[7] = getBLS128381Prime();
    var DST_LEN = 43;
    var LOG2P = 381;
    var M = 2;
    var L = 64;
    var BYTES_LEN = 256;
    var BITS_PER_REGISTER = 55;
    var NUM_REGISTERS = (8 * L + BITS_PER_REGISTER - 1) \ BITS_PER_REGISTER;
    var LOG_EXTRA = log_ceil(NUM_REGISTERS - 6);
    var tmp;

    component expandMessageXMD = ExpandMessageXMD(MSG_LEN, DST_LEN, BYTES_LEN);
    for (var i = 0; i < MSG_LEN; i++) {
        expandMessageXMD.msg[i] <== msg[i];
    }
    for (var i = 0; i < DST_LEN; i++) {
        expandMessageXMD.dst[i] <== DST[i];
    }

    signal bytesLE[COUNT][M][L];
    for (var i = 0; i < COUNT; i++) {
        for (var j = 0; j < M; j++) {
          for (var k = 0; k < L; k++) {
                tmp = expandMessageXMD.out[i*M*L + j*L + L - 1 - k];
                bytesLE[i][j][k] <== tmp;
          }
        }
    }

    var bytesToRegisters[COUNT][M][NUM_REGISTERS];
    component byteToBits[COUNT][M][NUM_REGISTERS];
    component bitsToNum[COUNT][M][NUM_REGISTERS][2];
    for (var i = 0; i < COUNT; i++) {
        for (var j = 0; j < M; j++) {
            for (var l = 0; l < NUM_REGISTERS; l++) {
                bytesToRegisters[i][j][l] = 0;
            }
            var curBits = 0;
            var idx = 0;
            for (var k = 0; k < L; k++){
                if (curBits + 8 <= BITS_PER_REGISTER) {
                    tmp = bytesLE[i][j][k] * (1 << curBits);
                    bytesToRegisters[i][j][idx] += tmp;
                    curBits += 8;
                    if (curBits == BITS_PER_REGISTER) {
                        curBits = 0;
                        idx++;
                    }
                } else {
                    var bits1 = BITS_PER_REGISTER - curBits;
                    var bits2 = 8 - bits1;
                    byteToBits[i][j][idx] = Num2Bits(8);
                    byteToBits[i][j][idx].in <== bytesLE[i][j][k];

                    bitsToNum[i][j][idx][0] = Bits2Num(bits1);
                    for (var bit = 0; bit < bits1; bit++) {
                        tmp = byteToBits[i][j][idx].out[bit];
                        bitsToNum[i][j][idx][0].in[bit] <== tmp;
                    }

                    bitsToNum[i][j][idx][1] = Bits2Num(bits2);
                    for (var bit = 0; bit < bits2; bit++) {
                        tmp = byteToBits[i][j][idx].out[bits1 + bit];
                        bitsToNum[i][j][idx][1].in[bit] <== tmp;
                    }

                    tmp = bitsToNum[i][j][idx][0].out * (1 << curBits);
                    bytesToRegisters[i][j][idx] += tmp;
                    tmp = bitsToNum[i][j][idx][1].out;
                    bytesToRegisters[i][j][idx + 1] = tmp;
                    idx++;
                    curBits = bits2;
                }
            }
      }
    }

    signal bytesToBigInt[COUNT][M][NUM_REGISTERS];
    for (var i = 0; i < COUNT; i++) {
        for (var j = 0; j < M; j++) {
            for (var idx = 0; idx < NUM_REGISTERS; idx++) {
                bytesToBigInt[i][j][idx] <== bytesToRegisters[i][j][idx];
            }
        }
    }

    component red[COUNT][M];
    component modders[COUNT][M];
    for (var i = 0; i < COUNT; i++) {
        for (var j = 0; j < M; j++) {
            red[i][j] = PrimeReduce(
                BITS_PER_REGISTER,
                7,
                NUM_REGISTERS - 7,
                P,
                LOG_EXTRA + (2 * BITS_PER_REGISTER)
            );
            for (var k = 0; k < NUM_REGISTERS; k++) {
                red[i][j].in[k] <== bytesToBigInt[i][j][k];
            }
            modders[i][j] = SignedFpCarryModP(
                BITS_PER_REGISTER,
                7,
                LOG_EXTRA + (2 * BITS_PER_REGISTER),
                P
            );
            for (var k = 0; k < 7; k++) {
                modders[i][j].in[k] <== red[i][j].out[k];
            }
        }
    }

    signal output out[COUNT][M][7];
    for (var i = 0; i < COUNT; i++) {
        for (var j = 0; j < M; j++) {
            for (var k = 0; k < 7; k++) {
                out[i][j][k] <== modders[i][j].out[k];
            }
        }
    }
}


template ExpandMessageXMD(MSG_LEN, DST_LEN, EXPANDED_LEN) {
    signal input msg[MSG_LEN];
    signal input dst[DST_LEN];
    signal output out[EXPANDED_LEN];
  
    var B_IN_BYTES = 32;
    var R_IN_BYTES = 64;
    var ELL = (EXPANDED_LEN + B_IN_BYTES - 1) \ B_IN_BYTES;
    assert(ELL < 255); // invalid xmd length
  
    component i2ospDst = I2OSP(1);
    i2ospDst.in <== DST_LEN;
  
    signal dstPrime[DST_LEN + 1];
    for (var i = 0; i < DST_LEN; i++) {
        dstPrime[i] <== dst[i];
    }
    dstPrime[DST_LEN] <== i2ospDst.out[0];
  
    component i2ospLibStr = I2OSP(2);
    i2ospLibStr.in <== EXPANDED_LEN;

    // b_0 = sha256(Z_pad || msg || l_i_b_str || i2osp(0, 1) || DST_prime)
    var S256_0_INPUT_BYTE_LEN = R_IN_BYTES + MSG_LEN + 2 + 1 + DST_LEN + 1;
    component sha0 = Sha256Bytes(S256_0_INPUT_BYTE_LEN);
    for (var i = 0; i < S256_0_INPUT_BYTE_LEN; i++) {
        if (i < R_IN_BYTES) {
            sha0.in[i] <== 0;
        } else if (i < R_IN_BYTES + MSG_LEN) {
            sha0.in[i] <== msg[i - R_IN_BYTES];
        } else if (i < R_IN_BYTES + MSG_LEN + 2) {
            sha0.in[i] <== i2ospLibStr.out[i - R_IN_BYTES - MSG_LEN];
        } else if (i < R_IN_BYTES + MSG_LEN + 2 + 1) {
            sha0.in[i] <== 0;
        } else {
            sha0.in[i] <== dstPrime[i - R_IN_BYTES - MSG_LEN - 2 - 1];
        }
    }

    // b[0] = sha256(s256_0.out || i2osp(1, 1) || dst_prime)
    component s256s[ELL];
    var S256S_0_INPUT_BYTE_LEN = B_IN_BYTES + 1 + DST_LEN + 1;
    s256s[0] = Sha256Bytes(S256S_0_INPUT_BYTE_LEN);
    for (var i = 0; i < S256S_0_INPUT_BYTE_LEN; i++) {
        if (i < B_IN_BYTES) {
            s256s[0].in[i] <== sha0.out[i];
        } else if (i < B_IN_BYTES + 1) {
            s256s[0].in[i] <== 1;
        } else {
            s256s[0].in[i] <== dstPrime[i - B_IN_BYTES - 1];
        }
    }

    // sha256(b[0] XOR b[i-1] || i2osp(i+1, 1) || dst_prime)
    component arrayXOR[ELL-1];
    component i2ospIndex[ELL-1];
    for (var i = 1; i < ELL; i++) {
        arrayXOR[i-1] = ByteArrayXOR(B_IN_BYTES);
        for (var j = 0; j < B_IN_BYTES; j++) {
            arrayXOR[i-1].a[j] <== sha0.out[j];
            arrayXOR[i-1].b[j] <== s256s[i-1].out[j];
        }

        i2ospIndex[i-1] = I2OSP(1);
        i2ospIndex[i-1].in <== i + 1;

        var S256S_INPUT_BYTE_LEN = B_IN_BYTES + 1 + DST_LEN + 1;
        s256s[i] = Sha256Bytes(S256S_INPUT_BYTE_LEN);
        for (var j = 0; j < S256S_INPUT_BYTE_LEN; j++) {
          if (j < B_IN_BYTES) {
              s256s[i].in[j] <== arrayXOR[i-1].out[j];
          } else if (j < B_IN_BYTES + 1) {
              s256s[i].in[j] <== i2ospIndex[i-1].out[j-B_IN_BYTES];
          } else {
              s256s[i].in[j] <== dstPrime[j-B_IN_BYTES-1];
          }
        }
    }

    for (var i = 0; i < EXPANDED_LEN; i++) {
        out[i] <== s256s[i \ B_IN_BYTES].out[i % B_IN_BYTES];
    }
}


template ByteArrayXOR(n) {
    signal input a[n];
    signal input b[n];
    signal output out[n];

    component bitifiersA[n];
    component bitifiersB[n];
    for (var i = 0; i < n; i++) {
        bitifiersA[i] = Num2Bits(8);
        bitifiersA[i].in <== a[i];
        bitifiersB[i] = Num2Bits(8);
        bitifiersB[i].in <== b[i];
    }

    signal xorBits[n][8];
    for (var i = 0; i < n; i++) {
        for (var j = 0; j < 8; j++) {
            xorBits[i][j] <== bitifiersA[i].out[j] + bitifiersB[i].out[j]
                - 2 * bitifiersA[i].out[j] * bitifiersB[i].out[j];
        }
    }

    component byteifiers[n];
    for (var i = 0; i < n; i++) {
        byteifiers[i] = Bits2Num(8);
        for (var j = 0; j < 8; j++) {
            byteifiers[i].in[j] <== xorBits[i][j];
        }
    }

    for (var i = 0; i < n; i++) {
        out[i] <== byteifiers[i].out;
    }
}


template I2OSP(l) {
    assert(l < 31);
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
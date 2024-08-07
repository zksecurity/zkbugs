pragma circom 2.0.3;

include "../bigint_func.circom";

function find_Fp12_sum(n, k, a, b, p) {
    var out[6][2][50];
    for(var i=0; i<6; i++)
        out[i] = find_Fp2_sum(n, k, a[i], b[i], p);
    return out;
}

function find_Fp12_diff(n, k, a, b, p) {
    var out[6][2][50];
    for(var i=0; i<6; i++)
        out[i] = find_Fp2_diff(n, k, a[i], b[i], p);
    return out;
}

function find_Fp12_product(n, k, a, b, p) {
    var l = 6;
    var XI0 = 9; // w^6 = XI0 + u 
    var a0[l][50];
    var a1[l][50];
    var b0[l][50];
    var b1[l][50];
    var neg_b0[l][50];
    var neg_b1[l][50];
    var out[l][2][50];
    for (var i = 0; i < l; i ++) { 
        for ( var j = 0; j < k; j ++) {
            a0[i][j] = a[i][0][j];
            a1[i][j] = a[i][1][j];
            b0[i][j] = b[i][0][j];
            b1[i][j] = b[i][1][j];
        }
    }
    for ( var i = 0; i < l; i ++) {
        neg_b0[i] = long_sub(n, k, p, b0[i]);
        neg_b1[i] = long_sub(n, k, p, b1[i]);
    }

    var real_init[20][50]; // a0 b0 - a1 b1
    var imag_init[20][50]; // a0 b1 + a1 b0
    var imag_init_neg[20][50]; // -a0 b1 - a1 b0
    // each product will be 2l-1 x 2k
    var a0b0_var[20][50] = prod2D(n, k, l, a0, b0);
    var a1b1_neg[20][50] = prod2D(n, k, l, a1, neg_b1);
    var a0b1_var[20][50] = prod2D(n, k, l, a0, b1);
    var a1b0_var[20][50] = prod2D(n, k, l, a1, b0);
    var a0b1_neg[20][50] = prod2D(n, k, l, a0, neg_b1);
    var a1b0_neg[20][50] = prod2D(n, k, l, a1, neg_b0);
    for (var i = 0; i < 2*l - 1; i++) { // compute initial rep (deg w = 10)
        real_init[i] = long_add(n, 2*k, a0b0_var[i], a1b1_neg[i]); // 2*k+1 registers each
        imag_init[i] = long_add(n, 2*k, a0b1_var[i], a1b0_var[i]);
        imag_init_neg[i] = long_add(n, 2*k, a0b1_neg[i], a1b0_neg[i]);
    }
    var real_carry[l][50];
    var imag_carry[l][50];
    var real_final[l][50];
    var imag_final[l][50];
    var zeros[50]; // to balance register sizes
    for (var i = 0; i < 50; i ++) {
        zeros[i] = 0;
    }
    for (var i = 0; i < l; i ++) {
        if (i == l - 1) {
            real_carry[i] = zeros;
            imag_carry[i] = zeros;
        } else {
            // real_carry[i] = real_init[i+l] * XI0 - imag_init_neg[i+l] 
            imag_init_neg[i+l][2*k+1] = 0;
            real_carry[i] = long_add(n, 2*k+2, long_scalar_mult(n, 2*k+1, XI0, real_init[i+l]), imag_init_neg[i+l]); // now 2*k+3 registers
            // imag_carry[i] = real_init[i+l] + imag_init[i+l] * XI0
            real_init[i+l][2*k+1] = 0;
            imag_carry[i] = long_add(n, 2*k+2, long_scalar_mult(n, 2*k+1, XI0, imag_init[i+l]), real_init[i+l]);
        }
    }
    for (var i = 0; i < l; i ++) {
        real_final[i] = long_add_unequal(n, 2*k+3, 2*k+1, real_carry[i], real_init[i]); // now 2*k+4 registers
        imag_final[i] = long_add_unequal(n, 2*k+3, 2*k+1, imag_carry[i], imag_init[i]);
    }
    var XYreal_temp[l][2][50];
    var XYimag_temp[l][2][50];
    for (var i = 0; i < l; i ++) {
        XYreal_temp[i] = long_div2(n, k, k+4, real_final[i], p); // k+5 register quotient, k register remainder
        XYimag_temp[i] = long_div2(n, k, k+4, imag_final[i], p);
    }
    for (var i = 0; i < l; i ++) {
        for (var j = 0; j < k; j ++) {
            out[i][0][j] = XYreal_temp[i][1][j];
            out[i][1][j] = XYimag_temp[i][1][j];
        }
    }
    return out;
}

// a is 6 x 2 x k element of Fp^12
// compute inverse. first multiply by conjugate a + bw (a,b in Fp^6, w^6 = XI0+u, u^2=-1)
// then reduce to inverting in Fp^6
function find_Fp12_inverse(n, k, p, a) {
    var A[6][2][50];
    var B[6][2][50];
    var Bw[6][2][50];
    for (var i = 0; i < 3; i ++) {
        for (var j = 0; j < 2; j ++) {
            for (var m = 0; m < k; m ++) {
                A[2*i+1][j][m] = 0;
                B[2*i+1][j][m] = 0;
                A[2*i][j][m] = a[2*i][j][m];
                B[2*i][j][m] = a[2*i+1][j][m];
                Bw[2*i][j][m] = 0;
                Bw[2*i+1][j][m] = a[2*i+1][j][m];
            }
        }
    }
    var A2[6][2][50] = find_Fp12_product(n, k, A, A, p);
    var B2[6][2][50] = find_Fp12_product(n, k, B, B, p);
    var conj[6][2][50] = find_Fp12_diff(n, k, A, Bw, p);
    var w2[6][2][50];
    for (var i = 0; i < 6; i ++) {
        for (var j = 0; j < 2; j ++) {
            for (var m = 0; m < k; m ++) {
                if (i == 2 && j == 0 && m == 0) {
                    w2[i][j][m] = 1;
                } else {
                    w2[i][j][m] = 0;
                }
            }
        }
    }
    var B2w2[6][2][50] = find_Fp12_product(n, k, B2, w2, p);
    var conjProd[6][2][50] = find_Fp12_diff(n, k, A2, B2w2, p);
    var a0[2][50];
    var a1[2][50];
    var a2[2][50];
    for (var i = 0; i < 2; i ++) {
        for (var m = 0; m < k; m ++) {
            a0[i][m] = conjProd[0][i][m];
            a1[i][m] = conjProd[2][i][m];
            a2[i][m] = conjProd[4][i][m];
        }
    }
    var conjProdInv[6][2][50] = find_Fp6_inverse(n, k, p, a0, a1, a2);
    var out[6][2][50] = find_Fp12_product(n, k, conj, conjProdInv, p);
    return out;
}

// compute the inverse of a0 + a1v + a2v^2 in Fp6, where 
// v^3 = XI0+u, u^2 = -1, a0 a1 a2 in Fp2 (2 x k)
// assume XI0^2 -1 < 2^n and 2*XI0 < 2^n 
// returns an element in standard Fp12 representation (6 x 2 x k)
function find_Fp6_inverse(n, k, p, a0, a1, a2) {
    var out[6][2][50];

    var a0_squared[2][50] = find_Fp2_product(n, k, a0, a0, p);
    var a1_squared[2][50] = find_Fp2_product(n, k, a1, a1, p);
    var a2_squared[2][50] = find_Fp2_product(n, k, a2, a2, p);
    var a0a1[2][50] = find_Fp2_product(n, k, a0, a1, p);
    var a0a2[2][50] = find_Fp2_product(n, k, a0, a2, p);
    var a1a2[2][50] = find_Fp2_product(n, k, a1, a2, p);
    var a0a1a2[2][50] = find_Fp2_product(n, k, a0a1, a2, p);

    var XI0 = 9;
    assert( XI0 * XI0 - 1 < (1<<n) ); 
    assert( 2*XI0 < (1<<n) );

    var v3[2][50]; // v^3 = XI0 + u
    for (var i = 0; i < 2; i ++) {
        for (var j = 0; j < k; j ++) {
            if (j == 0) {
                if(i==0) v3[i][j] = XI0;
                else v3[i][j] = 1;
            } else {
                v3[i][j] = 0;
            }
        }
    }

    var three_v3[2][50]; // 3v^3 = 3*XI0 + 3u
    for (var i = 0; i < 2; i ++) {
        for (var j = 0; j < k; j ++) {
            if (j == 0) {
                three_v3[i][j] = 3 * v3[i][j];
            } else {
                three_v3[i][j] = 0;
            }
        }
    }

    var v6[2][50]; // v^6 = (XI0^2 - 1) + 2*XI0 u
    for (var i = 0; i < 2; i ++) {
        for (var j = 0; j < k; j ++) {
            if (j == 0) {
                if(i==0)
                    v6[i][j] = XI0*XI0 - 1;
                else 
                    v6[i][j] = 2 * XI0;
            } else {
                v6[i][j] = 0;
            }
        }
    }

    // solves system of equations using Cramer's rule 
    // [[a0, a2 v^3, a1 v^3], [a1, a0, a2 v^3], [a2, a1, a0]]^{-1} . [[1],[0],[0]] 
    var v0_1[2][50] = find_Fp2_product(n, k, a1a2, v3, p);
    var v0_temp[2][50] = find_Fp2_diff(n, k, a0_squared, v0_1, p); // a0^2 - a1a2v^3
    var v1_1[2][50] = find_Fp2_product(n, k, a2_squared, v3, p);
    var v1_temp[2][50] = find_Fp2_diff(n, k, v1_1, a0a1, p); // v^3a2^2 - a0a1
    var v2_temp[2][50] = find_Fp2_diff(n, k, a1_squared, a0a2, p); // a1^2 - a0a2

    var a0_cubed[2][50] = find_Fp2_product(n, k, a0, a0_squared, p);
    var a1_cubed[2][50] = find_Fp2_product(n, k, a1, a1_squared, p);
    var a2_cubed[2][50] = find_Fp2_product(n, k, a2, a2_squared, p);
    var a13v3[2][50] = find_Fp2_product(n, k, a1_cubed, v3, p);
    var a23v6[2][50] = find_Fp2_product(n, k, a2_cubed, v6, p);
    var a0a1a23v3[2][50] = find_Fp2_product(n, k, a0a1a2, three_v3, p);

    var denom_1[2][50] = find_Fp2_sum(n, k, a0_cubed, a13v3, p);
    var denom_2[2][50] = find_Fp2_diff(n, k, a23v6, a0a1a23v3, p);
    var denom[2][50] = find_Fp2_sum(n, k, denom_1, denom_2, p); // a0^3 + a1^3v^3 + a2^3v^6 - 3a0a1a2v^3

    var denom_inv[2][50] = find_Fp2_inverse(n, k, denom, p);

    var v0_final[2][50] = find_Fp2_product(n, k, v0_temp, denom_inv, p);
    var v1_final[2][50] = find_Fp2_product(n, k, v1_temp, denom_inv, p);
    var v2_final[2][50] = find_Fp2_product(n, k, v2_temp, denom_inv, p);

    for (var i = 1; i < 6; i = i + 2) {
        for (var j = 0; j < 2; j ++) {
            for (var m = 0; m < 50; m ++) {
                if (i > 1)
                out[i][j][m] = 0;
                else 
                out[i][j][m] = 0;//v3[j][m];
            }
        }
    }
    out[0] = v0_final;
    out[2] = v1_final;
    out[4] = v2_final;
    return out;
}


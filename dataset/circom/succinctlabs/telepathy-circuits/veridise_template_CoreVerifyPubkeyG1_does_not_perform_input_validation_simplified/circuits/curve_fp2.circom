pragma circom 2.0.3;

include "../../../dependencies/circomlib/circuits/bitify.circom";

include "./bigint.circom";
include "./bigint_func.circom";
include "./fp.circom";
include "./fp2.circom";
include "./fp12.circom";
include "./curve.circom";
include "./bls12_381_func.circom";

// in[i] = (x_i, y_i) 
// Implements constraint: (y_1 + y_3) * (x_2 - x_1) - (y_2 - y_1)*(x_1 - x_3) = 0 mod p
// used to show (x1, y1), (x2, y2), (x3, -y3) are co-linear
template PointOnLineFp2(n, k, p) {
    signal input in[3][2][2][k]; 

    var LOGK = log_ceil(k);
    var LOGK2 = log_ceil(6*k*k);
    assert(3*n + LOGK2 < 251);

    // AKA check point on line 
    component left = BigMultShortLong2D(n, k, 2); // 3 x 2k-1 registers abs val < 4k*2^{2n}
    for(var i = 0; i < 2; i ++) {
        for (var j = 0; j < k; j ++) {
            left.a[i][j] <== in[0][1][i][j] + in[2][1][i][j];
            left.b[i][j] <== in[1][0][i][j] - in[0][0][i][j];
        }
    }

    component right = BigMultShortLong2D(n, k, 2); // 3 x 2k-1 registers abs val < 2k*2^{2n}
    for(var i = 0; i < 2; i ++) {
        for (var j = 0; j < k; j ++) {
            right.a[i][j] <== in[1][1][i][j] - in[0][1][i][j];
            right.b[i][j] <== in[0][0][i][j] - in[2][0][i][j];
        }
    }
    
    component diff_red[2]; 
    diff_red[0] = PrimeReduce(n, k, k-1, p, 3*n + 2*LOGK + 2);
    diff_red[1] = PrimeReduce(n, k, k-1, p, 3*n + 2*LOGK + 1);
    for(var i=0; i<2*k-1; i++) {
        diff_red[0].in[i] <== left.out[0][i] - left.out[2][i] - right.out[0][i] + right.out[2][i];
        diff_red[1].in[i] <== left.out[1][i] - right.out[1][i]; 
    }
    // diff_red has k registers abs val < 6*k^2*2^{3n} -- to see this, easier to use SignedFp2MultiplyNoCarry instead of BigMultShortLong2D 
    component diff_mod[2];
    for (var j = 0; j < 2; j ++) {
        diff_mod[j] = SignedCheckCarryModToZero(n, k, 3*n + LOGK2, p);
        for (var i = 0; i < k; i ++) {
            diff_mod[j].in[i] <== diff_red[j].out[i];
        }
    }
}

// in = (x, y)
// Implements:
// x^3 + ax + b - y^2 = 0 mod p
// Assume: a, b in [0, 2^n). a, b are complex 
template PointOnCurveFp2(n, k, a, b, p){
    signal input in[2][2][k]; 

    var LOGK = log_ceil(k);
    var LOGK3 = log_ceil( (2*k-1)*(4*k*k) + 1 );
    assert(4*n + LOGK3 < 251);

    // compute x^3, y^2 
    component x_sq = SignedFp2MultiplyNoCarryUnequal(n, k, k, 2*n+1+LOGK); // 2k-1 registers in [0, 2*k*2^{2n}) 
    component y_sq = SignedFp2MultiplyNoCarryUnequal(n, k, k, 2*n+1+LOGK); // 2k-1 registers in [0, 2*k*2^{2n}) 
    for (var i = 0; i < 2; i ++) {
        for (var j = 0; j < k ; j ++) {
            x_sq.a[i][j] <== in[0][i][j];
            x_sq.b[i][j] <== in[0][i][j];
            y_sq.a[i][j] <== in[1][i][j];
            y_sq.b[i][j] <== in[1][i][j];
        }
    }
    component x_cu = SignedFp2MultiplyNoCarryUnequal(n, 2*k-1, k, 3*n+2*LOGK+2); // 3k-2 registers in [0, 4*k^2 * 2^{3n}) 
    for (var i = 0; i < 2; i ++) {
        for (var j = 0; j < 2*k-1; j ++) {
            x_cu.a[i][j] <== x_sq.out[i][j];
        }
        for (var j = 0; j < k; j ++) {
            x_cu.b[i][j] <== in[0][i][j];
        }
    }

    // x_cu + a x + b has 3k-2 registers < (4k^2 + 1/2^n + 1/2^2n)2^{3n} <= (4*k^2+2/2^n)2^{3n} 
    component cu_red[2];
    for (var j = 0; j < 2; j ++) {
        cu_red[j] = PrimeReduce(n, k, 2*k-2, p, 4*n + 3*LOGK + 4);
        for(var i=0; i<3*k-2; i++){
            if(i == 0) {
                if(j == 0)
                    cu_red[j].in[i] <== x_cu.out[j][i] + a[0] * in[0][0][i] - a[1] * in[0][1][i] + b[j];
                else
                    cu_red[j].in[i] <== x_cu.out[j][i] + a[0] * in[0][1][i] + a[1] * in[0][0][i] + b[j]; 
            }
            else{
                if(i < k){
                    if(j == 0)
                        cu_red[j].in[i] <== x_cu.out[j][i] + a[0] * in[0][0][i] - a[1] * in[0][1][i];
                    else
                        cu_red[j].in[i] <== x_cu.out[j][i] + a[0] * in[0][1][i] + a[1] * in[0][0][i]; 
                }
                else
                    cu_red[j].in[i] <== x_cu.out[j][i];
            }
        }
    }
    // cu_red has k registers < (2k-1)*(4*k^2+2/2^n)2^{4n} < 2^{4n + 3LOGK + 4}

    component y_sq_red[2]; // k registers < 2k^2*2^{3n} 
    for (var i = 0; i < 2; i ++) {
        y_sq_red[i] = PrimeReduce(n, k, k-1, p, 3*n + 2*LOGK + 1);
        for(var j=0; j<2*k-1; j++){
            y_sq_red[i].in[j] <== y_sq.out[i][j];
        }
    }

    component constraint[2];
    constraint[0] = SignedCheckCarryModToZero(n, k, 4*n + LOGK3, p);
    constraint[1] = SignedCheckCarryModToZero(n, k, 4*n + LOGK3, p);
    for(var i=0; i<k; i++){
        constraint[0].in[i] <== cu_red[0].out[i] - y_sq_red[0].out[i]; 
        constraint[1].in[i] <== cu_red[1].out[i] - y_sq_red[1].out[i];
    }
}

// in = x
// Implements:
// out = x^3 + ax + b mod p
// Assume: a, b are in Fp2, coefficients in [0, 2^n)
template EllipticCurveFunction(n, k, a, b, p){
    signal input in[2][k]; 
    signal output out[2][k];

    var LOGK = log_ceil(k);
    var LOGK3 = log_ceil( (2*k-1)*(4*k*k) + 1 );
    assert(4*n + LOGK3 < 251);

    // compute x^3, y^2 
    component x_sq = SignedFp2MultiplyNoCarryUnequal(n, k, k, 2*n+1+LOGK); // 2k-1 registers in [0, 2*k*2^{2n}) 
    for (var i = 0; i < 2; i ++) {
        for (var j = 0; j < k ; j ++) {
            x_sq.a[i][j] <== in[i][j];
            x_sq.b[i][j] <== in[i][j];
        }
    }
    component x_cu = SignedFp2MultiplyNoCarryUnequal(n, 2*k-1, k, 3*n+2*LOGK+2); // 3k-2 registers in [0, 4*k^2 * 2^{3n}) 
    for (var i = 0; i < 2; i ++) {
        for (var j = 0; j < 2*k-1; j ++) {
            x_cu.a[i][j] <== x_sq.out[i][j];
        }
        for (var j = 0; j < k; j ++) {
            x_cu.b[i][j] <== in[i][j];
        }
    }

    // x_cu + a x + b has 3k-2 registers < (4*k^2+1)2^{3n} 
    component cu_red[2];
    for (var j = 0; j < 2; j ++) {
        cu_red[j] = PrimeReduce(n, k, 2*k-2, p, 4*n + 3*LOGK + 4);
        for(var i=0; i<3*k-2; i++){
            if(i == 0) {
                if(j == 0)
                    cu_red[j].in[i] <== x_cu.out[j][i] + a[0] * in[0][i] - a[1] * in[1][i] + b[j];
                else
                    cu_red[j].in[i] <== x_cu.out[j][i] + a[0] * in[1][i] + a[1] * in[0][i] + b[j]; 
            }
            else{
                if(i < k){
                    if(j == 0)
                        cu_red[j].in[i] <== x_cu.out[j][i] + a[0] * in[0][i] - a[1] * in[1][i];
                    else
                        cu_red[j].in[i] <== x_cu.out[j][i] + a[0] * in[1][i] + a[1] * in[0][i]; 
                }
                else
                    cu_red[j].in[i] <== x_cu.out[j][i];
            }
        }
    }
    // cu_red has k registers < (2k-1)*(4*k^2+1)2^{4n} < 2^{4n + 3LOGK + 4}

    component carry = SignedFp2CarryModP(n, k, 4*n + LOGK3, p);
    for(var j=0; j<2; j++)for(var i=0; i<k; i++)
        carry.in[j][i] <== cu_red[j].out[i];
    
    for(var j=0; j<2; j++)for(var i=0; i<k; i++)
        out[j][i] <== carry.out[j][i];
}


// in[0] = (x_1, y_1), in[1] = (x_3, y_3) 
// Checks that the line between (x_1, y_1) and (x_3, -y_3) is equal to the tangent line to the elliptic curve at the point (x_1, y_1)
// Implements: 
// (y_1 + y_3) = lambda * (x_1 - x_3)
// where lambda = (3 x_1^2 + a)/(2 y_1) 
// Actual constraint is 2y_1 (y_1 + y_3) = (3 x_1^2 + a ) ( x_1 - x_3 )
// a is complex 
template PointOnTangentFp2(n, k, a, p){
    signal input in[2][2][2][k];
    
    var LOGK = log_ceil(k);
    var LOGK3 = log_ceil((2*k-1)*(12*k*k) + 1);
    assert(4*n + LOGK3 < 251);
    component x_sq = SignedFp2MultiplyNoCarryUnequal(n, k, k, 2*n+1+LOGK); // 2k-1 registers in [0, 2*k*2^{2n}) 
    for (var i = 0; i < 2; i ++) {
        for (var j = 0; j < k ; j ++) {
            x_sq.a[i][j] <== in[0][0][i][j];
            x_sq.b[i][j] <== in[0][0][i][j];
        }
    }
    component right = SignedFp2MultiplyNoCarryUnequal(n, 2*k-1, k, 3*n + 2*LOGK + 3); // 3k-2 registers < 2(6*k^2 + 2k/2^n)*2^{3n} 
    for(var i=0; i<2*k-1; i++){
        if(i == 0) {
            right.a[0][i] <== 3 * x_sq.out[0][i] + a[0]; // registers in [0, 3*k*2^{2n} + 2^n )  
            right.a[1][i] <== 3 * x_sq.out[1][i] + a[1];
        }
        else {
            right.a[0][i] <== 3 * x_sq.out[0][i];
            right.a[1][i] <== 3 * x_sq.out[1][i];
        }
    }
    for(var i=0; i<k; i++){
        right.b[0][i] <== in[0][0][0][i] - in[1][0][0][i]; 
        right.b[1][i] <== in[0][0][1][i] - in[1][0][1][i];
    }
    
    component left = SignedFp2MultiplyNoCarryUnequal(n, k, k, 2*n + 3 + LOGK); // 2k-1 registers in [0, 8k * 2^{2n})
    for(var i=0; i<k; i++){
        left.a[0][i] <== 2*in[0][1][0][i];
        left.a[1][i] <== 2*in[0][1][1][i];
        left.b[0][i] <== in[0][1][0][i] + in[1][1][0][i];
        left.b[1][i] <== in[0][1][1][i] + in[1][1][1][i];
    }
    
    // prime reduce right - left 
    component diff_red[2];
    for (var i = 0; i < 2; i ++) {
        diff_red[i] = PrimeReduce(n, k, 2*k-2, p, 4*n + LOGK3);
        for (var j = 0; j < 3*k-2; j ++) {
            if (j < 2*k-1) {
                diff_red[i].in[j] <== right.out[i][j] - left.out[i][j];
            }
            else {
                diff_red[i].in[j] <== right.out[i][j];
            }
        }
    }
    // inputs of diff_red has registers < (12k^2 + 12k/2^n)*2^{3n} 
    // diff_red.out has registers < ((2k-1)*12k^2 + 1) * 2^{4n} assuming 12k(2k-1) <= 2^n
    component constraint[2];
    for (var i = 0; i < 2; i ++) {
        constraint[i] = SignedCheckCarryModToZero(n, k, 4*n + LOGK3, p);
        for (var j = 0; j < k; j ++) {
            constraint[i].in[j] <== diff_red[i].out[j];
        }
    }
}

// requires x_1 != x_2
// assume p is size k array, the prime that curve lives over 
//
// Implements:
//  Given a = (x_1, y_1) and b = (x_2, y_2), 
//      assume x_1 != x_2 and a != -b, 
//  Find a + b = (x_3, y_3)
// By solving:
//  x_1 + x_2 + x_3 - lambda^2 = 0 mod p
//  y_3 = lambda (x_1 - x_3) - y_1 mod p
//  where lambda = (y_2-y_1)/(x_2-x_1) is the slope of the line between (x_1, y_1) and (x_2, y_2)
// these equations are equivalent to:
//  (x_1 + x_2 + x_3)*(x_2 - x_1)^2 = (y_2 - y_1)^2 mod p
//  (y_1 + y_3)*(x_2 - x_1) = (y_2 - y_1)*(x_1 - x_3) mod p
template EllipticCurveAddUnequalFp2(n, k, p) { 
    signal input a[2][2][k];
    signal input b[2][2][k];

    signal output out[2][2][k];

    var LOGK = log_ceil(k);
    var LOGK3 = log_ceil( (12*k*k)*(2*k-1) + 1); 
    assert(4*n + LOGK3 + 2< 251);

    // precompute lambda and x_3 and then y_3
    var dy[2][50] = find_Fp2_diff(n, k, b[1], a[1], p);
    var dx[2][50] = find_Fp2_diff(n, k, b[0], a[0], p); 
    var dx_inv[2][50] = find_Fp2_inverse(n, k, dx, p);
    var lambda[2][50] = find_Fp2_product(n, k, dy, dx_inv, p);
    var lambda_sq[2][50] = find_Fp2_product(n, k, lambda, lambda, p);
    // out[0] = x_3 = lamb^2 - a[0] - b[0] % p
    // out[1] = y_3 = lamb * (a[0] - x_3) - a[1] % p
    var x3[2][50] = find_Fp2_diff(n, k, find_Fp2_diff(n, k, lambda_sq, a[0], p), b[0], p);
    var y3[2][50] = find_Fp2_diff(n, k, find_Fp2_product(n, k, lambda, find_Fp2_diff(n, k, a[0], x3, p), p), a[1], p);

    for(var i = 0; i < k; i++){
        out[0][0][i] <-- x3[0][i];
        out[0][1][i] <-- x3[1][i];
        out[1][0][i] <-- y3[0][i];
        out[1][1][i] <-- y3[1][i];
    }
    
    // constrain x_3 by CUBIC (x_1 + x_2 + x_3) * (x_2 - x_1)^2 - (y_2 - y_1)^2 = 0 mod p
    
    component dx_sq = BigMultShortLong2D(n, k, 2); // 2k-1 registers abs val < 2k*2^{2n} 
    component dy_sq = BigMultShortLong2D(n, k, 2); // 2k-1 registers abs val < 2k*2^{2n}
    for (var i = 0; i < 2; i ++) {
        for (var j = 0; j < k; j ++) {
            dx_sq.a[i][j] <== b[0][i][j] - a[0][i][j];
            dx_sq.b[i][j] <== b[0][i][j] - a[0][i][j];
            dy_sq.a[i][j] <== b[1][i][j] - a[1][i][j];
            dy_sq.b[i][j] <== b[1][i][j] - a[1][i][j];
        }
    }

    // x_1 + x_2 + x_3 has registers in [0, 3*2^n) 
    component cubic = BigMultShortLong2DUnequal(n, k, 2*k-1, 2, 2); // 3k-2 x 3 registers < 12 * k^2 * 2^{3n} ) 
    for(var i=0; i<k; i++) {
        cubic.a[0][i] <== a[0][0][i] + b[0][0][i] + out[0][0][i]; 
        cubic.a[1][i] <== a[0][1][i] + b[0][1][i] + out[0][1][i];
    }
    for(var i=0; i<2*k-1; i++){
        cubic.b[0][i] <== dx_sq.out[0][i] - dx_sq.out[2][i];
        cubic.b[1][i] <== dx_sq.out[1][i];
    }

    component cubic_red[2];
    cubic_red[0] = PrimeReduce(n, k, 2*k-2, p, 4*n + LOGK3 + 2);
    cubic_red[1] = PrimeReduce(n, k, 2*k-2, p, 4*n + LOGK3 + 2);
    for(var i=0; i<2*k-1; i++) {
        // get i^2 parts too!
        cubic_red[0].in[i] <== cubic.out[0][i] - cubic.out[2][i] - dy_sq.out[0][i] + dy_sq.out[2][i]; // registers abs val < 12*k^2*2^{3n} + 2k*2^{2n} <= (12k^2 + 2k/2^n) * 2^{3n}
        cubic_red[1].in[i] <== cubic.out[1][i] - dy_sq.out[1][i]; // registers in < 12*k^2*2^{3n} + 4k*2^{2n} < (12k+1)k * 2^{3n} )
    }
    for(var i=2*k-1; i<3*k-2; i++) {
        cubic_red[0].in[i] <== cubic.out[0][i] - cubic.out[2][i]; 
        cubic_red[1].in[i] <== cubic.out[1][i];
    }
    // cubic_red has k registers < ((2k-1)*12k^2+1) * 2^{4n} assuming 2k(2k-1) <= 2^n
    
    component cubic_mod[2];
    cubic_mod[0] = SignedCheckCarryModToZero(n, k, 4*n + LOGK3 + 2, p);
    cubic_mod[1] = SignedCheckCarryModToZero(n, k, 4*n + LOGK3 + 2, p);
    for(var i=0; i<k; i++) {
        cubic_mod[0].in[i] <== cubic_red[0].out[i];
        cubic_mod[1].in[i] <== cubic_red[1].out[i];
    }
    // END OF CONSTRAINING x3
    
    // constrain y_3 by (y_1 + y_3) * (x_2 - x_1) = (y_2 - y_1)*(x_1 - x_3) mod p
    component y_constraint = PointOnLineFp2(n, k, p); 
    for(var i = 0; i < k; i++)for(var j=0; j<2; j++){
        for(var ind = 0; ind < 2; ind ++) {
            y_constraint.in[0][j][ind][i] <== a[j][ind][i];
            y_constraint.in[1][j][ind][i] <== b[j][ind][i];
            y_constraint.in[2][j][ind][i] <== out[j][ind][i];
        }
    }
    // END OF CONSTRAINING y3

    // check if out[][] has registers in [0, 2^n)
    component range_check[2];
    range_check[0] = RangeCheck2D(n, k);
    range_check[1] = RangeCheck2D(n, k);
    for(var j=0; j<2; j++)for(var i=0; i<k; i++) {
        range_check[0].in[j][i] <== out[0][j][i];
        range_check[1].in[j][i] <== out[1][j][i];
    }
}

// Elliptic curve is E : y**2 = x**3 + ax + b
// assuming a < 2^n for now, b is complex
// Note that for BLS12-381 twisted, a = 0, b = 4+4u

// Implements:
// computing 2P on elliptic curve E for P = (x_1, y_1)
// formula from https://crypto.stanford.edu/pbc/notes/elliptic/explicit.html
// x_1 = in[0], y_1 = in[1]
// assume y_1 != 0 (otherwise 2P = O)

// lamb =  (3x_1^2 + a) / (2 y_1) % p
// x_3 = out[0] = lambda^2 - 2 x_1 % p
// y_3 = out[1] = lambda (x_1 - x_3) - y_1 % p

// We precompute (x_3, y_3) and then constrain by showing that:
// * (x_3, y_3) is a valid point on the curve 
// * the slope (y_3 - y_1)/(x_3 - x_1) equals 
// * x_1 != x_3 
template EllipticCurveDoubleFp2(n, k, a, b, p) {
    signal input in[2][2][k];
    signal output out[2][2][k];

    var long_a[2][k];
    var long_3[2][k];
    long_a[0][0] = a[0];
    long_3[0][0] = 3;
    long_a[1][0] = a[1];
    long_3[1][0] = 0;
    for (var i = 1; i < k; i++) {
        long_a[0][i] = 0;
        long_3[0][i] = 0;
        long_a[1][i] = 0;
        long_3[1][i] = 0;
    }

    // precompute lambda 
    var lamb_num[2][50] = find_Fp2_sum(n, k, long_a, find_Fp2_product(n, k, long_3, find_Fp2_product(n, k, in[0], in[0], p), p), p);
    var lamb_denom[2][50] = find_Fp2_sum(n, k, in[1], in[1], p);
    var lamb[2][50] = find_Fp2_product(n, k, lamb_num, find_Fp2_inverse(n, k, lamb_denom, p), p);

    // precompute x_3, y_3
    var x3[2][50] = find_Fp2_diff(n, k, find_Fp2_product(n, k, lamb, lamb, p), find_Fp2_sum(n, k, in[0], in[0], p), p);
    var y3[2][50] = find_Fp2_diff(n, k, find_Fp2_product(n, k, lamb, find_Fp2_diff(n, k, in[0], x3, p), p), in[1], p);
    
    for(var i=0; i<k; i++){
        out[0][0][i] <-- x3[0][i];
        out[0][1][i] <-- x3[1][i];
        out[1][0][i] <-- y3[0][i];
        out[1][1][i] <-- y3[1][i];
    }
    // check if out[][] has registers in [0, 2^n)
    component range_check[2];
    range_check[0] = RangeCheck2D(n, k);
    range_check[1] = RangeCheck2D(n, k);
    for(var j=0; j<2; j++)for(var i=0; i<k; i++) {
        range_check[0].in[j][i] <== out[0][j][i];
        range_check[1].in[j][i] <== out[1][j][i];
    }

    component point_on_tangent = PointOnTangentFp2(n, k, a, p);
    for(var j=0; j<2; j++)for(var i=0; i<k; i++){
        point_on_tangent.in[0][j][0][i] <== in[j][0][i];
        point_on_tangent.in[0][j][1][i] <== in[j][1][i];
        point_on_tangent.in[1][j][0][i] <== out[j][0][i];
        point_on_tangent.in[1][j][1][i] <== out[j][1][i];
    }
    
    component point_on_curve = PointOnCurveFp2(n, k, a, b, p);
    for(var j=0; j<2; j++)for(var i=0; i<k; i++) {
        point_on_curve.in[j][0][i] <== out[j][0][i];
        point_on_curve.in[j][1][i] <== out[j][1][i];
    }
    
    component x3_eq_x1 = Fp2IsEqual(n, k, p);
    for(var j=0; j<2; j++)for(var i = 0; i < k; i++){
        x3_eq_x1.a[j][i] <== out[0][j][i];
        x3_eq_x1.b[j][i] <== in[0][j][i];
    }
    x3_eq_x1.out === 0;
}

// Fp2 curve y^2 = x^3 + a2*x + b2 with b2 complex
// Assume curve has no Fp2 points of order 2, i.e., x^3 + a2*x + b2 has no Fp2 roots
// Fact: ^ this is the case for BLS12-381 twisted E2 and its 3-isogeny E2'
// If isInfinity = 1, replace `out` with `a` so if `a` was on curve, so is output
template EllipticCurveAddFp2(n, k, a2, b2, p){
    signal input a[2][2][k];
    signal input aIsInfinity;
    signal input b[2][2][k];
    signal input bIsInfinity;
    
    signal output out[2][2][k];
    signal output isInfinity;

    component x_equal = Fp2IsEqual(n, k, p);
    component y_equal = Fp2IsEqual(n, k, p);

    for(var i=0; i<2; i++)for(var idx=0; idx<k; idx++){
        x_equal.a[i][idx] <== a[0][i][idx];
        x_equal.b[i][idx] <== b[0][i][idx];

        y_equal.a[i][idx] <== a[1][i][idx];
        y_equal.b[i][idx] <== b[1][i][idx];
    }
    // if a.x = b.x then a = +-b 
    // if a = b then a + b = 2*a so we need to do point doubling  
    // if a = -a then out is infinity
    signal add_is_double;
    add_is_double <== x_equal.out * y_equal.out; // AND gate
    
    // if a.x = b.x, need to replace b.x by a different number just so AddUnequal doesn't break
    // I will do this in a dumb way: replace b[0][0][0] by (b[0][0][0] == 0)
    component iz = IsZero(); 
    iz.in <== b[0][0][0]; 
    
    component add = EllipticCurveAddUnequalFp2(n, k, p);
    component doub = EllipticCurveDoubleFp2(n, k, a2, b2, p);
    for(var i=0; i<2; i++)for(var j=0; j<2; j++)for(var idx=0; idx<k; idx++){
        add.a[i][j][idx] <== a[i][j][idx];
        if(i==0 && j==0 && idx==0)
            add.b[i][j][idx] <== b[i][j][idx] + x_equal.out * (iz.out - b[i][j][idx]); 
        else
            add.b[i][j][idx] <== b[i][j][idx]; 
        
        doub.in[i][j][idx] <== a[i][j][idx];
    }
    
    // out = O iff ( a = O AND b = O ) OR ( x_equal AND NOT y_equal ) 
    signal ab0;
    ab0 <== aIsInfinity * bIsInfinity; 
    signal anegb;
    anegb <== x_equal.out - x_equal.out * y_equal.out; 
    isInfinity <== ab0 + anegb - ab0 * anegb; // OR gate

    signal tmp[3][2][2][k]; 
    for(var i=0; i<2; i++)for(var j=0; j<2; j++)for(var idx=0; idx<k; idx++){
        tmp[0][i][j][idx] <== add.out[i][j][idx] + add_is_double * (doub.out[i][j][idx] - add.out[i][j][idx]); 
        // if a = O, then a + b = b 
        tmp[1][i][j][idx] <== tmp[0][i][j][idx] + aIsInfinity * (b[i][j][idx] - tmp[0][i][j][idx]);
        // if b = O, then a + b = a
        tmp[2][i][j][idx] <== tmp[1][i][j][idx] + bIsInfinity * (a[i][j][idx] - tmp[1][i][j][idx]);
        out[i][j][idx] <== tmp[2][i][j][idx] + isInfinity * (a[i][j][idx] - tmp[2][i][j][idx]);
    }
}


// Curve E2 : y^2 = x^3 + b
// Inputs:
//  in = P is 2 x 2 x k array where P = (x, y) is a point in E2(Fp2) 
//  inIsInfinity = 1 if P = O, else = 0
// Output:
//  out = [x]P is 2 x 2 x k array representing a point in E2(Fp2)
//  isInfinity = 1 if [x]P = O, else = 0
// Assume:
//  E2 has no Fp2 points of order 2
//  x in [0, 2^250) 
//  `in` is point in E2 even if inIsInfinity = 1 just so nothing goes wrong
//  E2(Fp2) has no points of order 2
template EllipticCurveScalarMultiplyFp2(n, k, b, x, p){
    signal input in[2][2][k];
    signal input inIsInfinity;

    signal output out[2][2][k];
    signal output isInfinity;

    var LOGK = log_ceil(k);
        
    var Bits[250]; 
    var BitLength;
    var SigBits=0;
    for (var i = 0; i < 250; i++) {
        Bits[i] = (x >> i) & 1;
        if(Bits[i] == 1){
            SigBits++;
            BitLength = i + 1;
        }
    }

    signal R[BitLength][2][2][k]; 
    signal R_isO[BitLength]; 
    component Pdouble[BitLength];
    component Padd[SigBits];
    var curid=0;

    // if in = O then [x]O = O so there's no point to any of this
    signal P[2][2][k];
    for(var j=0; j<2; j++)for(var idx=0; idx<k; idx++)for(var l=0; l<2; l++)
        P[j][l][idx] <== in[j][l][idx];
    
    for(var i=BitLength - 1; i>=0; i--){
        if( i == BitLength - 1 ){
            for(var j=0; j<2; j++)for(var idx=0; idx<k; idx++)for(var l=0; l<2; l++){
                R[i][j][l][idx] <== P[j][l][idx];
            }
            R_isO[i] <== 0; 
        }else{
            // E2(Fp2) has no points of order 2, so the only way 2*R[i+1] = O is if R[i+1] = O 
            Pdouble[i] = EllipticCurveDoubleFp2(n, k, [0,0], b, p);  
            for(var j=0; j<2; j++)for(var idx=0; idx<k; idx++)for(var l=0; l<2; l++)
                Pdouble[i].in[j][l][idx] <== R[i+1][j][l][idx]; 
            
            if(Bits[i] == 0){
                for(var j=0; j<2; j++)for(var idx=0; idx<k; idx++)for(var l=0; l<2; l++)
                    R[i][j][l][idx] <== Pdouble[i].out[j][l][idx];
                R_isO[i] <== R_isO[i+1]; 
            }else{
                // Padd[curid] = Pdouble[i] + P 
                Padd[curid] = EllipticCurveAddFp2(n, k, [0,0], b, p); 
                for(var j=0; j<2; j++)for(var l=0; l<2; l++)for(var idx=0; idx<k; idx++){
                    Padd[curid].a[j][l][idx] <== Pdouble[i].out[j][l][idx]; 
                    Padd[curid].b[j][l][idx] <== P[j][l][idx];
                }
                Padd[curid].aIsInfinity <== R_isO[i+1];
                Padd[curid].bIsInfinity <== 0;

                R_isO[i] <== Padd[curid].isInfinity; 
                for(var j=0; j<2; j++)for(var l=0; l<2; l++)for(var idx=0; idx<k; idx++){
                    R[i][j][l][idx] <== Padd[curid].out[j][l][idx];
                }
                curid++;
            }
        }
    }
    // output = O if input = O or R[0] = O 
    isInfinity <== inIsInfinity + R_isO[0] - inIsInfinity * R_isO[0]; 
    for(var i=0; i<2; i++)for(var j=0; j<2; j++)for(var idx=0; idx<k; idx++)
        out[i][j][idx] <== R[0][i][j][idx] + isInfinity * (in[i][j][idx] - R[0][i][j][idx]);
}


// Curve E2 : y^2 = x^3 + b
// Inputs:
//  in = P is 2 x 2 x k array where P = (x, y) is a point in E2(Fp2) 
// Output:
//  out = [x]P is 2 x 2 x k array representing a point in E2(Fp2)
// Assume:
//  E2 has no Fp2 points of order 2 
//  x in [0, 2^250) 
//  P has order > x, so in double-and-add loop we never hit point at infinity, and only add unequal is allowed: constraint will fail if add unequal fails 
template EllipticCurveScalarMultiplyUnequalFp2(n, k, b, x, p){
    signal input in[2][2][k];
    signal output out[2][2][k];

    var LOGK = log_ceil(k);
        
    var Bits[250]; 
    var BitLength;
    var SigBits=0;
    for (var i = 0; i < 250; i++) {
        Bits[i] = (x >> i) & 1;
        if(Bits[i] == 1){
            SigBits++;
            BitLength = i + 1;
        }
    }

    signal R[BitLength][2][2][k]; 
    component Pdouble[BitLength];
    component Padd[SigBits];
    component add_exception[SigBits];
    var curid=0;

    for(var i=BitLength - 1; i>=0; i--){
        if( i == BitLength - 1 ){
            for(var j=0; j<2; j++)for(var idx=0; idx<k; idx++)for(var l=0; l<2; l++){
                R[i][j][l][idx] <== in[j][l][idx];
            }
        }else{
            // Assuming E2 has no points of order 2, so double never fails 
            // To remove this assumption, just add a check that Pdouble[i].y != 0
            Pdouble[i] = EllipticCurveDoubleFp2(n, k, [0,0], b, p);  
            for(var j=0; j<2; j++)for(var idx=0; idx<k; idx++)for(var l=0; l<2; l++)
                Pdouble[i].in[j][l][idx] <== R[i+1][j][l][idx]; 
            
            if(Bits[i] == 0){
                for(var j=0; j<2; j++)for(var idx=0; idx<k; idx++)for(var l=0; l<2; l++)
                    R[i][j][l][idx] <== Pdouble[i].out[j][l][idx];
            }else{
                // Constrain Pdouble[i].x != P.x 
                add_exception[curid] = Fp2IsEqual(n, k, p);
                for(var j=0; j<2; j++)for(var idx=0; idx<k; idx++){
                    add_exception[curid].a[j][idx] <== Pdouble[i].out[0][j][idx];
                    add_exception[curid].b[j][idx] <== in[0][j][idx];
                }
                add_exception[curid].out === 0;
        
                // Padd[curid] = Pdouble[i] + P 
                Padd[curid] = EllipticCurveAddUnequalFp2(n, k, p); 
                for(var j=0; j<2; j++)for(var l=0; l<2; l++)for(var idx=0; idx<k; idx++){
                    Padd[curid].a[j][l][idx] <== Pdouble[i].out[j][l][idx]; 
                    Padd[curid].b[j][l][idx] <== in[j][l][idx];
                }
                for(var j=0; j<2; j++)for(var l=0; l<2; l++)for(var idx=0; idx<k; idx++){
                    R[i][j][l][idx] <== Padd[curid].out[j][l][idx];
                }
                curid++;
            }
        }
    }
    for(var i=0; i<2; i++)for(var j=0; j<2; j++)for(var idx=0; idx<k; idx++)
        out[i][j][idx] <== R[0][i][j][idx];
}



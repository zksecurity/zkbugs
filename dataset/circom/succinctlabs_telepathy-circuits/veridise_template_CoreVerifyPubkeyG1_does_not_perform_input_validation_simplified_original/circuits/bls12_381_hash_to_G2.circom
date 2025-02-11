pragma circom 2.0.3;

include "bigint.circom";
include "bigint_func.circom";
include "fp.circom";
include "fp2.circom";
include "curve.circom";
include "curve_fp2.circom";
include "bls12_381_func.circom";

/* 
implementation of optimized simplified SWU map to BLS12-381 G2
following Wahby-Boneh: Section 4.2 of https://eprint.iacr.org/2019/403.pdf
Python reference code: https://github.com/algorand/bls_sigs_ref/blob/master/python-impl/opt_swu_g2.py
Additional exposition: https://hackmd.io/@benjaminion/bls12-381#Simplified-SWU-map

E2 is y^2 = x^3 + 4(1+u) over Fp2
E2' is a curve of form y^2 = x^3 + a x + b that is 3-isogenous to E2
Constants are a = 240 u, b = 1012 + 1012 u where u = sqrt(-1)
*/

// Simplified SWU map, optimized and adapted to E2' 
// in = t: 2 x k array, element of Fp2 
// out: 2 x 2 x k array, point (out[0], out[1]) on curve E2' 
// 
// This is osswu2_help(t) in Python reference code
// See Section 4.2 of Wahby-Boneh: https://eprint.iacr.org/2019/403.pdf
// circom implementation is slightly different since sqrt and inversion are cheap
template OptSimpleSWU2(n, k){
    signal input in[2][k];
    signal output out[2][2][k]; 
    //signal output isInfinity; optimized simple SWU should never return point at infinity, exceptional case still returns a normal point 
    
    var p[50] = get_BLS12_381_prime(n, k);
    
    var a[2] = [0, 240];
    var b[2] = [1012, 1012];
    
    // distinguished non-square in Fp2 for SWU map: xi = -2 - u 
    // this is Z in the suite 8.8.2 of https://datatracker.ietf.org/doc/html/draft-irtf-cfrg-hash-to-curve-14#section-10
    var xi[2] = [-2, -1];

    var LOGK = log_ceil(k);
    // in = t, compute t^2, t^3
    component t_sq = SignedFp2MultiplyNoCarryCompress(n, k, p, n, 3*n + 2*LOGK + 1 );
    for(var i=0; i<2; i++)for(var idx=0; idx<k; idx++){
        t_sq.a[i][idx] <== in[i][idx];
        t_sq.b[i][idx] <== in[i][idx];
    }
    // compute xi * t^2 
    component xi_t_sq = SignedFp2CarryModP(n, k, 3*n + 2*LOGK + 3, p);
    for(var idx=0; idx<k; idx++){
        xi_t_sq.in[0][idx] <== xi[0] * t_sq.out[0][idx] - xi[1] * t_sq.out[1][idx];
        xi_t_sq.in[1][idx] <== xi[0] * t_sq.out[1][idx] + xi[1] * t_sq.out[0][idx];
    }

    // xi^2 * t^4
    component xi2t4 = SignedFp2MultiplyNoCarryCompress(n, k, p, n, 3*n + 2*LOGK + 1); 
    for(var i=0; i<2; i++)for(var idx=0; idx<k; idx++){
        xi2t4.a[i][idx] <== xi_t_sq.out[i][idx];
        xi2t4.b[i][idx] <== xi_t_sq.out[i][idx];
    }
    // xi^2 * t^4 + xi * t^2
    var num_den_common[2][k];
    for(var i=0; i<2; i++)for(var idx=0; idx<k; idx++)
        num_den_common[i][idx] = xi2t4.out[i][idx] + xi_t_sq.out[i][idx];
    
    // X0(t) = b (xi^2 * t^4 + xi * t^2 + 1) / (-a * (xi^2 * t^4 + xi * t^2)) 
    component X0_den = SignedFp2CarryModP(n, k, 3*n + 2*LOGK + 2 + 9, p);
    for(var idx=0; idx<k; idx++){
        X0_den.in[0][idx] <== -a[0] * num_den_common[0][idx] + a[1] * num_den_common[1][idx];
        X0_den.in[1][idx] <== -a[0] * num_den_common[1][idx] - a[1] * num_den_common[0][idx];
    }

    // if X0_den = 0, replace with X1_den = a * xi; this way X1(t) = X0_num / X1_den = b / (xi * a)
    // X1_den = a * xi = 240 - 480 i 
    assert( n == 55 && k == 7 );
    var X1_den[2][k];
    if( n == 55 && k == 7 ){
        X1_den = [[240,0,0,0,0,0,0],
                [35747322042230987,36025922209447795,1084959616957103,7925923977987733,16551456537884751,23443114579904617,1829881462546425]];
    }

    // Exception if X0_den = 0: 
    component exception = Fp2IsZero(n, k, p);
    for(var i=0; i<2; i++)for(var idx=0; idx<k; idx++)
        exception.in[i][idx] <== X0_den.out[i][idx];
    //isInfinity <== exception.out; 
    
    num_den_common[0][0]++;
    component X0_num = SignedFp2CarryModP(n, k, 3*n + 2*LOGK + 2 + 11, p);
    for(var idx=0; idx<k; idx++){
        X0_num.in[0][idx] <== b[0] * num_den_common[0][idx] - b[1] * num_den_common[1][idx];
        X0_num.in[1][idx] <== b[0] * num_den_common[1][idx] + b[1] * num_den_common[0][idx];
    }
    // division is same cost/constraints as multiplication, so we will compute X0 and avoid using projective coordinates 
    component X0 = SignedFp2Divide(n, k, n, n, p);
    for(var i=0; i<2; i++)for(var idx=0; idx<k; idx++){
        X0.a[i][idx] <== X0_num.out[i][idx];
        X0.b[i][idx] <== X0_den.out[i][idx] + exception.out * (X1_den[i][idx] - X0_den.out[i][idx]);
    }
    
    // g(x) = x^3 + a x + b 
    // Compute g(X0(t)) 
    component gX0 = EllipticCurveFunction(n, k, a, b, p);
    // X1(t) = xi * t^2 * X0(t)
    component X1 = Fp2Multiply(n, k, p);

    for(var i=0; i<2; i++)for(var idx=0; idx<k; idx++){
        gX0.in[i][idx] <== X0.out[i][idx];
        X1.a[i][idx] <== xi_t_sq.out[i][idx];
        X1.b[i][idx] <== X0.out[i][idx];
    }
    
    component xi3t6 = Fp2MultiplyThree(n, k, p); // shares a hidden component with xi2t4; I'll let compiler optimize that out for readability
    for(var i=0; i<2; i++)for(var idx=0; idx<k; idx++){ 
        xi3t6.a[i][idx] <== xi_t_sq.out[i][idx];
        xi3t6.b[i][idx] <== xi_t_sq.out[i][idx];
        xi3t6.c[i][idx] <== xi_t_sq.out[i][idx];
    }
    // g(X1(t)) = xi^3 * t^6 * g(X0(t)) 
    component gX1 = Fp2Multiply(n, k, p);
    for(var i=0; i<2; i++)for(var idx=0; idx<k; idx++){ 
        gX1.a[i][idx] <== xi3t6.out[i][idx];
        gX1.b[i][idx] <== gX0.out[i][idx];
    }
    /* 
    xi^3 is not a square, so one of gX0, gX1 must be a square 
    isSquare = 1 if gX0 is a square, = 0 if gX1 is a square
    sqrt = sqrt(gX0) if isSquare = 1, sqrt = sqrt(gX1) if isSquare = 0

    Implementation is special to p^2 = 9 mod 16
    References:
        p. 9 of https://eprint.iacr.org/2019/403.pdf
        F.2.1.1 for general version for any field: https://datatracker.ietf.org/doc/html/draft-irtf-cfrg-hash-to-curve-14#appendix-F.2.1.1

    I do not use the trick for combining division and sqrt from Section 5 of 
    Bernstein, Duif, Lange, Schwabe, and Yang, "High-speed high-security signatures",
    since division is cheap in circom
    */
    
    signal isSquare;
    
    // Precompute sqrt_candidate = gX0^{(p^2 + 7) / 16} 
    // p^2 + 7
    var c1[50] = long_add_unequal(n, 2*k, 1, prod(n, k, p, p), [7]);
    // (p^2 + 7) // 16
    var c2[2][50] = long_div2(n, 1, 2*k-1, c1, [16]); 

    assert( c2[1][0] == 0 ); // assert p^2 + 7 is divisible by 16

    var sqrt_candidate[2][50] = find_Fp2_exp(n, k, gX0.out, p, c2[0]);
    // if gX0 is a square, square root must be sqrt_candidate * (8th-root of unity) 
    // -1 is a square in Fp2 (because p^2 - 1 is even) so we only need to check half of the 8th roots of unity
    var roots[4][2][50] = get_roots_of_unity(n, k);
    var sqrt_witness[2][2][50];
    for(var i=0; i<2; i++)for(var j=0; j<2; j++)for(var idx=0; idx<k; idx++)
        sqrt_witness[i][j][idx] = 0;

    var is_square = 0;
    for(var i=0; i<4; i++){
        var sqrt_tmp[2][50] = find_Fp2_product(n, k, sqrt_candidate, roots[i], p); 
        if(is_equal_Fp2(n, k, find_Fp2_product(n, k, sqrt_tmp, sqrt_tmp, p), gX0.out) == 1){
            is_square = 1;
            sqrt_witness[0] = sqrt_tmp;
        }
    }
    isSquare <-- is_square;
    isSquare * (1-isSquare) === 0; 
    
    var is_square1 = 0;
    var etas[4][2][50] = get_etas(n, k);
    // find square root of gX1 
    // square root of gX1 must be = sqrt_candidate * t^3 * eta 
    // for one of four precomputed values of eta
    // eta determined by eta^2 = xi^3 * (-1)^{-1/4}  
    var t_cu[2][50] = find_Fp2_product(n, k, find_Fp2_product(n, k, in, in, p), in, p);
    sqrt_candidate = find_Fp2_product(n, k, sqrt_candidate, t_cu, p);
    
    for(var i=0; i<4; i++){
        var sqrt_tmp[2][50] = find_Fp2_product(n, k, sqrt_candidate, etas[i], p); 
        if(is_equal_Fp2(n, k, find_Fp2_product(n, k, sqrt_tmp, sqrt_tmp, p), gX1.out) == 1){
            is_square1 = 1;
            sqrt_witness[1] = sqrt_tmp;
        }
    }
    assert(is_square == 1 || is_square1 == 1); // one of gX0 or gX1 must be a square!
        
     
    // X = out[0] = X0 if isSquare == 1, else X = X1    
    for(var i=0; i<2; i++)for(var idx=0; idx<k; idx++)
        out[0][i][idx] <== isSquare * (X0.out[i][idx] - X1.out[i][idx]) + X1.out[i][idx];  

    // sgn0(t) 
    component sgn_in = Fp2Sgn0(n, k, p);
    for(var i=0; i<2; i++)for(var idx=0; idx<k; idx++)
        sgn_in.in[i][idx] <== in[i][idx];

    var Y[2][50];
    for(var i=0; i<2; i++)for(var idx=0; idx<k; idx++)
        Y[i][idx] = is_square * sqrt_witness[0][i][idx] + (1-is_square) * sqrt_witness[1][i][idx];
    // Y = out[1] = +- sqrt_witness; sign determined by sgn0(Y) = sgn0(t) 
    
    if(get_fp2_sgn0(k, Y) != sgn_in.out){
        Y[0] = long_sub(n, k, p, Y[0]);
        Y[1] = long_sub(n, k, p, Y[1]);
    } 
    
    component Y_sq = Fp2Multiply(n, k, p);
    // Y^2 == g(X) 
    for(var i=0; i<2; i++)for(var idx=0; idx<k; idx++){
        out[1][i][idx] <-- Y[i][idx];
        Y_sq.a[i][idx] <== out[1][i][idx];
        Y_sq.b[i][idx] <== out[1][i][idx];
    }
    for(var i=0; i<2; i++)for(var idx=0; idx<k; idx++){
        Y_sq.out[i][idx] === isSquare * (gX0.out[i][idx] - gX1.out[i][idx]) + gX1.out[i][idx]; 
    }

    // sgn0(Y) == sgn0(t)
    component sgn_Y = Fp2Sgn0(n, k, p);
    for(var i=0; i<2; i++)for(var idx=0; idx<k; idx++)
        sgn_Y.in[i][idx] <== out[1][i][idx];

    sgn_Y.out === sgn_in.out;
    
}

/*
3-Isogeny from E2' to E2
References:
    Appendix E.3 of https://datatracker.ietf.org/doc/html/draft-irtf-cfrg-hash-to-curve-14#appendix-E.3
    Section 4.3 of Wahby-Boneh: https://eprint.iacr.org/2019/403.pdf
    iso3(P) in Python reference code: https://github.com/algorand/bls_sigs_ref/blob/master/python-impl/opt_swu_g2.py
*/ 

// Input:
//  in = (x', y') point on E2' assumed to not be point at infinity
//  inIsInfinity = 1 if input is point at infinity on E2' (in which case x', y' are arbitrary)
// Output:
//  out = (x, y) is point on E2 after applying 3-isogeny to in 
//  isInfinity = 1 if one of exceptional cases occurs and output should be point at infinity
// Exceptions:
//  inIsInfinity = 1
//  input is a pole of the isogeny, i.e., x_den or y_den = 0 
template Iso3Map(n, k){
    signal input in[2][2][k];
    //signal input inIsInfinity;
    signal output out[2][2][k];
    signal output isInfinity;
    
    var p[50] = get_BLS12_381_prime(n, k);
    
    // load coefficients of the isogeny (precomputed)
    var coeffs[4][4][2][50] = get_iso3_coeffs(n, k);

    // x = x_num / x_den
    // y = y' * y_num / y_den
    // x_num = sum_{i=0}^3 coeffs[0][i] * x'^i
    // x_den = x'^2 + coeffs[1][1] * x' + coeffs[1][0] 
    // y_num = sum_{i=0}^3 coeffs[2][i] * x'^i
    // y_den = x'^3 + sum_{i=0}^2 coeffs[3][i] * x'^i
  
    var LOGK = log_ceil(k); 
    component xp2_nocarry = SignedFp2MultiplyNoCarry(n, k, 2*n + LOGK + 1); 
    component xp2 = SignedFp2CompressCarry(n, k, k-1, 2*n+LOGK+1, p);
    component xp3_nocarry = SignedFp2MultiplyNoCarryUnequal(n, 2*k-1, k, 3*n + 2*LOGK + 2); 
    component xp3 = SignedFp2CompressCarry(n, k, 2*k-2, 3*n+2*LOGK+2, p);

    for(var i=0; i<2; i++)for(var idx=0; idx<k; idx++){
        xp2_nocarry.a[i][idx] <== in[0][i][idx];
        xp2_nocarry.b[i][idx] <== in[0][i][idx];
        xp3_nocarry.b[i][idx] <== in[0][i][idx];
    }
    for(var i=0; i<2; i++)for(var idx=0; idx<2*k-1; idx++){
        xp3_nocarry.a[i][idx] <== xp2_nocarry.out[i][idx];
        xp2.in[i][idx] <== xp2_nocarry.out[i][idx];
    }
    for(var i=0; i<2; i++)for(var idx=0; idx<3*k-2; idx++)
        xp3.in[i][idx] <== xp3_nocarry.out[i][idx]; 

    signal xp_pow[3][2][k]; 
    for(var i=0; i<2; i++)for(var idx=0; idx<k; idx++){
        xp_pow[0][i][idx] <== in[0][i][idx];
        xp_pow[1][i][idx] <== xp2.out[i][idx];
        xp_pow[2][i][idx] <== xp3.out[i][idx];
    }
     
    component coeffs_xp[4][3]; 
    var deg[4] = [3, 1, 3, 2];
    for(var i=0; i<4; i++)for(var j=0; j<deg[i]; j++){
        coeffs_xp[i][j] = SignedFp2MultiplyNoCarry(n, k, 2*n + LOGK + 1);
        for(var l=0; l<2; l++)for(var idx=0; idx<k; idx++){
            coeffs_xp[i][j].a[l][idx] <== coeffs[i][j+1][l][idx];
            coeffs_xp[i][j].b[l][idx] <== xp_pow[j][l][idx];
        }
    }
    var x_frac[4][2][50];  
    for(var i=0; i<4; i++){
        for(var l=0; l<2; l++)for(var idx=0; idx<2*k-1; idx++){
            if(idx<k)
                x_frac[i][l][idx] = coeffs[i][0][l][idx];
            else
                x_frac[i][l][idx] = 0;
        }
        for(var j=0; j<deg[i]; j++)for(var l=0; l<2; l++)for(var idx=0; idx<2*k-1; idx++)
            x_frac[i][l][idx] += coeffs_xp[i][j].out[l][idx];
    } 
    for(var l=0; l<2; l++)for(var idx=0; idx<k; idx++){
        x_frac[1][l][idx] += xp2.out[l][idx];
        x_frac[3][l][idx] += xp3.out[l][idx];
    }
    
    // carry the denominators since we need to check whether they are 0
    component den[2];
    component den_is_zero[2];
    for(var i=0; i<2; i++){
        den[i] = SignedFp2CompressCarry(n, k, k-1, 2*n + LOGK + 3, p); 
        for(var l=0; l<2; l++)for(var idx=0; idx<2*k-1; idx++)
            den[i].in[l][idx] <== x_frac[2*i+1][l][idx];

        den_is_zero[i] = Fp2IsZero(n, k, p);
        for(var l=0; l<2; l++)for(var idx=0; idx<k; idx++)
            den_is_zero[i].in[l][idx] <== den[i].out[l][idx];
    }

    //component exception = IsZero();
    //exception.in <== inIsInfinity + den_is_zero[0].out + den_is_zero[1].out; 
    isInfinity <== den_is_zero[0].out + den_is_zero[1].out - den_is_zero[0].out * den_is_zero[1].out; // OR gate: if either denominator is 0, output point at infinity 

    component num[2];
    for(var i=0; i<2; i++){
        num[i] = Fp2Compress(n, k, k-1, p, 3*n + 2*LOGK + 3); 
        for(var l=0; l<2; l++)for(var idx=0; idx<2*k-1; idx++)
            num[i].in[l][idx] <== x_frac[2*i][l][idx];
    }

    component x[2];
    // num / den if den != 0, else num / 1
    for(var i=0; i<2; i++){
        x[i] = SignedFp2Divide(n, k, 3*n + 2*LOGK + 3, n, p);
        for(var l=0; l<2; l++)for(var idx=0; idx<k; idx++){
            x[i].a[l][idx] <== num[i].out[l][idx];
            if(l==0 && idx==0)
                x[i].b[l][idx] <== isInfinity * (1 - den[i].out[l][idx]) + den[i].out[l][idx];
            else
                x[i].b[l][idx] <== -isInfinity * den[i].out[l][idx] + den[i].out[l][idx];
        } 
    }

    component y = Fp2Multiply(n, k, p);
    for(var i=0; i<2; i++)for(var idx=0; idx<k; idx++){
        y.a[i][idx] <== in[1][i][idx];
        y.b[i][idx] <== x[1].out[i][idx];
    } 

    for(var i=0; i<2; i++)for(var idx=0; idx<k; idx++){
        out[0][i][idx] <== x[0].out[i][idx];
        out[1][i][idx] <== y.out[i][idx];
    }
}

/* 
Cofactor Clearing for BLS12-381 G2
Implementation below follows Appendix G.3 of https://datatracker.ietf.org/doc/html/draft-irtf-cfrg-hash-to-curve-14#appendix-G.3 
References:
    The endomorphism psi of Budroni-Pintore: https://eprint.iacr.org/2017/419.pdf
    BLS For the Rest of Us: https://hackmd.io/@benjaminion/bls12-381#Cofactor-clearing
*/

// Input: in, a point on the curve E2 : y^2 = x^3 + 4(1+u)
//  coordinates of in are in "proper" representation
// Output: out = psi(in), a point on the same curve.
template EndomorphismPsi(n, k, p){
    signal input in[2][2][k];
    signal output out[2][2][k];
    
    var c[2][2][k];
    // Constants:
    // c0 = 1 / (1 + I)^((p - 1) / 3)           # in GF(p^2)
    // c1 = 1 / (1 + I)^((p - 1) / 2)           # in GF(p^2)

    assert( n == 55 && k == 7 );
    if( n == 55 && k == 7 ){
        c = [[[0, 0, 0, 0, 0, 0, 0],
             [35184372088875693,
              22472499736345367,
              5698637743850064,
              21300661132716363,
              21929049149954008,
              23430044241153146,
              1829881462546425]],
            [[31097504852074146,
              21847832108733923,
              11215546103677201,
              1564033941097252,
              9796175148277139,
              23041766052141807,
              1359550313685033],
             [4649817190157321,
              14178090100713872,
              25898210532243870,
              6361890036890480,
              6755281389607612,
              401348527762810,
              470331148861392]]]; 
    }
    component frob[2];
    component qx[2];
    for(var i=0; i<2; i++){
        frob[i] = Fp2FrobeniusMap(n, k, 1, p);
        for(var j=0; j<2; j++)for(var idx=0; idx<k; idx++)
            frob[i].in[j][idx] <== in[i][j][idx];
        qx[i] = Fp2Multiply(n, k, p);
        for(var j=0; j<2; j++)for(var idx=0; idx<k; idx++){
            qx[i].a[j][idx] <== c[i][j][idx]; 
            qx[i].b[j][idx] <== frob[i].out[j][idx];
        } 
    }

    for(var j=0; j<2; j++)for(var idx=0; idx<k; idx++){
        out[0][j][idx] <== qx[0].out[j][idx];
        out[1][j][idx] <== qx[1].out[j][idx];
    }
}

// Input: in, a point on the curve E2 : y^2 = x^3 + 4(1+u)
//  coordinates of in are in "proper" representation
// Output: out = psi(psi(in)), a point on the same curve.
template EndomorphismPsi2(n, k, p){
    signal input in[2][2][k];
    signal output out[2][2][k];

    var c[k];
    // Third root of unity:
    // c = 1 / 2^((p - 1) / 3)          # in GF(p)
    
    assert( n == 55 && k == 7 );
    if( n == 55 && k == 7 ){
        c = [35184372088875692,
            22472499736345367,
            5698637743850064,
            21300661132716363,
            21929049149954008,
            23430044241153146,
            1829881462546425];
    }

    component qx[2];
    component qy[2];
    for(var i=0; i<2; i++){
        qx[i] = FpMultiply(n, k, p);
        for(var idx=0; idx<k; idx++){
            qx[i].a[idx] <== c[idx];
            qx[i].b[idx] <== in[0][i][idx];
        }
        
        qy[i] = BigSub(n, k);
        for(var idx=0; idx<k; idx++){
            qy[i].a[idx] <== p[idx];
            qy[i].b[idx] <== in[1][i][idx];
        }
    }
    for(var i=0; i<2; i++)for(var idx=0; idx<k; idx++){
        out[0][i][idx] <== qx[i].out[idx];
        out[1][i][idx] <== qy[i].out[idx];
    }
}


// in = P, a point on curve E2
// out = [x^2 - x - 1]P + [x-1]*psi(P) + psi2(2*P) 
// where x = -15132376222941642752 is the parameter for BLS12-381
template ClearCofactorG2(n, k){
    signal input in[2][2][k];
    signal input inIsInfinity;

    signal output out[2][2][k];
    signal output isInfinity;
    
    var p[50] = get_BLS12_381_prime(n, k);
    var x_abs = get_BLS12_381_parameter(); // this is abs(x). remember x is negative!
    var a[2] = [0,0];
    var b[2] = [4,4];
    var dummy_point[2][2][50] = get_generator_G2(n, k);
    
    // Output: [|x|^2 + |x| - 1]*P + [-|x|-1]*psi(P) + psi2(2*P) 
    //       = |x| * (|x|*P + P - psi(P)) - P -psi(P) + psi2(2*P)
    
    // replace `in` with dummy_point if inIsInfinity = 1 to ensure P is on the curve 
    signal P[2][2][k];
    component xP = EllipticCurveScalarMultiplyFp2(n, k, b, x_abs, p); 
    component psiP = EndomorphismPsi(n, k, p);
    component neg_Py = Fp2Negate(n, k, p);
    component neg_psiPy = Fp2Negate(n, k, p);
    component doubP = EllipticCurveDoubleFp2(n, k, a, b, p);
     
    xP.inIsInfinity <== inIsInfinity; 
    for(var i=0; i<2; i++)for(var j=0; j<2; j++)for(var idx=0; idx<k; idx++){
        P[i][j][idx] <== in[i][j][idx] + inIsInfinity * (dummy_point[i][j][idx] - in[i][j][idx]);
        xP.in[i][j][idx] <== P[i][j][idx];
        psiP.in[i][j][idx] <== P[i][j][idx];
        doubP.in[i][j][idx] <== P[i][j][idx];
    }
    for(var j=0; j<2; j++)for(var idx=0; idx<k; idx++){
        neg_Py.in[j][idx] <== P[1][j][idx];
        neg_psiPy.in[j][idx] <== psiP.out[1][j][idx];
    }

    component psi22P = EndomorphismPsi2(n, k, p);
    component add[5];
    for(var i=0; i<5; i++)
        add[i] = EllipticCurveAddFp2(n, k, a, b, p); 
    
    for(var i=0; i<2; i++)for(var j=0; j<2; j++)for(var idx=0; idx<k; idx++){
        psi22P.in[i][j][idx] <== doubP.out[i][j][idx];
        add[0].a[i][j][idx] <== xP.out[i][j][idx];
        add[0].b[i][j][idx] <== P[i][j][idx]; 
    }
    add[0].aIsInfinity <== xP.isInfinity; 
    add[0].bIsInfinity <== inIsInfinity;

    for(var i=0; i<2; i++)for(var j=0; j<2; j++)for(var idx=0; idx<k; idx++){
        add[1].a[i][j][idx] <== add[0].out[i][j][idx];
        if(i==0)
            add[1].b[i][j][idx] <== psiP.out[i][j][idx];
        else
            add[1].b[i][j][idx] <== neg_psiPy.out[j][idx];
    }
    add[1].aIsInfinity <== add[0].isInfinity;
    add[1].bIsInfinity <== inIsInfinity;
    
    component xadd1 = EllipticCurveScalarMultiplyFp2(n, k, b, x_abs, p); 
    for(var i=0; i<2; i++)for(var j=0; j<2; j++)for(var idx=0; idx<k; idx++)
        xadd1.in[i][j][idx] <== add[1].out[i][j][idx];
    xadd1.inIsInfinity <== add[1].isInfinity; 

    for(var i=0; i<2; i++)for(var j=0; j<2; j++)for(var idx=0; idx<k; idx++){
        add[2].a[i][j][idx] <== xadd1.out[i][j][idx];
        if(i==0)
            add[2].b[i][j][idx] <== P[i][j][idx];
        else
            add[2].b[i][j][idx] <== neg_Py.out[j][idx];
    }
    add[2].aIsInfinity <== xadd1.isInfinity;
    add[2].bIsInfinity <== inIsInfinity;
    
    for(var i=0; i<2; i++)for(var j=0; j<2; j++)for(var idx=0; idx<k; idx++){
        add[3].a[i][j][idx] <== add[2].out[i][j][idx];
        if(i==0)
            add[3].b[i][j][idx] <== psiP.out[i][j][idx];
        else
            add[3].b[i][j][idx] <== neg_psiPy.out[j][idx];
    }
    add[3].aIsInfinity <== add[2].isInfinity;
    add[3].bIsInfinity <== inIsInfinity;

    for(var i=0; i<2; i++)for(var j=0; j<2; j++)for(var idx=0; idx<k; idx++){
        add[4].a[i][j][idx] <== add[3].out[i][j][idx];
        add[4].b[i][j][idx] <== psi22P.out[i][j][idx];
    }
    add[4].aIsInfinity <== add[3].isInfinity;
    add[4].bIsInfinity <== inIsInfinity;

    // isInfinity = add[4].isInfinity or inIsInfinity (if starting point was O, output must be O)
    isInfinity <== add[4].isInfinity + inIsInfinity - inIsInfinity * add[4].isInfinity; 
    for(var i=0; i<2; i++)for(var j=0; j<2; j++)for(var idx=0; idx<k; idx++)
        out[i][j][idx] <== add[4].out[i][j][idx] + isInfinity * (dummy_point[i][j][idx] - add[4].out[i][j][idx]); 
}

// `in` is 2 x 2 x k representing two field elements in Fp2 
// `out` is 2 x 2 x k representing a point in subgroup G2 of E2(Fp2) twisted curve for BLS12-381
// isInfinity = 1 if `out` is point at infinity
// Implements steps 2-6 of hash_to_curve as specified in https://datatracker.ietf.org/doc/html/draft-irtf-cfrg-hash-to-curve-14#section-3 
// In practice `in` = hash_to_field(msg, 2) for an arbitrary-length byte string, in which case `out` = hash_to_curve(msg) 
template MapToG2(n, k){
    signal input in[2][2][k];
    signal output out[2][2][k];
    signal output isInfinity;

    var p[50] = get_BLS12_381_prime(n, k);

    component Qp[2];
    for(var i=0; i<2; i++){
        Qp[i] = OptSimpleSWU2(n, k);
        for(var j=0; j<2; j++)for(var idx=0; idx<k; idx++)
            Qp[i].in[j][idx] <== in[i][j][idx];
    }

    // There is a small optimization we can do: Iso3Map is a group homomorphism, so we can add first and then apply isogeny. This uses EllipticCurveAdd on E2' 
    component Rp = EllipticCurveAddFp2(n, k, [0, 240], [1012, 1012], p); 
    for(var i=0; i<2; i++)for(var j=0; j<2; j++)for(var idx=0; idx<k; idx++){
        Rp.a[i][j][idx] <== Qp[0].out[i][j][idx];
        Rp.b[i][j][idx] <== Qp[1].out[i][j][idx];
    }
    Rp.aIsInfinity <== 0;
    Rp.bIsInfinity <== 0;
    
    component R = Iso3Map(n, k);
    for(var i=0; i<2; i++)for(var j=0; j<2; j++)for(var idx=0; idx<k; idx++)
        R.in[i][j][idx] <== Rp.out[i][j][idx];
    
    component P = ClearCofactorG2(n, k);
    for(var i=0; i<2; i++)for(var j=0; j<2; j++)for(var idx=0; idx<k; idx++)
        P.in[i][j][idx] <== R.out[i][j][idx]; 
    P.inIsInfinity <== R.isInfinity + Rp.isInfinity - R.isInfinity * Rp.isInfinity; 
    
    isInfinity <== P.isInfinity;
    for(var i=0; i<2; i++)for(var j=0; j<2; j++)for(var idx=0; idx<k; idx++)
        out[i][j][idx] <== P.out[i][j][idx]; 
}

/*
Subgroup checks for G1, G2: 
use the latest methods by Scott: https://eprint.iacr.org/2021/1130.pdf
Other references:
    Bowe: https://eprint.iacr.org/2019/814.pdf
    El Housni: https://hackmd.io/@yelhousni/bls12_subgroup_check
*/

// `in` = P is 2 x 2 x k, pair of Fp2 elements 
// check P is on curve twist E2(Fp2)
// check psi(P) = [x]P where x is parameter for BLS12-381
template SubgroupCheckG2(n, k){
    signal input in[2][2][k];
    
    var p[50] = get_BLS12_381_prime(n, k);
    var x_abs = get_BLS12_381_parameter();

    component is_on_curve = PointOnCurveFp2(n, k, [0,0], [4,4], p);

    for(var i=0; i<2; i++)for(var j=0; j<2; j++)for(var idx=0; idx<k; idx++)
        is_on_curve.in[i][j][idx] <== in[i][j][idx]; 

    component psiP = EndomorphismPsi(n, k, p); 
    component negP = Fp2Negate(n, k, p);
    component xP = EllipticCurveScalarMultiplyUnequalFp2(n, k, [4, 4], x_abs, p); 

    for(var j=0; j<2; j++)for(var idx=0; idx<k; idx++)
        negP.in[j][idx] <== in[1][j][idx];
            
    for(var j=0; j<2; j++)for(var idx=0; idx<k; idx++){
        psiP.in[0][j][idx] <== in[0][j][idx];
        psiP.in[1][j][idx] <== in[1][j][idx];
        xP.in[0][j][idx] <== in[0][j][idx];
        xP.in[1][j][idx] <== negP.out[j][idx]; 
    }
    
    // psi(P) == [x]P
    component is_eq[2];
    for(var i=0; i<2; i++){
        is_eq[i] = Fp2IsEqual(n, k, p);
        for(var j=0; j<2; j++)for(var idx=0; idx<k; idx++){
            is_eq[i].a[j][idx] <== psiP.out[i][j][idx];
            is_eq[i].b[j][idx] <== xP.out[i][j][idx];
        }
    }
    is_eq[0].out === 1;
    is_eq[1].out === 1;
}

// `in` = P is 2 x k, pair of Fp elements
// check P is on curve E(Fp)
// check phi(P) == [-x^2] P where phi(x,y) = (omega * x, y) where omega is a cube root of unity in Fp
template SubgroupCheckG1(n, k){
    signal input in[2][k];

    var p[50] = get_BLS12_381_prime(n, k);
    var x_abs = get_BLS12_381_parameter();
    var b = 4;

    component is_on_curve = PointOnCurve(n, k, 0, b, p);

    for(var i=0; i<2; i++)for(var idx=0; idx<k; idx++)
        is_on_curve.in[i][idx] <== in[i][idx];
         
    var omega[k];
    // Third root of unity:
    // omega = 2^((p - 1) / 3)          # in GF(p)
    assert( n == 55 && k == 7 );
    if( n == 55 && k == 7 ){
        omega = [562949953355774,
                 13553422473102428,
                 31415118892071007,
                 22654059864235337,
                 30651204406894710,
                 13070338751470,
                 0];
    }

    component phiPx = FpMultiply(n, k, p);
    for(var idx=0; idx<k; idx++){
        phiPx.a[idx] <== omega[idx];
        phiPx.b[idx] <== in[0][idx];
    }
    component phiPy_neg = BigSub(n, k);
    for(var idx=0; idx<k; idx++){
        phiPy_neg.a[idx] <== p[idx];
        phiPy_neg.b[idx] <== in[1][idx];
    }
    
    // x has hamming weight 6 while x^2 has hamming weight 17 so better to do double-and-add on x twice
    component xP = EllipticCurveScalarMultiplyUnequal(n, k, b, x_abs, p); 
    component x2P = EllipticCurveScalarMultiplyUnequal(n, k, b, x_abs, p);
    for(var i=0; i<2; i++)for(var idx=0; idx<k; idx++)
        xP.in[i][idx] <== in[i][idx];

    for(var i=0; i<2; i++)for(var idx=0; idx<k; idx++)
        x2P.in[i][idx] <== xP.out[i][idx];

    // check -phi(P) == [x^2]P
    component is_eq = Fp2IsEqual(n, k, p); // using Fp2IsEqual to check two Fp points are equal
    for(var idx=0; idx<k; idx++){
        is_eq.a[0][idx] <== phiPx.out[idx];
        is_eq.a[1][idx] <== phiPy_neg.out[idx];

        is_eq.b[0][idx] <== x2P.out[0][idx];
        is_eq.b[1][idx] <== x2P.out[1][idx];
    }
    is_eq.out === 1;
}

pragma circom 2.0.2;

include "bigint.circom";
include "bigint_func.circom";
include "fp2.circom";
include "fp12.circom";

// Extra circuits with different approaches to field operations. 
// Kept here for reference; less efficient or specialized than the ones in field_elements.circom


// a, b are elements of Fp^l
// a[i] represents a[i][0] + a[i][1] * 2**n + ... + a[i][l-1] * 2**(n*(k-1))
// compute a+b in Fp^l
template FieldAdd2D(n, k, l) {
    signal input a[l][k];
    signal input b[l][k];
    signal input p[k];
    signal output c[l][k];

    component adders[l];
    for (var i = 0; i < l; i++) {
        adders[i] = BigAddModP(n, k);
        for (var j = 0; j < k; j++) {
            adders[i].a[j] <== a[i][j];
            adders[i].b[j] <== b[i][j];
            adders[i].p[j] <== p[j];
        }   
        for (var j = 0; j < k; j ++) {
            c[i][j] <== adders[i].out[j];
        }
    }
}

// take a polynomial expression a[0] + omega^1 a[1] + ... + omega^(2l-2) a[2l-2]
// reduce it to degree l-1 using omega^l + omega^(l-1) poly[l-1] + ... + poly[0] = 0
// WARNING: can produce incorrectly handled negative coefficients. only here for reference; do not use
template PolynomialReduce(l) {
    signal input a[2*l-1];
    signal input poly[l];
    signal output out[l];

    var residue[2*l-1];
    signal quotient[l-1];
    for (var i = 0; i < 2*l-1; i++) {
        residue[i] = a[i];
    }
    for (var i = l-2; i >= 0; i --) {
        for (var j = 0; j < l; j ++) {
            residue[i + j] = residue[i + j] - residue[i + l] * poly[j];
        }
        quotient[i] <-- residue[i+l];
        residue[i+l] = 0;
    }
    component mult = BigMultShortLong(1, l+1);
    for (var i = 0; i < l-1; i ++) {
        mult.a[i] <== quotient[i];
        mult.b[i] <== poly[i];
    }
    mult.a[l-1] <== 0;
    mult.a[l] <== 0;
    mult.b[l-1] <== poly[l-1];
    mult.b[l] <== 1;
    signal a_out[2*l-1];
    for (var i = 0; i < 2*l-1; i++) {
        a_out[i] <== mult.out[i];
    }
    for (var i = 0; i < l; i ++ ) {
        out[i] <-- residue[i];
    }
    for (var i = 0; i < l; i ++) {
        a[i] === a_out[i] + out[i];
    }
    for (var i = l; i < 2*l-1; i ++) {
        a[i] === a_out[i];
    }
}

template Fp2PolynomialReduce(n, k, p) {
    var l = 2;
    signal input a[2*l-1][k];
    var poly[2] = [1, 0]; // x^2 + 1 = 0
    signal output out[l][k];

    for (var i = 0; i < k; i ++) {
        out[1][i] <== a[1][i];
    }
    component sub = FpSubtract(n, k, p);
    for (var i = 0; i < k; i ++) {
        sub.a[i] <== a[0][i];
        sub.b[i] <== a[2][i];
    }
    for (var i = 0; i < k; i ++) {
        out[0][i] <== sub.out[i];
    }
}


// very un-optimized version: 

// outputs a*b in Fp2 
// (a0 + a1 u)*(b0 + b1 u) = (a0*b0 - a1*b1) + (a0*b1 + a1*b0)u 
// out[i] has k registers each in [0, 2^n)
// out[i] in [0, p)
// A similar circuit can do multiplication in different fields. 
// The only difference is that Fp2PolynomialReduce (which reduces quadratics by x^2+1) 
// must be replaced with a different circuit specialized to the minimal polynomial
template Fp2Multiply1(n, k, p) {
    // l is always 2. poly is always [1, 0]
    var l = 2;
    signal input a[l][k];
    signal input b[l][k];
    signal output out[l][k];

    component mult = BigMultShortLong2D(n, k, l);
    for (var i = 0; i < l; i ++) {
        for (var j = 0; j < k; j ++) {
            mult.a[i][j] <== a[i][j];
            mult.b[i][j] <== b[i][j];
        }
    } // out: 2l-1 x 2k-1 array of longs
    component longshorts[2*l-1];
    for (var i = 0; i < 2*l-1; i++) {
        longshorts[i] = LongToShortNoEndCarry(n, 2*k-1);
        for (var j = 0; j < 2*k-1; j ++) {
            longshorts[i].in[j] <== mult.out[i][j];
        }
    } // out: 2l-1 x 2k array of shorts
    component bigmods[2*l-1];
    for (var i = 0; i < 2*l-1; i ++) {
        bigmods[i] = BigMod(n, k);
        for (var j = 0; j < 2*k; j ++) {
            bigmods[i].a[j] <== longshorts[i].out[j];
        }
        for (var j = 0; j < k; j ++) {
            bigmods[i].b[j] <== p[j];
        }
    } // out: 2l-1 x k array of shorts
    component reduce = Fp2PolynomialReduce(n, k, p);
    for (var i = 0; i < 2*l-1; i ++) {
        for (var j = 0; j < k; j ++) {
            reduce.a[i][j] <== bigmods[i].mod[j];
        }
    } // out: l x k array of shorts
    for (var i = 0; i < l; i++) {
        for (var j = 0; j < k; j++) {
            out[i][j] <== reduce.out[i][j];
        }
    } // out: l x k array of shorts
}


// squaring can be optimized to save 2 multiplication
// (a**2-b**2) = (a+b)(a-b) 
// (a+b u)**2 = (a+b)(a-b) + (a*b+a*b)u
template Fp2Square(n, k){
    signal input in[2][k];
    signal input p[k];
    signal output out[2][k];
    
    component sum = BigAdd(n, k);
    for(var i=0; i<k; i++){
        sum.a[i] <== in[0][i];
        sum.b[i] <== in[1][i];
    }
    component diff = BigSubModP(n, k);
    for(var i=0; i<k; i++){
        diff.a[i] <== in[0][i];
        diff.b[i] <== in[1][i];
        diff.p[i] <== p[i];
    }
    component prod = BigMult(n, k+1);
    for(var i=0; i<k; i++){
        prod.a[i] <== sum.out[i];
        prod.b[i] <== diff.out[i];
    }
    prod.a[k] <== sum.out[k];
    prod.b[k] <== 0;

    component prod_mod = BigMod2(n, k, 2*k+2);
    for(var i=0; i<2*k+2; i++){
        prod_mod.a[i] <== prod.out[i];
        if(i<k){
            prod_mod.b[i] <== p[i];
        }
    }
    for(var i=0; i<k; i++){
        out[0][i] <== prod_mod.mod[i];
    }
    
    component ab = BigMult(n, k);
    for(var i=0; i<k; i++){
        ab.a[i] <== in[0][i];
        ab.b[i] <== in[1][i];
    }
    component two_ab = BigAdd(n, 2*k); 
    for(var i=0; i<2*k; i++){
        two_ab.a[i] <== ab.out[i];
        two_ab.b[i] <== ab.out[i];
    }
    component two_ab_mod = BigMod2(n, k, 2*k+1);
    for(var i=0; i<2*k+1; i++){
        two_ab_mod.a[i] <== two_ab.out[i];
        if(i < k){
            two_ab_mod.b[i] <== p[i];
        }
    }
    for(var i=0; i<k; i++){
        out[1][i] <== two_ab_mod.mod[i];
    }
}

// a[2][k] all registers in [0, 2**n)
// b[2][k] all registers in [0, 2**n)
// p[k]
// consider a,b as elements of Fp2 
// out[2][2][k] solving
//      a0*b0 + (p-a1)*b1 = p * out[0][0] + out[0][1] with out[0][1] in [0,p) 
//      a0*b1 + a1*b0 = p * out[1][0] + out[1][1] with out[1][1] in [0,p) 
// out[i][0] has k+2 registers in short BigInt format [0, 2**n)
// out[i][1] has k registers in short BigInt format
// a * b = out[0][1] + out[1][1] * u in Fp2 
function Fp2prod(n, k, a, b, p){
    var out[2][2][20];
    // solve for X and Y such that a0*b0 + (p-a1)*b1 = p*X + Y with Y in [0,p) 
    // -a1*b1 = (p-a1)*b1 mod p
    var a0b0_var[20] = prod(n, k, a[0], b[0]);
    var a1_neg[20] = long_sub(n, k, p, a[1]); 
    var a1b1_neg[20] = prod(n, k, a1_neg, b[1]);
    var diff[20] = long_add(n, 2*k, a0b0_var, a1b1_neg); // 2*k+1 registers
    out[0] = long_div2(n, k, k+1, diff, p); 
    // X = out[0][0] has k+2 registers, Y = out[0][1] has k registers 
    
    // solve for X and Y such that a0*b1 + a1*b0 = p*X + Y with Y in [0,p) 
    var a0b1_var[20] = prod(n, k, a[0], b[1]);
    var a1b0_var[20] = prod(n, k, a[1], b[0]);
    var sum[20] = long_add(n, 2*k, a0b1_var, a1b0_var); // output 2*k+1 registers
    out[1] = long_div2(n, k, k+1, sum, p); 
    // X = out[1][0] has k+2 registers, Y = out[1][1] has k registers 

    return out;
}

// output (a0 + a1 u)*(b0 + b1 u) = (a0*b0 + (p-a1)*b1) + (a0*b1 + a1*b0)u 
//      where no carries are performed 
// out[0], out[1] have 2*k-1 registers 
// out[0][i] in (-(k+1)*2^{2n}, (k+1)*2^{2n+1})
// out[1][i] in [0, (k+1)*2^{2n+1}) 
template Fp2multiplyNoCarry(n, k){
    signal input a[2][k];
    signal input b[2][k];
    signal input p[k];
    signal output out[2][2*k-1];
    
    component a0b0 = BigMultShortLong(n, k);
    component a1b1 = BigMultShortLong(n, k);
    component pb1 = BigMultShortLong(n, k); 
    component a0b1 = BigMultShortLong(n, k); 
    component a1b0 = BigMultShortLong(n, k);
    
    for(var i=0; i<k; i++){
        a0b0.a[i] <== a[0][i];
        a0b0.b[i] <== b[0][i];

        a1b1.a[i] <== a[1][i];
        a1b1.b[i] <== b[1][i];

        pb1.a[i] <== p[i];
        pb1.b[i] <== b[1][i];

        a0b1.a[i] <== a[0][i];
        a0b1.b[i] <== b[1][i];

        a1b0.a[i] <== a[1][i];
        a1b0.b[i] <== b[0][i];
    }
 
    for(var i=0; i<2*k-1; i++){
        out[0][i] <== a0b0.out[i] + pb1.out[i] - a1b1.out[i];
        out[1][i] <== a0b1.out[i] + a1b0.out[i];
    }
}

// multiplication specialized to Fp^2 
// (a0 + a1 u)*(b0 + b1 u) = (a0*b0 - a1*b1) + (a0*b1 + a1*b0)u
template Fp2multiply(n, k){
    signal input a[2][k];
    signal input b[2][k];
    signal input p[k];
    signal output out[2][k];

    var LOGK = log_ceil(k);
    assert(2*n + 1 + LOGK<254);

    var Xvar[2][2][20] = Fp2prod(n, k, a, b, p); 
    component range_checks[2][k];
    component lt[2];
    signal X[2][k+2]; 
    component X_range_checks[2][k+2];
    
    for(var eps=0; eps<2; eps++){
        lt[eps] = BigLessThan(n, k);
        for(var i=0; i<k; i++){
            out[eps][i] <-- Xvar[eps][1][i];
            range_checks[eps][i] = Num2Bits(n);
            range_checks[eps][i].in <== out[eps][i];
            
            lt[eps].a[i] <== out[eps][i];
            lt[eps].b[i] <== p[i];
        }
        lt[eps].out === 1;
        
        for(var i=0; i<k+2; i++){
            X[eps][i] <-- Xvar[eps][0][i];
            X_range_checks[eps][i] = Num2Bits(n);
            X_range_checks[eps][i].in <== X[eps][i];
        }
        
    }

    
    // out[0] constraint: X = X[0], Y = out[0] 
    // constrain by Carry( a0 *' b0 +' p *' b1 -' a1 *' b1 - p *' X - Y ) = 0 
    // where all operations are performed without carry 
    // each register is an overflow representation in the range (-k*2^{2n+1}-2^n, k*2^{2n + 1} )
    //                                          which is inside (-2^{2n+1+LOGK}, 2^{2n+1+LOGK})

    // out[1] constraint: X = X[1], Y = out[1]
    // constrain by Carry( a0 *' b1 +' a1 *' b0 -' p *' X - Y) = 0 
    // each register is an overflow representation in the range (-k*2^{2n}-2^n, k*2^{2n + 1} )
    //                                          which is inside (-2^{2n+1+LOGK}, 2^{2n+1+LOGK})
    
    component ab = Fp2multiplyNoCarry(n, k); 
    for(var i=0; i<k; i++){
        ab.p[i] <== p[i];
        ab.a[0][i] <== a[0][i];
        ab.a[1][i] <== a[1][i];
        ab.b[0][i] <== b[0][i];
        ab.b[1][i] <== b[1][i];
    }
    component pX[2];
    component carry_check[2];
    for(var eps=0; eps<2; eps++){
        pX[eps] = BigMultShortLong(n, k+2); // 2*k+3 registers
        for(var i=0; i<k; i++){
            pX[eps].a[i] <== p[i];
            pX[eps].b[i] <== X[eps][i];
        }
        for(var i=k; i<k+2; i++){
            pX[eps].a[i] <== 0;
            pX[eps].b[i] <== X[eps][i];
        }

        carry_check[eps] = CheckCarryToZero(n, 2*n+2+LOGK, 2*k+3); 
        for(var i=0; i<k; i++)
            carry_check[eps].in[i] <== ab.out[eps][i] - pX[eps].out[i] - out[eps][i]; 
        for(var i=k; i<2*k-1; i++)
            carry_check[eps].in[i] <== ab.out[eps][i] - pX[eps].out[i]; 
        for(var i=2*k-1; i<2*k+3; i++)
            carry_check[eps].in[i] <== -pX[eps].out[i];
    }

}


// adapted from BigMultShortLong2D and LongToShortNoEndCarry2 witness computation
function prod3D(n, k, l, a, b, c) {
    // first compute the intermediate values. taken from BigMulShortLong
    var prod_val[20][20]; // length is 3l - 2 by 3k - 2
    for (var i = 0; i < 3 * k; i++) {
        for (var j = 0; j < 3 * l; j ++) {
            prod_val[j][i] = 0;
        }
    }
    for (var i1 = 0; i1 < k; i1 ++) {
        for (var i2 = 0; i2 < k; i2 ++) {
	    for (var i3 = 0; i3 < k; i3 ++) {
		for (var j1 = 0; j1 < l; j1 ++) {
                    for (var j2 = 0; j2 < l; j2 ++) {
			for (var j3 = 0; j3 < l; j3 ++) {
			    prod_val[j1 + j2 + j3][i1 + i2 + i3] = prod_val[j1 + j2 + j3][i1 + i2 + i3] + a[j1][i1] * b[j2][i2] * c[j3][i3];
			}
		    }
                }
            }
        }
    }

    // now do a bunch of carrying to make sure registers not overflowed. taken from LongToShortNoEndCarry2
    var out[20][20]; // length is 3 * l by 3 * k

    var split[20][20][3]; // second dimension has length 3 * k - 1
    for (var j = 0; j < 3 * l - 1; j ++) {
        for (var i = 0; i < 3 * k - 1; i++) {
            split[j][i] = SplitThreeFn(prod_val[j][i], n, n, n);
        }
    }

    var carry[20][20]; // length is 3l-1 x 3k
    var sumAndCarry[20][2];
    for ( var j = 0; j < 3 * l - 1; j ++) {
        carry[j][0] = 0;
        out[j][0] = split[j][0][0];
        if (3 * k - 1 > 1) {
            sumAndCarry[j] = SplitFn(split[j][0][1] + split[j][1][0], n, n);
            out[j][1] = sumAndCarry[j][0];
            carry[j][1] = sumAndCarry[j][1];
        }
        if (3 * k - 1 > 2) {
            for (var i = 2; i < 3 * k - 1; i++) {
                sumAndCarry[j] = SplitFn(split[j][i][0] + split[j][i-1][1] + split[j][i-2][2] + carry[j][i-1], n, n);
                out[j][i] = sumAndCarry[j][0];
                carry[j][i] = sumAndCarry[j][1];
            }
            out[j][3 * k - 1] = split[j][3*k-2][1] + split[j][3*k-3][2] + carry[j][3*k-2];
        }
    }

    return out;
}


// a = sum w^i u^j a_ij for w^6=u+1, u^2=-1. similarly for b, c
// we first write a = A + B u, b = C + D u, c = E + F u and compute 
// abc = (ACE - BDE - ADF - BCF) + (ADE + BCE + ACF - BCF) u, and then simplify the representation
// assumes n, k are chosen so that cubic carries are OK
template Fp12MultiplyThree(n, k, p) {
    var l = 6;
    signal input a[l][2][k];
    signal input b[l][2][k];
    signal input c[l][2][k];
    signal output out[l][2][k];

    var LOGK = log_ceil(k);
    var LOGL = 4;
    assert(l<15);
    assert(k<7);
    assert(2*n + 1 + LOGK + LOGL <254);

    var a0[l][k];
    var a1[l][k];
    var b0[l][k];
    var b1[l][k];
    var c0[l][k];
    var c1[l][k];
    var neg_a0[l][20];
    var neg_a1[l][20];
   for (var i = 0; i < l; i ++) { 
        for ( var j = 0; j < k; j ++) {
            a0[i][j] = a[i][0][j];
            a1[i][j] = a[i][1][j];
            b0[i][j] = b[i][0][j];
            b1[i][j] = b[i][1][j];
            c0[i][j] = c[i][0][j];
            c1[i][j] = c[i][1][j];
        }
    }
    for ( var i = 0; i < l; i ++) {
        neg_a0[i] = long_sub(n, k, p, a0[i]);
        neg_a1[i] = long_sub(n, k, p, a1[i]);
    }

    var real_init[3*l-1][20];
    var imag_init[3*l-1][20];
    var imag_init_neg[3*l-1][20];
    var real[l][2][20];
    var imag[l][2][20];
    // each product will be 3l-1 x 3k
    var a0b0c0_var[20][20] = prod3D(n, k, l, a0, b0, c0);
    var a1b1c0_neg[20][20] = prod3D(n, k, l, neg_a1, b1, c0);
    var a1b0c1_neg[20][20] = prod3D(n, k, l, neg_a1, b0, c1);
    var a0b1c1_neg[20][20] = prod3D(n, k, l, neg_a0, b1, c1);

    var a1b0c0_var[20][20] = prod3D(n, k, l, a1, b0, c0);
    var a0b1c0_var[20][20] = prod3D(n, k, l, a0, b1, c0);
    var a0b0c1_var[20][20] = prod3D(n, k, l, a0, b0, c1);
    var a1b1c1_neg[20][20] = prod3D(n, k, l, neg_a0, b1, c1);

    var a1b0c0_neg[20][20] = prod3D(n, k, l, neg_a1, b0, c0);
    var a0b1c0_neg[20][20] = prod3D(n, k, l, neg_a0, b1, c0);
    var a0b0c1_neg[20][20] = prod3D(n, k, l, neg_a0, b0, c1);
    var a1b1c1_var[20][20] = prod3D(n, k, l, a0, b1, c1);

    for (var i = 0; i < 3 * l - 1; i ++) { // compute initial rep (deg w = 10)
        real_init[i] = long_add4(n, 3 * k, a0b0c0_var[i], a1b1c0_neg[i], a1b0c1_neg[i], a0b1c1_neg[i]); // 3 * k + 1 registers each
        imag_init[i] = long_add4(n, 3 * k, a1b0c0_var[i], a0b1c0_var[i], a0b0c1_var[i], a1b1c1_neg[i]);
	imag_init_neg[i] = long_add4(n, 3 * k, a1b0c0_neg[i], a0b1c0_neg[i], a0b0c1_neg[i], a1b1c1_var[i]);
    }

    // carries using w^6 = u + 1, w^12 = 2 u
    var real_carry[l][20];
    var imag_carry[l][20];
    var real_final[l][20];
    var imag_final[l][20];
    var zeros[20]; // to balance register sizes
    for (var i = 0; i < 20; i ++) {
        zeros[i] = 0;
    }
    for (var i = 0; i < l; i ++) {
        if (i == l - 1) {
            real_carry[i] = long_add4(n, 3*k+1, zeros, zeros, real_init[i + l], imag_init_neg[i + l]);
            imag_carry[i] = long_add4(n, 3*k+1, zeros, zeros, real_init[i + l], imag_init[i + l]);
        } else {
            real_carry[i] = long_add4(n, 3*k+1, real_init[i + l], imag_init_neg[i + l], imag_init_neg[i + 2 * l], imag_init_neg[i + 2 * l]); // now 3*k+2 registers
            imag_carry[i] = long_add4(n, 3*k+1, imag_init[i + l], real_init[i + l], real_init[i + 2 * l], real_init[i + 2 * l]);
        }
    }    
    for (var i = 0; i < l; i ++) {
        real_final[i] = long_add_unequal(n, 3*k+2, 3*k+1, real_carry[i], real_init[i]); // now 3*k+3 registers
        imag_final[i] = long_add_unequal(n, 3*k+2, 3*k+1, imag_carry[i], imag_init[i]);
    }

    // reduction mod p
    var prod_real_temp[l][2][20];
    var prod_imag_temp[l][2][20];

    // prod_real[*][0][2 * k + 4] * p + prod_real[*][1][k] = real_final[*]
    // prod_imag[*][0][2 * k + 4] * p + prod_imag[*][1][k] = imag_final[*]
    signal prod_real[l][2][2 * k + 4];
    signal prod_imag[l][2][2 * k + 4];
    for (var i = 0; i < l; i ++) {
        prod_real_temp[i] = long_div2(n, k, 2 * k + 3, real_final[i], p); // 2 * k + 4 register quotient, k register remainder
        prod_imag_temp[i] = long_div2(n, k, 2 * k + 3, imag_final[i], p);
    }
    for (var i = 0; i < l; i ++) {
        for (var j = 0; j < 2 * k + 4; j ++) {
            prod_real[i][0][j] <-- prod_real_temp[i][0][j];
            prod_imag[i][0][j] <-- prod_imag_temp[i][0][j];
            if (j < k) {
                prod_real[i][1][j] <-- prod_real_temp[i][1][j];
                prod_imag[i][1][j] <-- prod_imag_temp[i][1][j];
            } else {
                prod_real[i][1][j] <== 0;
                prod_imag[i][1][j] <== 0;
            }
        }
    }
    for (var i = 0; i < l; i ++) {
        for (var j = 0; j < k; j ++) {
            out[i][0][j] <== prod_real[i][1][j];
            out[i][1][j] <== prod_imag[i][1][j];
        }
    }

    component out_range_checks[l][2][k];
    for(var i=0; i<l; i++){
        for (var j = 0; j < 2; j ++) {
            for (var m = 0; m < k; m ++) {
                out_range_checks[i][j][m] = Num2Bits(n);
                out_range_checks[i][j][m].in <== out[i][j][m];
            }
        }
    }
    component lt[l][2];
    for (var i = 0; i < l; i ++) {
        for (var j = 0; j < 2; j ++) {
            lt[i][j] = BigLessThan(n, k);
            for (var m = 0; m < k; m ++) {
                lt[i][j].a[m] <== out[i][j][m];
                lt[i][j].b[m] <== p[m];
            }
            lt[i][j].out === 1;
        }
    }

    component div_range_checks[l][2][2 * k + 4];
    for (var i = 0; i < l; i ++) {
        for (var j = 0; j < 2 * k + 4; j ++) {
            div_range_checks[i][0][j] = Num2Bits(n);
            div_range_checks[i][1][j] = Num2Bits(n);
            div_range_checks[i][0][j].in <== prod_real[i][0][j];
            div_range_checks[i][1][j].in <== prod_imag[i][0][j];
        }
    }

    // constrain by:
    // X = a0 *' b0 *' c0 +' (p -' a1) *' b1 *' c0 +' (p -' a1) *' b0 *' c1 +' (p -' a0) *' b1 *' c1
    // Y = a1 *' b0 *' c0 +' a0 *' b1 *' c0 +' a0 *' b0 *' c1 +' (p -' a1) *' b1 *' c1
    // Carry( X_0 +' X_1 -' Y_1 -' Y_2 -' Y_2 -' p *' prod_real[0] -' prod_real[1] ) = 0
    // Carry( Y_0 +' X_1 +' Y_1 +' X_2 +' X_2 -' p *' prod_imag[0] -' prod_imag[1] ) = 0
    // where all operations are performed without carry 
    // X_0 is the coeffs of w^0, ..., w^5
    // X_1 is the coeffs of w^6, ..., w^11
    // X_2 is the coeffs of w^12, ..., w^17
    // each register is an overflow representation in the range (-kl*2^{3n+4}, kl*2^{3n + 4} )    
    component b0c0 = BigMultShortLong2D(n, k, l);
    component b0c1 = BigMultShortLong2D(n, k, l);
    component b1c0 = BigMultShortLong2D(n, k, l);
    component b1c1 = BigMultShortLong2D(n, k, l);
    for (var i = 0; i < l; i ++) {
        for (var j = 0; j < k; j ++) {
            b0c0.a[i][j] <== b[i][0][j];
            b0c0.b[i][j] <== c[i][0][j];
            b0c1.a[i][j] <== b[i][0][j];
            b0c1.b[i][j] <== c[i][1][j];
            b1c0.a[i][j] <== b[i][1][j];
            b1c0.b[i][j] <== c[i][0][j];
            b1c1.a[i][j] <== b[i][1][j];
            b1c1.b[i][j] <== c[i][1][j];
	}
    }
    
    component a0b0c0 = BigMultShortLong2DUnequal(n, k, 2 * k - 1, l, 2 * l - 1);
    component a1b0c0 = BigMultShortLong2DUnequal(n, k, 2 * k - 1, l, 2 * l - 1);
    component a0b0c1 = BigMultShortLong2DUnequal(n, k, 2 * k - 1, l, 2 * l - 1);
    component a1b0c1 = BigMultShortLong2DUnequal(n, k, 2 * k - 1, l, 2 * l - 1);
    component a0b1c0 = BigMultShortLong2DUnequal(n, k, 2 * k - 1, l, 2 * l - 1);
    component a1b1c0 = BigMultShortLong2DUnequal(n, k, 2 * k - 1, l, 2 * l - 1);
    component a0b1c1 = BigMultShortLong2DUnequal(n, k, 2 * k - 1, l, 2 * l - 1);
    component a1b1c1 = BigMultShortLong2DUnequal(n, k, 2 * k - 1, l, 2 * l - 1);

    component pb0c1 = BigMultShortLong2DUnequal(n, k, 2 * k - 1, l, 2 * l - 1);
    component pb1c0 = BigMultShortLong2DUnequal(n, k, 2 * k - 1, l, 2 * l - 1);
    component pb1c1 = BigMultShortLong2DUnequal(n, k, 2 * k - 1, l, 2 * l - 1);
    for (var i = 0; i < l; i ++) {
        for (var j = 0; j < k; j ++) {
	    a0b0c0.a[i][j] <== a[i][0][j];
	    a0b0c1.a[i][j] <== a[i][0][j];
	    a0b1c0.a[i][j] <== a[i][0][j];
	    a0b1c1.a[i][j] <== a[i][0][j];
	    a1b0c0.a[i][j] <== a[i][1][j];
	    a1b0c1.a[i][j] <== a[i][1][j];
	    a1b1c0.a[i][j] <== a[i][1][j];
	    a1b1c1.a[i][j] <== a[i][1][j];

	    pb0c1.a[i][j] <== p[j];
	    pb1c0.a[i][j] <== p[j];
	    pb1c1.a[i][j] <== p[j];
	}
    }
    for (var i = 0; i < 2 * l - 1; i++) {
	for (var j = 0; j < 2 * k - 1; j++) {
	    a0b0c0.b[i][j] <== b0c0.out[i][j];
	    a1b0c0.b[i][j] <== b0c0.out[i][j];
	    a0b0c1.b[i][j] <== b0c1.out[i][j];
	    a1b0c1.b[i][j] <== b0c1.out[i][j];
	    a0b1c0.b[i][j] <== b1c0.out[i][j];
	    a1b1c0.b[i][j] <== b1c0.out[i][j];
	    a0b1c1.b[i][j] <== b1c1.out[i][j];
	    a1b1c1.b[i][j] <== b1c1.out[i][j];

	    pb0c1.b[i][j] <== b0c1.out[i][j];
	    pb1c0.b[i][j] <== b1c0.out[i][j];
	    pb1c1.b[i][j] <== b1c1.out[i][j];
	}
    }
    
    component p_prod_real0[l];
    component p_prod_imag0[l];
    for (var i = 0; i < l; i ++) {
        p_prod_real0[i] = BigMultShortLongUnequal(n, k, 2 * k + 4);
        p_prod_imag0[i] = BigMultShortLongUnequal(n, k, 2 * k + 4);

	for (var j = 0; j < k; j++) {
	    p_prod_real0[i].a[j] <== p[j];
	    p_prod_imag0[i].a[j] <== p[j];
	}
	for (var j = 0; j < 2 * k + 4; j++) {
	    p_prod_real0[i].b[j] <== prod_real[i][0][j];
	    p_prod_imag0[i].b[j] <== prod_imag[i][0][j];
	}
    }    

    var X0[l][3 * k - 2];
    var X1[l][3 * k - 2];
    var X2[l][3 * k - 2];
    var Y0[l][3 * k - 2];
    var Y1[l][3 * k - 2];
    var Y2[l][3 * k - 2];
    for (var i = 0; i < l; i++) {
	for (var j = 0; j < 3 * k - 2; j++) {
	    X0[i][j] = a0b0c0.out[i][j] + pb1c0.out[i][j] - a1b1c0.out[i][j] + pb0c1.out[i][j] - a1b0c1.out[i][j] + pb1c1.out[i][j] - a0b1c1.out[i][j];
	    X1[i][j] = a0b0c0.out[i + l][j] + pb1c0.out[i + l][j] - a1b1c0.out[i + l][j] + pb0c1.out[i + l][j] - a1b0c1.out[i + l][j] + pb1c1.out[i + l][j] - a0b1c1.out[i + l][j];
	    Y0[i][j] = a1b0c0.out[i][j] + a0b1c0.out[i][j] + a0b0c1.out[i][j] + pb1c1.out[i][j] - a1b1c1.out[i][j];
	    Y1[i][j] = a1b0c0.out[i + l][j] + a0b1c0.out[i + l][j] + a0b0c1.out[i + l][j] + pb1c1.out[i + l][j] - a1b1c1.out[i + l][j];
	    if (i < l - 2) {
		X2[i][j] = a0b0c0.out[i + 2 * l][j] + pb1c0.out[i + 2 * l][j] - a1b1c0.out[i + 2 * l][j] + pb0c1.out[i + 2 * l][j] - a1b0c1.out[i + 2 * l][j] + pb1c1.out[i + 2 * l][j] - a0b1c1.out[i + 2 * l][j];	    
		Y2[i][j] = a1b0c0.out[i + 2 * l][j] + a0b1c0.out[i + 2 * l][j] + a0b0c1.out[i + 2 * l][j] + pb1c1.out[i + 2 * l][j] - a1b1c1.out[i + 2 * l][j];
	    } else {
		X2[i][j] = 0;
		Y2[i][j] = 0;
	    }    
	}
    }
    
    component carry_check[l][2];
    for (var i = 0; i < l; i++) {
	if (3 * k - 2 < 2 * k + 4) {
            carry_check[i][0] = CheckCarryToZero(n, 3 * n + 4 + LOGK + LOGL, 2 * k + 4);
            carry_check[i][1] = CheckCarryToZero(n, 3 * n + 4 + LOGK + LOGL, 2 * k + 4);
	} else {
            carry_check[i][0] = CheckCarryToZero(n, 3 * n + 4 + LOGK + LOGL, 3 * k - 2);
            carry_check[i][1] = CheckCarryToZero(n, 3 * n + 4 + LOGK + LOGL, 3 * k - 2);
	}
	    
        for (var j = 0; j < k; j ++) {
            carry_check[i][0].in[j] <== X0[i][j] + X1[i][j] - Y1[i][j] - Y2[i][j] - Y2[i][j] - p_prod_real0[i].out[j] - prod_real[i][1][j];
	    carry_check[i][1].in[j] <== Y0[i][j] + X1[i][j] + Y1[i][j] + X2[i][j] + X2[i][j] - p_prod_imag0[i].out[j] - prod_imag[i][1][j];
        }
	if (3 * k - 2 < 2 * k + 4) {
            for (var j = k; j < 3 * k - 2; j ++) {
		carry_check[i][0].in[j] <== X0[i][j] + X1[i][j] - Y1[i][j] - Y2[i][j] - Y2[i][j] - p_prod_real0[i].out[j] - prod_real[i][1][j];
		carry_check[i][1].in[j] <== Y0[i][j] + X1[i][j] + Y1[i][j] + X2[i][j] + X2[i][j] - p_prod_imag0[i].out[j] - prod_imag[i][1][j];
            }
            for (var j = 3 * k - 2; j < 2 * k + 4; j++) {
		carry_check[i][0].in[j] <== - prod_real[i][1][j];
		carry_check[i][1].in[j] <== - prod_imag[i][1][j];
	    }
        } else {
	    for (var j = k; j < 2 * k + 4; j ++) {
		carry_check[i][0].in[j] <== X0[i][j] + X1[i][j] - Y1[i][j] - Y2[i][j] - Y2[i][j] - p_prod_real0[i].out[j] - prod_real[i][1][j];
		carry_check[i][1].in[j] <== Y0[i][j] + X1[i][j] + Y1[i][j] + X2[i][j] + X2[i][j] - p_prod_imag0[i].out[j] - prod_imag[i][1][j];
            }
            for (var j = 2 * k + 4; j < 3 * k - 2; j++) {
		carry_check[i][0].in[j] <== X0[i][j] + X1[i][j] - Y1[i][j] - Y2[i][j] - Y2[i][j] - p_prod_real0[i].out[j];
		carry_check[i][1].in[j] <== Y0[i][j] + X1[i][j] + Y1[i][j] + X2[i][j] + X2[i][j] - p_prod_imag0[i].out[j];
	    }

	}
    }
}


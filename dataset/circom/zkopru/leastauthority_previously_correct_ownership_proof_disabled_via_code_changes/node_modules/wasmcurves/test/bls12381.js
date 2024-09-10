const assert = require("assert");
const buildBls12381 = require("../src/bls12381/build_bls12381.js");
const buildProtoboard = require("wasmbuilder").buildProtoboard;
const {bitLength} = require("../src/bigint.js");

describe("Basic tests for g1 in bls12-381", function () {

    this.timeout(10000000);

    const n8q=48;
    const n8r=32;

    function getFieldElementF12(pR) {
        pb.ftm_fromMontgomery(pR, pR);
        const res =  [
            [
                [
                    pb.get(pR),
                    pb.get(pR+n8q),
                ],[
                    pb.get(pR+n8q*2),
                    pb.get(pR+n8q*3),
                ],[
                    pb.get(pR+n8q*4),
                    pb.get(pR+n8q*5),
                ]
            ],[
                [
                    pb.get(pR+n8q*6),
                    pb.get(pR+n8q*7),
                ],[
                    pb.get(pR+n8q*8),
                    pb.get(pR+n8q*9),
                ],[
                    pb.get(pR+n8q*10),
                    pb.get(pR+n8q*11),
                ]
            ]
        ];
        pb.ftm_toMontgomery(pR, pR);
        return res;
    }
    function getFieldElementF6(pR) {
        pb.f6m_fromMontgomery(pR, pR);
        const res =  [
            [
                pb.get(pR),
                pb.get(pR+n8q),
            ],[
                pb.get(pR+n8q*2),
                pb.get(pR+n8q*3),
            ],[
                pb.get(pR+n8q*4),
                pb.get(pR+n8q*5),
            ]
        ];
        pb.f6m_toMontgomery(pR, pR);
        return res;
    }
    function getFieldElementF2(pR) {
        pb.f2m_fromMontgomery(pR, pR);
        const res =  [
            pb.get(pR),
            pb.get(pR+n8q),
        ];
        pb.f2m_toMontgomery(pR, pR);
        return res;
    }

    function assertEqualF12(p1, p2) {
        for (let i=0; i<2; i++) {
            for (let j=0; j<3; j++) {
                for (let k=0; k<2; k++) {
                    assert.equal(p1[i][j][k], p2[i][j][k]);
                }
            }
        }
    }

    function assertEqualF6(p1, p2) {
        for (let j=0; j<3; j++) {
            for (let k=0; k<2; k++) {
                assert.equal(BigInt(p1[j][k]), BigInt(p2[j][k]));
            }
        }
    }

    function assertEqualF2(p1, p2) {
        for (let k=0; k<2; k++) {
            assert.equal(p1[k], p2[k]);
        }
    }

    function ns(p) {
        pb.f1m_fromMontgomery(p, p);
        const n = pb.get(p);
        pb.f1m_toMontgomery(p, p);
        return "0x" + n.toString(16);
    }

    //eslint-disable-next-line no-unused-vars
    function printF1(s, p) {
        console.log(s, " " + ns(p));
    }

    //eslint-disable-next-line no-unused-vars
    function printF2(s, p) {
        console.log(s + " Fq2(" + ns(p) + " + " + ns(p+n8q) +"*u " );
    }

    //eslint-disable-next-line no-unused-vars
    function printF6(s, p) {
        console.log(s + " [Fq2(\n" + ns(p) + " +\n " + ns(p+n8q) +"*u],[" );
        console.log("Fq2(\n" + ns(p+n8q*2) + " +\n " + ns(p+n8q*3) +"*u],[" );
        console.log("Fq2(\n" + ns(p+n8q*4) + " +\n " + ns(p+n8q*5) +"*u]" );
    }

    //eslint-disable-next-line no-unused-vars
    function printF12(s, p) {
        console.log(s + " [ [Fq2(\n" + ns(p) + " +\n " + ns(p+n8q) +"*u],[" );
        console.log("Fq2(\n" + ns(p+n8q*2) + " +\n " + ns(p+n8q*3) +"*u],[" );
        console.log("Fq2(\n" + ns(p+n8q*4) + " +\n " + ns(p+n8q*5) +"*u]]" );
        console.log("[ [Fq2(\n" + ns(p+n8q*6) + " +\n " + ns(p+n8q*7) +"*u],[" );
        console.log("Fq2(\n" + ns(p+n8q*8) + " +\n " + ns(p+n8q*9) +"*u],[" );
        console.log("Fq2(\n" + ns(p+n8q*10) + " +\n " + ns(p+n8q*11) +"*u]]" );
    }

    //eslint-disable-next-line no-unused-vars
    function printG1(s, p) {
        console.log(s + " G1(" + ns(p) + " , " + ns(p+n8q) + " , " + ns(p+n8q*2) + ")"   );
    }

    //eslint-disable-next-line no-unused-vars
    function printG2(s, p) {
        console.log(s + " (G2):");
        for (let i=0; i<6; i++) {
            console.log(ns(p+n8q*i));
        }
        console.log("");
    }


    let pb;
    before(async () => {
        pb = await buildProtoboard((module) => {
            buildBls12381(module);
        }, n8q);
    });

    it("It should do a basic point operation in F2", async () => {
        const e1 = pb.alloc(n8q*2);
        pb.set(e1, 1n);
        pb.set(e1+n8q, 2n);
        const e2 = pb.alloc(n8q*2);
        pb.f2m_square(e1,e2);

        const e3 = pb.alloc(n8q*2);
        pb.f2m_mul(e1,e1, e3);

        const res2 = getFieldElementF2(e2);
        const res3 = getFieldElementF2(e3);

        assert(res2[0] = res3[0]);
        assert(res2[1] = res3[1]);
    });
    it("It should do a big exponentioation F2", async () => {
        const e1 = pb.alloc(n8q*2);
        pb.set(e1, 1n);
        pb.set(e1+n8q, 2n);

        const exp = pb.bls12381.q ** 2n - 1n;

        const l = (Math.floor((bitLength(exp)- 1) / 64) +1)*8;

        const ps = pb.alloc(l);

        pb.set(ps, exp, l);

        const e2 = pb.alloc(n8q*2);
        pb.f2m_exp(e1, ps, l, e2);

        const res2 = getFieldElementF2(e2);

        assert.equal(res2[0], 1n);
        assert.equal(res2[1], 0n);
    });
    it("It should do a basic op in f2", async () => {
        const e1 = pb.alloc(n8q*2);

        for (let i=0; i<2; i++) {
            pb.set(e1+n8q*i, BigInt(i+1));
        }

        pb.f2m_toMontgomery(e1, e1);

        const e2 = pb.alloc(n8q*2);
        pb.f2m_square(e1, e2);

        const e3 = pb.alloc(n8q*2);
        pb.f2m_mul(e1,e1, e3);

        const res2 = getFieldElementF2(e2);
        const res3 = getFieldElementF2(e3);

        assertEqualF2(res2, res3);
    });
    it("It should do a basic op in f6", async () => {
        const e1 = pb.alloc(n8q*6);

        for (let i=0; i<6; i++) {
            if ((i==2)||(i==5)) {
                pb.set(e1+n8q*i, 1n);
            } else {
                pb.f1m_zero(e1+n8q*i);
            }
        }

        pb.f6m_toMontgomery(e1, e1);

        const e2 = pb.alloc(n8q*6);
        pb.f6m_square(e1, e2);

        const e3 = pb.alloc(n8q*6);
        pb.f6m_mul(e1,e1, e3);

        pb.f6m_fromMontgomery(e2, e2);
        pb.f6m_fromMontgomery(e3, e3);

        const res2 = getFieldElementF6(e2);
        const res3 = getFieldElementF6(e3);

        assertEqualF6(res2, res3);
    });
    it("It should do a basic op in f12", async () => {
        const e1 = pb.alloc(n8q*12);

        for (let i=0; i<12; i++) {
            if ((i==5)||(i==6)) {
                pb.set(e1+n8q*i, 1n);
            } else {
                pb.f1m_zero(e1+n8q*i);
            }
        }

        pb.ftm_toMontgomery(e1, e1);

        const e2 = pb.alloc(n8q*12);
        pb.ftm_square(e1, e2);

        const e3 = pb.alloc(n8q*12);
        pb.ftm_mul(e1,e1, e3);

        pb.ftm_fromMontgomery(e2, e2);
        pb.ftm_fromMontgomery(e3, e3);

        const res2 = getFieldElementF12(e2);
        const res3 = getFieldElementF12(e3);

        assertEqualF12(res2, res3);
    });


    it("It should do a big exponentioation F12", async () => {
        const e1 = pb.alloc(n8q*12);

        for (let i=0; i<12; i++) {
            pb.set(e1+n8q*i, BigInt(i+1));
        }

        const exp = pb.bls12381.q ** 12n - 1n;

        const l = (Math.floor((bitLength(exp) - 1) / 64) +1)*8;

        const ps = pb.alloc(l);

        pb.set(ps, exp, l);

        const e2 = pb.alloc(n8q*12);
        pb.ftm_exp(e1, ps, l, e2);

        const res2 = getFieldElementF12(e2);

        assert.equal(res2[0][0][0], 1n);
        assert.equal(res2[0][0][1], 0n);
        assert.equal(res2[0][1][0], 0n);
        assert.equal(res2[0][1][1], 0n);
        assert.equal(res2[0][2][0], 0n);
        assert.equal(res2[0][2][1], 0n);
        assert.equal(res2[1][0][0], 0n);
        assert.equal(res2[1][0][1], 0n);
        assert.equal(res2[1][1][0], 0n);
        assert.equal(res2[1][1][1], 0n);
        assert.equal(res2[1][2][0], 0n);
        assert.equal(res2[1][2][1], 0n);
    });
    it("It should do a basic point doubling adding G1", async () => {
        const pG1 = pb.bls12381.pG1gen;

        const p1 = pb.alloc(n8q*3);
        const p2 = pb.alloc(n8q*3);

        pb.g1m_add(pG1, pG1, p1); // 2*G1
        pb.g1m_add(p1, pG1, p1);  // 3*G1
        pb.g1m_add(p1, pG1, p1);  // 4*G1

        pb.g1m_double(pG1, p2); // 2*G1
        pb.g1m_double(p2, p2); // 4*G1

        assert.equal(pb.g1m_isZero(pG1), 0);
        assert.equal(pb.g1m_eq(p1, p2), 1);

        pb.g1m_sub(p1, p2, p1);  // 0
        assert.equal(pb.g1m_isZero(p1), 1);

    });
    it("It should timesScalar G1", async () => {

        const s=10;
        const pG1 = pb.bls12381.pG1gen;

        const p1 = pb.alloc(n8q*3);
        const p2 = pb.alloc(n8q*3);
        const ps = pb.alloc(n8r);

        pb.set(ps, s);

        pb.g1m_timesScalar(pG1, ps, n8r, p1);

        pb.g1m_zero(p2);

        for (let i=0; i<s; i++) {
            pb.g1m_add(pG1,p2, p2);
        }

        assert.equal(pb.g1m_eq(p1, p2), 1);
    });
    it("G1n == 0", async () => {
        const pG1 = pb.bls12381.pG1gen;
        const pr = pb.bls12381.pr;

        const p1 = pb.alloc(n8q*3);

        pb.g1m_timesScalar(pG1, pr, n8r, p1);

        assert.equal(pb.g1m_isZero(p1), 1);
    });
    it("It should do a basic point doubling adding G2", async () => {
        const pG2 = pb.bls12381.pG2gen;

        const p1 = pb.alloc(n8q*6);
        const p2 = pb.alloc(n8q*6);

        pb.g2m_add(pG2, pG2, p1); // 2*G1
        pb.g2m_add(p1, pG2, p1);  // 3*G1
        pb.g2m_add(p1, pG2, p1);  // 4*G1

        pb.g2m_double(pG2, p2); // 2*G1
        pb.g2m_double(p2, p2); // 4*G1

        assert.equal(pb.g2m_isZero(pG2), 0);
        assert.equal(pb.g2m_eq(p1, p2), 1);

        pb.g2m_sub(p1, p2, p1);  // 0
        assert.equal(pb.g2m_isZero(p1), 1);

    });
    it("It should timesScalar G2", async () => {

        const s=10;
        const pG2 = pb.bls12381.pG2gen;

        const p1 = pb.alloc(n8q*6);
        const p2 = pb.alloc(n8q*6);
        const ps = pb.alloc(n8r);

        pb.set(ps, s);

        pb.g2m_timesScalar(pG2, ps, n8r, p1);

        pb.g2m_zero(p2);

        for (let i=0; i<s; i++) {
            pb.g2m_add(pG2,p2, p2);
        }

        assert.equal(pb.g2m_eq(p1, p2), 1);
    });
    it("G2n == 0", async () => {
        const pG2 = pb.bls12381.pG2gen;
        const pr = pb.bls12381.pr;

        const p1 = pb.alloc(n8q*6);

        pb.g2m_timesScalar(pG2, pr, n8r, p1);

        assert.equal(pb.g2m_isZero(p1), 1);
    });

    it("Should f6_mul1", async () => {
        const pA = pb.alloc(n8q*6);
        const pB = pb.alloc(n8q*6);
        const pRes1 = pb.alloc(n8q*6);
        const pRes2 = pb.alloc(n8q*6);
        const pOne = pb.alloc(n8q*6);
        const pRef = pb.alloc(n8q*6);
        for (let i=0; i<6; i++) {
            pb.set(pA + i*n8q, i+1);
            if ([2,3].indexOf(i)>=0) {
                pb.set(pB + i*n8q, i+1);
            } else {
                pb.f1m_zero(pB + i*n8q);
            }
        }
        pb.f6m_one(pOne);

        pb.f6m_toMontgomery(pA,pA);
        pb.f6m_toMontgomery(pB,pB);
        const pc1 = pb.alloc(n8q*2);
        pb.set(pc1, 3);
        pb.set(pc1 + n8q, 4);
        pb.f2m_toMontgomery(pc1, pc1);


        pb.f6m_mul1(pOne, pc1, pRef);
        pb.f6m_mul1(pA, pc1, pRes1);
        pb.f6m_mul(pA, pB, pRes2);

        const ref = getFieldElementF6(pRef);
        const res1 = getFieldElementF6(pRes1);
        const res2 = getFieldElementF6(pRes2);

        assertEqualF6(ref, [[0,0], [3,4], [0,0]]);
        assertEqualF6(res1, res2);
    });

    it("Should f6_mul01", async () => {
        const pA = pb.alloc(n8q*6);
        const pB = pb.alloc(n8q*6);
        const pRes1 = pb.alloc(n8q*6);
        const pRes2 = pb.alloc(n8q*6);
        const pOne = pb.alloc(n8q*6);
        const pRef = pb.alloc(n8q*6);
        for (let i=0; i<6; i++) {
            pb.set(pA + i*n8q, i+1);
            if ([0,1,2,3].indexOf(i)>=0) {
                pb.set(pB + i*n8q, i+1);
            } else {
                pb.f1m_zero(pB + i*n8q);
            }
        }
        pb.f6m_one(pOne);

        pb.f6m_toMontgomery(pA,pA);
        pb.f6m_toMontgomery(pB,pB);
        const pc0 = pb.alloc(n8q*2);
        pb.set(pc0, 1);
        pb.set(pc0 + n8q, 2);
        pb.f2m_toMontgomery(pc0, pc0);
        const pc1 = pb.alloc(n8q*2);
        pb.set(pc1, 3);
        pb.set(pc1 + n8q, 4);
        pb.f2m_toMontgomery(pc1, pc1);


        pb.f6m_mul01(pOne, pc0, pc1, pRef);
        pb.f6m_mul01(pA, pc0, pc1, pRes1);
        pb.f6m_mul(pA, pB, pRes2);

        const ref = getFieldElementF6(pRef);
        const res1 = getFieldElementF6(pRes1);
        const res2 = getFieldElementF6(pRes2);

        assertEqualF6(ref, [[1,2], [3,4], [0,0]]);
        assertEqualF6(res1, res2);
    });
    it("Should f12_014", async () => {
        const pA = pb.alloc(n8q*12);
        const pB = pb.alloc(n8q*12);
        const pRes1 = pb.alloc(n8q*12);
        const pRes2 = pb.alloc(n8q*12);
        const pOne = pb.alloc(n8q*12);
        const pRef = pb.alloc(n8q*12);
        for (let i=0; i<12; i++) {
            pb.set(pA + i*n8q, i+1);
            if ([0,1,2,3,8,9].indexOf(i)>=0) {
                pb.set(pB + i*n8q, i+1);
            } else {
                pb.f1m_zero(pB + i*n8q);
            }
        }
        pb.ftm_one(pOne);

        pb.ftm_toMontgomery(pA,pA);
        pb.ftm_toMontgomery(pB,pB);
        const pc0 = pb.alloc(n8q*2);
        pb.set(pc0, 1);
        pb.set(pc0 + n8q, 2);
        pb.ftm_toMontgomery(pc0, pc0);
        const pc1 = pb.alloc(n8q*2);
        pb.set(pc1, 3);
        pb.set(pc1 + n8q, 4);
        pb.f2m_toMontgomery(pc1, pc1);
        const pc4 = pb.alloc(n8q*2);
        pb.set(pc4, 9);
        pb.set(pc4 + n8q, 10);
        pb.f2m_toMontgomery(pc4, pc4);


        pb.ftm_mul014(pOne, pc0, pc1, pc4, pRef);
        pb.ftm_mul014(pA, pc0, pc1, pc4, pRes1);
        pb.ftm_mul(pA, pB, pRes2);

        const ref = getFieldElementF12(pRef);
        const res1 = getFieldElementF12(pRes1);
        const res2 = getFieldElementF12(pRes2);

        assertEqualF12(ref, [[[1,2], [3,4], [0,0]],[[0,0], [9,10], [0,0]]]);
        assertEqualF12(res1, res2);
    });


    it("Should Test Frobenius", async () => {
        const pA = pb.alloc(n8q*12);
        const pB = pb.alloc(n8q*12);
        const pAq = pb.alloc(n8q*12);
        const pAqi = pb.alloc(n8q*12);
        const pq = pb.bls12381.pq;
        let res1, res2;
        for (let i=0; i<12; i++) {
            pb.set(pA+n8q*i, BigInt(i+1));
        }
        pb.ftm_toMontgomery(pA, pA);
        // printF12("pA", pA);

        pb.ftm_frobeniusMap0(pA, pB);
        res1 = getFieldElementF12(pA);
        res2 = getFieldElementF12(pB);

        assertEqualF12(res1, res2);

        pb.ftm_exp(pA, pq, n8q,pAq);

        for (let power = 1; power<10; ++power) {
            pb["ftm_frobeniusMap"+power](pA, pAqi);
            res1 = getFieldElementF12(pAq);
            res2 = getFieldElementF12(pAqi);

            // printF12("Aq", pAq);
            // printF12("Aqi", pAqi);

            assertEqualF12(res1, res2);

            pb.ftm_exp(pAq, pq, n8q,pAq);
        }

    });

    it("Should test Inverse", async () => {


        // template<typename FieldT>
        // void test_unitary_inverse()
        // {
        //     assert(FieldT::extension_degree() % 2 == 0);
        //     FieldT a = FieldT::random_element();
        //     FieldT aqcubed_minus1 = a.Frobenius_map(FieldT::extension_degree()/2) * a.inverse();
        //     assert(aqcubed_minus1.inverse() == aqcubed_minus1.unitary_inverse());

        const pA = pb.alloc(n8q*12);
        const pAf = pb.alloc(n8q*12);
        const pAInverse = pb.alloc(n8q*12);
        const pAcubedMinus1 = pb.alloc(n8q*12);
        const pAcubedMinus1Inverse = pb.alloc(n8q*12);
        const pAcubedMinus1UnitaryInverse = pb.alloc(n8q*12);
        let res1, res2;
        for (let i=0; i<12; i++) {
            pb.set(pA+n8q*i, BigInt(i+1));
        }
        pb.ftm_toMontgomery(pA, pA);
        pb.ftm_frobeniusMap6(pA, pAf);
        pb.ftm_inverse(pA, pAInverse);
        pb.ftm_mul(pAf, pAInverse, pAcubedMinus1);
        pb.ftm_inverse(pAcubedMinus1, pAcubedMinus1Inverse);
        pb.ftm_conjugate(pAcubedMinus1, pAcubedMinus1UnitaryInverse);

        // printF12("AcubedMinus1Inverse: ", pAcubedMinus1Inverse);
        // printF12("AcubedMinus1UnitaryInverse: ", pAcubedMinus1UnitaryInverse);
        res1 = getFieldElementF12(pAcubedMinus1Inverse);
        res2 = getFieldElementF12(pAcubedMinus1UnitaryInverse);
        assertEqualF12(res1, res2);

    });

    it("Should test Cyclotomic Square", async () => {

        // typedef Fqk<edwards_pp> FieldT;
        // assert(FieldT::extension_degree() % 2 == 0);
        //  FieldT a = FieldT::random_element();
        // FieldT a_unitary = a.Frobenius_map(FieldT::extension_degree()/2) * a.inverse();
        // // beta = a^((q^(k/2)-1)*(q+1))
        // FieldT beta = a_unitary.Frobenius_map(1) * a_unitary;
        // assert(beta.cyclotomic_squared() == beta.squared());


        const pA = pb.alloc(n8q*12);
        const pBeta = pb.alloc(n8q*12);
        const pCycSquare = pb.alloc(n8q*12);
        const pNormSquare = pb.alloc(n8q*12);
        const pCycExp = pb.alloc(n8q*12);
        const pNormExp = pb.alloc(n8q*12);
        const pr = pb.alloc(n8q);
        const pe = pb.alloc(544);
        const peZ = pb.alloc(n8q);

        pb.set(pr, 0x73eda753299d7d483339d80809a1d80553bda402fffe5bfeffffffff00000001n);
        pb.set(pe, 322277361516934140462891564586510139908379969514828494218366688025288661041104682794998680497580008899973249814104447692778988208376779573819485263026159588510513834876303014016798809919343532899164848730280942609956670917565618115867287399623286813270357901731510188149934363360381614501334086825442271920079363289954510565375378443704372994881406797882676971082200626541916413184642520269678897559532260949334760604962086348898118982248842634379637598665468817769075878555493752214492790122785850202957575200176084204422751485957336465472324810982833638490904279282696134323072515220044451592646885410572234451732790590013479358343841220074174848221722017083597872017638514103174122784843925578370430843522959600095676285723737049438346544753168912974976791528535276317256904336520179281145394686565050419250614107803233314658825463117900250701199181529205942363159325765991819433914303908860460720581408201373164047773794825411011922305820065611121544561808414055302212057471395719432072209245600258134364584636810093520285711072578721435517884103526483832733289802426157301542744476740008494780363354305116978805620671467071400711358839553375340724899735460480144599782014906586543813292157922220645089192130209334926661588737007768565838519456601560804957985667880395221049249803753582637708560n, 544);
        pb.set(peZ, 15132376222941642752n);

        let res1, res2;
        for (let i=0; i<12; i++) {
            pb.set(pA+n8q*i, BigInt(i+1));
        }

        pb.ftm_exp(pA, pe, 544, pBeta);
        pb.ftm_square(pBeta, pNormSquare);
        pb.bls12381__cyclotomicSquare(pBeta, pCycSquare);

        // printF12("NormSquare2: ", pNormSquare);
        // printF12("CycSquare2: ", pCycSquare);
        res1 = getFieldElementF12(pNormSquare);
        res2 = getFieldElementF12(pCycSquare);
        assertEqualF12(res1, res2);


        pb.ftm_exp(pBeta, peZ, n8q, pNormExp);
        pb.ftm_conjugate(pNormExp, pNormExp);
        pb.bls12381__cyclotomicExp_w0(pBeta, pCycExp);

        // printF12("NormExp: ", pNormExp);
        // printF12("CycExp: ", pCycExp);
        res1 = getFieldElementF12(pNormExp);
        res2 = getFieldElementF12(pCycExp);
        assertEqualF12(res1, res2);

    });

    it("Should test unitary", async () => {
        const pG1 = pb.bls12381.pG1gen;
        const pG2 = pb.bls12381.pG2gen;
        const pnG1 = pb.alloc(n8q*3);
        const pnG2 = pb.alloc(n8q*6);

        const pP = pb.alloc(n8q*12);
        const pQ = pb.alloc(n8q*12);
        const pR = pb.alloc(n8q*12);

        pb.g1m_neg(pG1, pnG1);
        pb.g2m_neg(pG2, pnG2);

        pb.bls12381_pairing(pG1, pG2, pP);
        pb.ftm_conjugate(pP, pP);
        pb.bls12381_pairing(pG1, pnG2, pQ);
        pb.bls12381_pairing(pnG1, pG2, pR);

        // printF12("P: ", pP);
        // printF12("Q: ", pQ);
        // printF12("R: ", pR);

        const P = getFieldElementF12(pP);
        const Q = getFieldElementF12(pQ);
        const R = getFieldElementF12(pR);

        assertEqualF12(P, Q);
        assertEqualF12(Q, R);
    });

    it("It should do a basic pairing", async () => {
        const ps = pb.alloc(n8r);
        const pOne = pb.alloc(n8q*12);
        pb.set(ps, 10n);
        const pRes1 = pb.alloc(n8q*12);
        const pRes2 = pb.alloc(n8q*12);
        const pRes3 = pb.alloc(n8q*12);
        const pRes4 = pb.alloc(n8q*12);

        const pG1s = pb.alloc(n8q*3);
        const pG2s = pb.alloc(n8q*2*3);
        const pG1gen = pb.bls12381.pG1gen;
        const pG2gen = pb.bls12381.pG2gen;

        pb.ftm_one(pOne);
        pb.g1m_timesScalar(pG1gen, ps, n8r, pG1s);
        pb.g2m_timesScalar(pG2gen, ps, n8r, pG2s);

        const pPreP = pb.alloc(n8q*3);
        const pPreQ = pb.alloc(n8q*2*3 + n8q*2*3*70);

        pb.bls12381_prepareG1(pG1s, pPreP);
        pb.bls12381_prepareG2(pG2gen, pPreQ);


        // printG1("pPreP: ", pPreP);
        // for (let i=0; i<75; i++) {
        //     printG1("pPreQ " + i + ":", pPreQ + i*48*2*3);
        // }
        pb.bls12381_millerLoop(pPreP, pPreQ, pRes1);
        // printF12("Miller Result: ", pRes1);
        pb.bls12381_finalExponentiation(pRes1, pRes2);

        pb.bls12381_prepareG1(pG1gen, pPreP);
        pb.bls12381_prepareG2(pG2s, pPreQ);
        pb.bls12381_millerLoop(pPreP, pPreQ, pRes3);
        pb.bls12381_finalExponentiation(pRes3, pRes4);

        const res2 = getFieldElementF12(pRes2);
        const res4 = getFieldElementF12(pRes4);

        assertEqualF12(res2, res4);

        pb.bls12381_pairing(pG1s, pG2gen, pRes1);

        const start = new Date().getTime();
        pb.bls12381_pairing(pG1gen, pG2s, pRes2);
        const end = new Date().getTime();
        const time = end - start;
        console.log("Time to compute a single pairing (ms): " + time);

        const resL = getFieldElementF12(pRes1);
        const resR = getFieldElementF12(pRes2);

        assertEqualF12(resL, resR);

    });

    it("Generator should be in group G1", async () => {
        const pG1 = pb.bls12381.pG1gen;

        assert.equal(pb.g1m_inGroupAffine(pG1), 1);
    });

    it("Point in curve and not in group G1", async () => {
        const p1 = pb.alloc(n8q*3);
        const pG1b = pb.bls12381.pG1b;

        pb.set(p1, 4n, n8q);
        pb.f1m_toMontgomery(p1, p1);
        pb.f1m_square(p1, p1+n8q);
        pb.f1m_mul(p1, p1+n8q, p1+n8q);
        pb.f1m_add(p1+n8q, pG1b, p1+n8q);

        assert.equal(pb.g1m_inGroupAffine(p1), 0);
        assert.equal(pb.g1m_inCurveAffine(p1), 0);

        pb.f1m_sqrt(p1+n8q, p1+n8q);

        assert.equal(pb.g1m_inGroupAffine(p1), 0);
        assert.equal(pb.g1m_inCurveAffine(p1), 1);

        const ph= pb.alloc(16);
        pb.set(ph, 0x396c8c005555e1568c00aaab0000aaabn, 16);

        pb.g1m_timesScalarAffine(p1, ph, 16  ,p1);

        assert.equal(pb.g1m_inCurve(p1), 1);
        assert.equal(pb.g1m_inGroup(p1), 1);
    });

    it("It should test in group G2", async () => {
        const pG2 = pb.bls12381.pG2gen;

        assert.equal(pb.g2m_inGroupAffine(pG2), 1);
    });


    it("Point in curve and not in group G2", async () => {
        const p1 = pb.alloc(n8q*6);
        const pG2b = pb.bls12381.pG2b;

        pb.set(p1, 0n, n8q);
        pb.set(p1+n8q, 4n, n8q);
        pb.f2m_toMontgomery(p1, p1);
        pb.f2m_square(p1, p1+n8q*2);
        pb.f2m_mul(p1, p1+n8q*2, p1+n8q*2);
        pb.f2m_add(p1+n8q*2, pG2b, p1+n8q*2);

        assert.equal(pb.g2m_inGroupAffine(p1), 0);
        assert.equal(pb.g2m_inCurveAffine(p1), 0);

        pb.f2m_sqrt(p1+n8q*2, p1+n8q*2);

        assert.equal(pb.g2m_inGroupAffine(p1), 0);
        assert.equal(pb.g2m_inCurveAffine(p1), 1);

        const ph= pb.alloc(64);
        pb.set(ph, 0x05d543a95414e7f1091d50792876a202cd91de4547085abaa68a205b2e5a7ddfa628f1cb4d9e82ef21537e293a6691ae1616ec6e786f0c70cf1c38e31c7238e5n, 64);

        pb.g2m_timesScalarAffine(p1, ph, 64  ,p1);

        assert.equal(pb.g2m_inCurve(p1), 1);
        assert.equal(pb.g2m_inGroup(p1), 1);
    });


});

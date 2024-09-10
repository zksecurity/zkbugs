const assert = require("assert");
const buildBn128 = require("../src/bn128/build_bn128.js");
const buildProtoboard = require("wasmbuilder").buildProtoboard;

describe("Basic tests for g1 in bn128", () => {

    function getFieldElementF12(pR) {
        return [
            [
                [
                    pb.get(pR),
                    pb.get(pR+32),
                ],[
                    pb.get(pR+32*2),
                    pb.get(pR+32*3),
                ],[
                    pb.get(pR+32*4),
                    pb.get(pR+32*5),
                ]
            ],[
                [
                    pb.get(pR+32*6),
                    pb.get(pR+32*7),
                ],[
                    pb.get(pR+32*8),
                    pb.get(pR+32*9),
                ],[
                    pb.get(pR+32*10),
                    pb.get(pR+32*11),
                ]
            ]
        ];
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
        console.log(s + " Fq2(" + ns(p) + " + " + ns(p+32) +"*u " );
    }

    //eslint-disable-next-line no-unused-vars
    function printF6(s, p) {
        console.log(s + " [Fq2(\n" + ns(p) + " +\n " + ns(p+32) +"*u],[" );
        console.log("Fq2(\n" + ns(p+32*2) + " +\n " + ns(p+32*3) +"*u],[" );
        console.log("Fq2(\n" + ns(p+32*4) + " +\n " + ns(p+32*5) +"*u]" );
    }

    //eslint-disable-next-line no-unused-vars
    function printF12(s, p) {
        console.log(s + " [ [Fq2(\n" + ns(p) + " +\n " + ns(p+32) +"*u],[" );
        console.log("Fq2(\n" + ns(p+32*2) + " +\n " + ns(p+32*3) +"*u],[" );
        console.log("Fq2(\n" + ns(p+32*4) + " +\n " + ns(p+32*5) +"*u]]" );
        console.log("[ [Fq2(\n" + ns(p+32*6) + " +\n " + ns(p+32*7) +"*u],[" );
        console.log("Fq2(\n" + ns(p+32*8) + " +\n " + ns(p+32*9) +"*u],[" );
        console.log("Fq2(\n" + ns(p+32*10) + " +\n " + ns(p+32*11) +"*u]]" );
    }

    //eslint-disable-next-line no-unused-vars
    function printG1(s, p) {
        console.log(s + " G1(" + ns(p) + " , " + ns(p+n8) + " , " + ns(p+n8*2) + ")"   );
    }

    //eslint-disable-next-line no-unused-vars
    function printG2(s, p) {
        console.log(s + " (G2):");
        for (let i=0; i<6; i++) {
            console.log(ns(p+n8*i));
        }
        console.log("");
    }


    let pb;
    const n8=32;
    before(async () => {
        pb = await buildProtoboard((module) => {
            buildBn128(module);
        }, n8);
    });

    it("It should do a basic point doubling adding G1", async () => {
        const pG1 = pb.bn128.pG1gen;

        const p1 = pb.alloc(n8*3);
        const p2 = pb.alloc(n8*3);

        pb.g1m_add(pG1, pG1, p1); // 2*G1
        // pb.g1m_normalize(p1, p1);
        printG1("2*G1=",p1);
        pb.g1m_add(p1, pG1, p1);  // 3*G1
        // pb.g1m_normalize(p1, p1);
        printG1("3*G1=",p1);
        pb.g1m_add(p1, pG1, p1);  // 4*G1

        pb.g1m_double(pG1, p2); // 2*G1
        pb.g1m_double(p2, p2); // 4*G1

        assert.equal(pb.g1m_isZero(pG1), 0);
        assert.equal(pb.g1m_eq(p1, p2), 1);

        pb.g1m_sub(p1, p2, p1);  // 0
        assert.equal(pb.g1m_isZero(p1), 1);

    });

    it("It should do a basic doubling adding G1", async () => {
        const pG1 = pb.bn128.pG1gen;

        const p1 = pb.alloc(n8*3);
        const p2 = pb.alloc(n8*3);

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

        const s=2;
        const pG1 = pb.bn128.pG1gen;

        const p1 = pb.alloc(n8*3);
        const p2 = pb.alloc(n8*3);
        const ps = pb.alloc(n8);

        pb.set(ps, s);

        pb.g1m_timesScalar(pG1, ps, n8, p1);

        pb.g1m_zero(p2);

        for (let i=0; i<s; i++) {
            pb.g1m_add(pG1,p2, p2);
        }

        assert.equal(pb.g1m_eq(p1, p2), 1);
    });
    it("G1n == 0", async () => {
        const pG1 = pb.bn128.pG1gen;
        const pr = pb.bn128.pr;

        const p1 = pb.alloc(n8*3);

        pb.g1m_timesScalar(pG1, pr, n8, p1);

        assert.equal(pb.g1m_isZero(p1), 1);
    });
    it("G1n == 0 timesScalarAffine", async () => {
        const pG1 = pb.bn128.pG1gen;
        const pr = pb.bn128.pr;

        const p1 = pb.alloc(n8*3);

        pb.g1m_timesScalarAffine(pG1, pr, n8, p1);

        assert.equal(pb.g1m_isZero(p1), 1);
    });
    it("G2n == 0 timesScalarAffine", async () => {
        const pG2 = pb.bn128.pG2gen;
        const pr = pb.bn128.pr;

        const p1 = pb.alloc(n8*3*2);

        pb.g1m_timesScalarAffine(pG2, pr, n8, p1);

        assert.equal(pb.g1m_isZero(p1), 1);
    });
    it("It should do a basic point doubling adding G2", async () => {
        const pG2 = pb.bn128.pG2gen;

        const p1 = pb.alloc(n8*6);
        const p2 = pb.alloc(n8*6);

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
        const pG2 = pb.bn128.pG2gen;

        const p1 = pb.alloc(n8*6);
        const p2 = pb.alloc(n8*6);
        const ps = pb.alloc(n8);

        pb.set(ps, s);

        pb.g2m_timesScalar(pG2, ps, n8, p1);

        pb.g2m_zero(p2);

        for (let i=0; i<s; i++) {
            pb.g2m_add(pG2,p2, p2);
        }

        assert.equal(pb.g2m_eq(p1, p2), 1);
    });
    it("G2n == 0", async () => {
        const pG2 = pb.bn128.pG2gen;
        const pr = pb.bn128.pr;

        const p1 = pb.alloc(n8*6);

        pb.g2m_timesScalar(pG2, pr, n8, p1);

        assert.equal(pb.g2m_isZero(p1), 1);
    });

    it("Should multiply 024", async () => {
        const pf = pb.alloc(32*12);
        for (let i=0; i<12; i++) {
            pb.set(pf + i*32, i);
        }
        pb.ftm_toMontgomery(pf,pf);
        const pEll0 = pb.alloc(32*2);
        pb.set(pEll0, 1);
        pb.set(pEll0 + 32, 2);
        pb.f2m_toMontgomery(pEll0,pEll0);
        const pVW = pb.alloc(32*2);
        pb.set(pVW, 3);
        pb.set(pVW + 32, 4);
        pb.f2m_toMontgomery(pVW, pVW);
        const pVV = pb.alloc(32*2);
        pb.set(pVV, 5);
        pb.set(pVV + 32, 6);
        pb.f2m_toMontgomery(pVV, pVV);

        pb.bn128__mulBy024(pEll0, pVW, pVV, pf);

        const res1 = getFieldElementF12(pf);
        for (let i=0; i<12; i++) {
            pb.set(pf + i*32, i);
        }
        pb.ftm_toMontgomery(pf,pf);
        pb.bn128__mulBy024(pEll0, pVW, pVV, pf);

        const res2 = getFieldElementF12(pf);

        assertEqualF12(res1, res2);

    });


    it("Should Test Frobenius", async () => {
        const pA = pb.alloc(32*12);
        const pB = pb.alloc(32*12);
        const pAq = pb.alloc(32*12);
        const pAqi = pb.alloc(32*12);
        const pq = pb.bn128.pq;
        let res1, res2;
        for (let i=0; i<12; i++) {
            pb.set(pA+32*i, BigInt(i+1));
        }
        pb.ftm_toMontgomery(pA, pA);
        // printF12("pA", pA);

        pb.bn128__frobeniusMap0(pA, pB);
        res1 = getFieldElementF12(pA);
        res2 = getFieldElementF12(pB);
        assertEqualF12(res1, res2);

        pb.ftm_exp(pA, pq, 32,pAq);

        for (let power = 1; power<10; ++power) {
            pb["bn128__frobeniusMap"+power](pA, pAqi);
            res1 = getFieldElementF12(pAq);
            res2 = getFieldElementF12(pAqi);

            // printF12("Aq", pAq);
            // printF12("Aqi", pAqi);

            assertEqualF12(res1, res2);

            pb.ftm_exp(pAq, pq, 32,pAq);
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
        // }

        const pA = pb.alloc(32*12);
        const pAf = pb.alloc(32*12);
        const pAInverse = pb.alloc(32*12);
        const pAcubedMinus1 = pb.alloc(32*12);
        const pAcubedMinus1Inverse = pb.alloc(32*12);
        const pAcubedMinus1UnitaryInverse = pb.alloc(32*12);
        let res1, res2;
        for (let i=0; i<12; i++) {
            pb.set(pA+32*i, BigInt(i+1));
        }
        pb.ftm_toMontgomery(pA, pA);
        pb.bn128__frobeniusMap6(pA, pAf);
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
        // FieldT a = FieldT::random_element();
        // FieldT a_unitary = a.Frobenius_map(FieldT::extension_degree()/2) * a.inverse();
        // // beta = a^((q^(k/2)-1)*(q+1))
        // FieldT beta = a_unitary.Frobenius_map(1) * a_unitary;
        // assert(beta.cyclotomic_squared() == beta.squared());


        const pA = pb.alloc(32*12);
        const pBeta = pb.alloc(32*12);
        const pCycSquare = pb.alloc(32*12);
        const pNormSquare = pb.alloc(32*12);
        const pCycExp = pb.alloc(32*12);
        const pNormExp = pb.alloc(32*12);
        const pr = pb.alloc(32);
        const pe = pb.alloc(352);
        const peZ = pb.alloc(32);

        pb.set(pr, 21888242871839275222246405745257275088548364400416034343698204186575808495617n);
        pb.set(pe, 552484233613224096312617126783173147097382103762957654188882734314196910839907541213974502761540629817009608548654680343627701153829446747810907373256841551006201639677726139946029199968412598804882391702273019083653272047566316584365559776493027495458238373902875937659943504873220554161550525926302303331747463515644711876653177129578303191095900909191624817826566688241804408081892785725967931714097716709526092261278071952560171111444072049229123565057483750161460024353346284167282452756217662335528813519139808291170539072125381230815729071544861602750936964829313608137325426383735122175229541155376346436093930287402089517426973178917569713384748081827255472576937471496195752727188261435633271238710131736096299798168852925540549342330775279877006784354801422249722573783561685179618816480037695005515426162362431072245638324744480n, 352);
        pb.set(peZ, 4965661367192848881n);

        let res1, res2;
        for (let i=0; i<12; i++) {
            pb.set(pA+32*i, BigInt(i+1));
        }

        pb.ftm_exp(pA, pe, 352, pBeta);
        pb.ftm_square(pBeta, pNormSquare);
        pb.bn128__cyclotomicSquare(pBeta, pCycSquare);

        // printF12("NormSquare2: ", pNormSquare);
        // printF12("CycSquare2: ", pCycSquare);
        res1 = getFieldElementF12(pNormSquare);
        res2 = getFieldElementF12(pCycSquare);
        assertEqualF12(res1, res2);


        pb.ftm_exp(pBeta, peZ, 32, pNormExp);
        pb.bn128__cyclotomicExp_w0(pBeta, pCycExp);

        // printF12("NormExp: ", pNormExp);
        // printF12("CycExp: ", pCycExp);
        res1 = getFieldElementF12(pNormExp);
        res2 = getFieldElementF12(pCycExp);
        assertEqualF12(res1, res2);

    });



    it("It should do a basic pairing", async () => {
        const ps = pb.alloc(32);
        const pOne = pb.alloc(32*12);
        pb.set(ps, 10n);
        const pRes1 = pb.alloc(32*12);
        const pRes2 = pb.alloc(32*12);
        const pRes3 = pb.alloc(32*12);
        const pRes4 = pb.alloc(32*12);

        const pG1s = pb.alloc(32*3);
        const pG2s = pb.alloc(32*2*3);
        const pG1gen = pb.bn128.pG1gen;
        const pG2gen = pb.bn128.pG2gen;

        pb.ftm_one(pOne);
        pb.g1m_timesScalar(pG1gen, ps, 32, pG1s);
        pb.g2m_timesScalar(pG2gen, ps, 32, pG2s);

        const pPreP = pb.alloc(32*3);
        const pPreQ = pb.alloc(32*2*3 + 32*2*3*103);

        pb.bn128_prepareG1(pG1s, pPreP);
        pb.bn128_prepareG2(pG2gen, pPreQ);
        pb.bn128_millerLoop(pPreP, pPreQ, pRes1);
        pb.bn128_finalExponentiation(pRes1, pRes2);

        pb.bn128_prepareG1(pG1gen, pPreP);
        pb.bn128_prepareG2(pG2s, pPreQ);
        pb.bn128_millerLoop(pPreP, pPreQ, pRes3);
        pb.bn128_finalExponentiation(pRes3, pRes4);

        const res2 = getFieldElementF12(pRes2);
        const res4 = getFieldElementF12(pRes4);

        assertEqualF12(res2, res4);

        pb.bn128_pairing(pG1s, pG2gen, pRes1);

        const start = new Date().getTime();
        pb.bn128_pairing(pG1gen, pG2s, pRes2);
        const end = new Date().getTime();
        const time = end - start;
        console.log("Time to compute a single pairing (ms): " + time);

        const resL = getFieldElementF12(pRes1);
        const resR = getFieldElementF12(pRes2);

        assertEqualF12(resL, resR);

    });

    it("It should test multiexp", async () => {
        const N=8;
        const pG1 = pb.bn128.pG1gen;



        const pExpected = pb.alloc(n8*3);
        const pScalarExpected = pb.alloc(n8*N);
        let acc=0;
        for (let i=0; i<N; i++) {
            acc += (i+1)*(i+1);
        }
        pb.set(pScalarExpected, acc);
        pb.g1m_timesScalar(pG1, pScalarExpected, n8, pExpected);

        const pCalculated = pb.alloc(n8*3);

        // Set scalars to 1,2,3
        const pScalars = pb.alloc(n8*N);
        for (let i=0; i<N; i++) {
            pb.set(pScalars+i*n8, i+1);
        }

        // Set points to 1*G, 2*G, 3*G
        const pPoints = pb.alloc(n8*2*N);
        for (let i=0; i<N; i++) {
            pb.g1m_timesScalarAffine(pG1, pScalars+n8*i, n8, pCalculated);
            pb.g1m_toAffine(pCalculated, pPoints+i*n8*2);
        }

        // Do yhe multiexp:  1*1*G + 2*2*G + ...
        pb.g1m_multiexpAffine(pPoints, pScalars, n8, N, pCalculated);

        assert(pb.g1m_eq(pExpected, pCalculated));

    });

    it("Should test compress and decompress in G1", async () => {
        const N=10;
        const pScalar = pb.alloc(n8);
        const pP1 = pb.alloc(n8*3);
        const pP1a = pb.alloc(n8*2);
        const pP2a = pb.alloc(n8*2);
        const pP1c = pb.alloc(n8);
        const pP1u = pb.alloc(n8*2);
        const pG1 = pb.bn128.pG1gen;

        for (let i=0; i<N; i++) {
            pb.set(pScalar, i);
            pb.g1m_timesScalarAffine(pG1, pScalar, n8, pP1);
            pb.g1m_toAffine(pP1, pP1a);
            pb.g1m_LEMtoU(pP1a, pP1u);
            pb.g1m_UtoLEM(pP1u, pP2a);
            assert(pb.g1m_eqAffine(pP1a, pP2a));
            pb.g1m_LEMtoC(pP1a, pP1c);
            pb.g1m_CtoLEM(pP1c, pP2a);
            assert(pb.g1m_eqAffine(pP1a, pP2a));
        }

    });
    it("Should test compress and decompress in G2", async () => {
        const N=10;
        const pScalar = pb.alloc(n8);
        const pP1 = pb.alloc(n8*2*3);
        const pP1a = pb.alloc(n8*2*2);
        const pP2a = pb.alloc(n8*2*2);
        const pP1c = pb.alloc(n8*2);
        const pP1u = pb.alloc(n8*2*2);
        const pG2 = pb.bn128.pG2gen;

        for (let i=0; i<N; i++) {
            pb.set(pScalar, i);
            pb.g2m_timesScalarAffine(pG2, pScalar, n8, pP1);
            pb.g2m_toAffine(pP1, pP1a);
            pb.g2m_LEMtoU(pP1a, pP1u);
            pb.g2m_UtoLEM(pP1u, pP2a);
            assert(pb.g2m_eqAffine(pP1a, pP2a));
            pb.g2m_LEMtoC(pP1a, pP1c);
            pb.g2m_CtoLEM(pP1c, pP2a);
            assert(pb.g2m_eqAffine(pP1a, pP2a));
        }

    });

});

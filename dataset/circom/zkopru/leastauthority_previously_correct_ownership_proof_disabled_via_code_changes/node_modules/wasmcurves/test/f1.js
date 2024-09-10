const assert = require("assert");
const { modInv, isNegative } = require("../src/bigint.js");

const buildF1 = require("../src/f1");
const buildF1m = require("../src/build_f1m");
const buildProtoboard = require("wasmbuilder").buildProtoboard;
const buildTest1 = require("../src/build_test.js").buildTest1;
const buildTest2 = require("../src/build_test.js").buildTest2;

describe("Basic tests for Zq", () => {

    it("It should do a basic addition", async () => {
        const f1 = await buildF1(101);

        const pA = f1.allocInt(3);
        const pB = f1.allocInt(4);
        const pC = f1.allocInt();
        f1.f1_add(pA, pB, pC);

        const c = f1.getInt(pC);
        assert.equal(c, 7);
    });
    it("Should add with 2 chunks", async () => {
        const f1 = await buildF1(0x100000000000000000001n);

        const pA = f1.allocInt(0xFFFFFFFFFFFFFFFFn);
        const pB = f1.allocInt(1);
        const pC = f1.allocInt();

        f1.f1_add(pA, pB, pC);
        const c = f1.getInt(pC);

        assert.equal(c, 0x10000000000000000n);
    });
    it("Should add with 2 chunks overflow", async () => {
        const q = 0x10000000000000001n;
        const f1 = await buildF1(q);

        const pA = f1.allocInt(0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFn % q);
        const pB = f1.allocInt(1);
        const pC = f1.allocInt();

        f1.f1_add(pA, pB, pC);
        const c = f1.getInt(pC);

        assert.equal(c, 1);
    });
    it("Should add with double overflow", async () => {
        const q = (1n << 255n) + 1n;
        const a = ((1n << 256n) - 1n) % q;
        const f1 = await buildF1(q);

        const pA = f1.allocInt(a);
        const pC = f1.allocInt();

        f1.f1_add(pA, pA, pC);

        const c = f1.getInt(pC);
        assert.equal(c, (a + a) % q);
    });
    it("It should do a basic substraction", async () => {
        const f1 = await buildF1(101);

        const pA = f1.allocInt(5);
        const pB = f1.allocInt(3);
        const pC = f1.allocInt();

        f1.f1_sub(pA, pB, pC);
        const c = f1.getInt(pC);

        assert.equal(c, 2);
    });
    it("It should do a basic substraction with negative result", async () => {
        const f1 = await buildF1(101);

        const pA = f1.allocInt(3);
        const pB = f1.allocInt(5);
        const pC = f1.allocInt();

        f1.f1_sub(pA, pB, pC);
        const c = f1.getInt(pC);

        assert.equal(c % 101n, 99);
    });
    it("Should substract with 2 chunks overflow", async () => {
        const q = 0x10000000000000001n;
        const a = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFn % q;
        const f1 = await buildF1(q);

        const pA = f1.allocInt(1);
        const pB = f1.allocInt(a);
        const pC = f1.allocInt();

        f1.f1_sub(pA, pB, pC);
        const c = f1.getInt(pC);

        let d = (1n - a) % q;
        if (isNegative(d)) d = d + q;

        assert.equal(c, d);
    });
    it("It should Substract a big number", async () => {
        const q = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;
        const f1 = await buildF1(q);

        const a = 10000242871839275222246405745257275088548364400416034343698204186575808495617n;
        const b = 10000242871839275222246405745257275088548364400416034343698204186575808234523n;

        const pA = f1.allocInt(a);
        const pB = f1.allocInt(b);
        const pC = f1.allocInt();

        f1.f1_sub(pA, pB, pC);
        const c = f1.getInt(pC);

        let cc = (a - b) % q;
        if (isNegative(cc)) cc = cc + q;
        assert.equal(cc, c % q);


        const pAA = f1.allocInt(b);
        const pBB = f1.allocInt(a);
        const pCC = f1.allocInt();

        f1.f1_sub(pAA, pBB, pCC);
        const d = f1.getInt(pCC);

        let dd = (b - a) % q;
        if (isNegative(dd)) dd = dd + q;
        assert.equal(dd, d % q);
    });

    it("It should do a basic multiplication", async () => {
        const f1 = await buildF1(101);

        const pA = f1.allocInt(3);
        const pB = f1.allocInt(4);
        const pC = f1.allocInt2();

        f1.int_mul(pA, pB, pC);
        const c = f1.getInt2(pC);

        assert.equal(c, 12);
    });

    it("It should do a basic division", async () => {
        const f1 = await buildF1(101);

        const pA = f1.allocInt(12);
        const pB = f1.allocInt(6);
        const pC = f1.allocInt();
        f1.int_div(pA, pB, pC);

        const c = f1.getInt(pC);
        assert.equal(c, 2);
    });
    it("It should do a more complex division", async () => {
        const q = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;
        const f1 = await buildF1(q);

        const pA = f1.allocInt(0xFFFF00000000n);
        const pB = f1.allocInt(0x100000000n);
        const pC = f1.allocInt();
        f1.int_div(pA, pB, pC);

        const c = f1.getInt(pC);
        assert.equal(c, 0xFFFFn);
    });
    it("It should do a division by zero", async () => {
        const q = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;
        const f1 = await buildF1(q);

        const pA = f1.allocInt(0xFFFF00000000n);
        const pB = f1.allocInt(0);
        const pC = f1.allocInt();
        try {
            f1.int_div(pA, pB, pC);
            assert(false, "Didn't throw...");
        } catch (err) {
            assert.equal(err.toString(), "RuntimeError: divide by zero");
        }
    });

    it("It should do a various division", async () => {
        const q = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;
        const f1 = await buildF1(q);


        const v= [
            0n,
            (q - 1n),
            (q - 2n),
            (q - 1n) >> 1n,
            ((q - 1n) >> 1n) + 1n,
            ((q - 1n) >> 1n) + 2n,
            ((q - 1n) >> 1n) - 1n,
            ((q - 1n) >> 1n) - 2n,
            0xF0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0n,
            0x10101010101010101010101010101010n,
            0xFF00FF00FF00FF00FF00FF00FF00FF00n,
            0x11001100110011001100110011001100n,
            0xF0F0F0F0F0F0F0F0n,
            0x1010101010101010n,
            0xFF00FF00FF00FF00n,
            0x1100110011001100n,
            2n,
            1n,
        ];

        const pA = f1.allocInt();
        const pB = f1.allocInt();
        const pC = f1.allocInt();
        const pR = f1.allocInt();
        for (let i=0; i<v.length; i++) {
            for (let j=1; j<v.length; j++) {
                const expected_c = v[i] / v[j];
                const expected_r = v[i] % v[j];

                f1.putInt(pA, v[i]);
                f1.putInt(pB, v[j]);

                f1.int_div(pA, pB, pC, pR);

                const c = f1.getInt(pC);
                const r = f1.getInt(pR);

                assert.equal(expected_r, r);
                assert.equal(expected_c, c);
            }
        }

    });

    it("It should do a basic reduction 1", async () => {
        const f1 = await buildF1(0xFFFFFFFFFFFFFFFFn);

        const pA = f1.allocInt2(0x10000000000000000n);
        const pC = f1.allocInt();

        f1.f1m_mReduct(pA, pC);

        const c = f1.getInt(pC);

        assert.equal(c, 1);
    });
    it("It should do a basic reduction 2", async () => {
        const q = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;
        const f1 = await buildF1(q);

        const a = 10000242871839275222246405745257275088548364400416034343698204186575808495617n;
        const b = 10000242871839275222246405745257275088548364400416034343698204186575808234523n;

        const pA = f1.allocInt(a);
        const pB = f1.allocInt(b);
        const pC = f1.allocInt2();
        const pD = f1.allocInt();

        f1.int_mul(pA, pB, pC);

        f1.f1m_mReduct(pC, pD);

        const r = (1n << 256n) % q;
        const r2 = r * r % q;

        const pR2 = f1.allocInt(r2);


        const pE = f1.allocInt2();
        f1.int_mul(pD, pR2, pE);

        const pF = f1.allocInt();
        f1.f1m_mReduct(pE, pF);

        const f = f1.getInt2(pF);

        assert.equal(a * b % q, f % q);
    });
    it("It should do a basic reduction 3", async () => {
        const q = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;
        const f1 = await buildF1(q);

        const a = 10000242871839275222246405745257275088548364400416034343698204186575808495617n;
        const b = 10000242871839275222246405745257275088548364400416034343698204186575808234523n;

        const pA = f1.allocInt(a);
        const pB = f1.allocInt(b);
        const pC = f1.allocInt();

        f1.f1_mul(pA, pB, pC);

        const c = f1.getInt2(pC);
        assert.equal(a * b % q, c % q);
    });
    it("It should do various test in zq Snarks modules", async () => {
        const q = 21888242871839275222246405745257275088696311157297823662689037894645226208583n;
        const f1 = await buildF1(q);
        const v= [
            q - 1n,
            q - 2n,
            (q - 1n) >> 1n,
            ((q - 1n) >> 1n) + 1n,
            ((q - 1n) >> 1n) + 2n,
            ((q - 1n) >> 1n) - 1n,
            ((q - 1n) >> 1n) - 2n,
            2n,
            1n,
            0n
        ];

        const pA = f1.allocInt();
        const pB = f1.allocInt();
        const pC = f1.allocInt();
        let c;

        for (let i=0; i<v.length; i++) {
            for (let j=0; j<5; j++) {

                f1.putInt(pA, v[i]);
                f1.putInt(pB, v[j]);

                // eq
                assert.equal( f1.int_eq(pA,pB), (i==j));

                // add
                f1.f1_add(pA, pB, pC);
                c = f1.getInt2(pC);
                assert.equal(c, (v[i] + v[j]) % q);

                // sub
                f1.f1_sub(pA, pB, pC);
                c = f1.getInt2(pC);

                let s = (v[i] - v[j]) % q;
                if (isNegative(s)) s=s + q;
                assert.equal(c, s);

                // mul
                f1.f1_mul(pA, pB, pC);
                c = f1.getInt2(pC);
                assert.equal(c, v[i] * v[j] % q);
            }
        }
    });
    it("It should do a test", async () => {
        const q = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;
        const f1 = await buildF1(q);

        const t = f1.test_F1(1000000);

        console.log(t);

    }).timeout(10000000);
    it("Should test to montgomery", async () => {
        const q = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;
        const f1 = await buildF1(q);

        const r = 11n;

        const pR = f1.allocInt(r);
        const pRes = f1.allocInt();
        const pRes2 = f1.allocInt();

        f1.f1m_toMontgomery(pR, pRes);
        const res = f1.getInt(pRes);

        f1.f1m_fromMontgomery(pRes, pRes2);
        const res2 = f1.getInt(pRes2);

        assert.equal(res, r * (1n << 256n) % q);
        assert.equal(res2, r);
    });
    it("Should convert back and forth montgomery", async () => {
        const q = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;
        const v= [
            q - 1n,
            q - 2n,
            (q - 1n) >> 1n,
            ((q - 1n) >> 1n) + 1n,
            ((q - 1n) >> 1n) + 2n,
            ((q - 1n) >> 1n) - 1n,
            ((q - 1n) >> 1n) - 2n,
            2n,
            1n,
            0n
        ];
        const f1 = await buildF1(q);

        const pA = f1.allocInt();

        for (let i=0; i<v.length; i++) {
            f1.putInt(pA, v[i]);

            f1.f1m_toMontgomery(pA, pA);
            f1.f1m_fromMontgomery(pA, pA);

            const a = f1.getInt(pA);
            assert.equal(v[i], a);
        }
    });
    it("Should do inverse", async () => {
        const q = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;
        const v= [
            1n,
            (q - 1n),
            (q - 2n),
            (q - 1n) >> 1n,
            ((q - 1n) >> 1n) + 1n,
            ((q - 1n) >> 1n) + 2n,
            ((q - 1n) >> 1n) - 1n,
            ((q - 1n) >> 1n) - 2n,
            2n,
        ];
        const f1 = await buildF1(q);

        const pA = f1.allocInt();
        const pB = f1.allocInt();
        const pQ = f1.allocInt();

        f1.putInt(pQ, q);

        for (let i=0; i<v.length; i++) {
            f1.putInt(pA, v[i]);

            f1.int_inverseMod(pA, pQ, pB);

            const b = f1.getInt(pB);
            assert.equal(b, modInv(v[i], q));
        }
    });
    it("Should do inverse in montgomery", async () => {
        const q = 1888242871839275222246405745257275088548364400416034343698204186575808495617n;
        const v= [
            1n,
            (q - 1n),
            (q - 2n),
            ((q - 1n) >> 1n),
            ((q - 1n) >> 1n) + 1n,
            ((q - 1n) >> 1n) + 2n,
            ((q - 1n) >> 1n) - 1n,
            ((q - 1n) >> 1n) - 2n,
            2n,
        ];
        const f1 = await buildF1(q);

        const pA = f1.allocInt();
        const pB = f1.allocInt();
        const pC = f1.allocInt();

        for (let i=0; i<v.length; i++) {
            f1.putInt(pA, v[i]);

            f1.f1m_toMontgomery(pA, pA);
            f1.f1m_inverse(pA, pB);
            f1.f1m_mul(pA, pB, pC);
            f1.f1m_fromMontgomery(pC, pC);

            const c = f1.getInt(pC);
            assert(c, 1);
        }
    });
    it("Test Neg", async () => {
        const q = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;
        const v= [
            1n,
            (q - 1n),
            (q - 2n),
            ((q - 1n) >> 1n),
            ((q - 1n) >> 1n) + 1n,
            ((q - 1n) >> 1n) + 2n,
            ((q - 1n) >> 1n) - 1n,
            ((q - 1n) >> 1n) - 2n,
            2n,
        ];
        const f1 = await buildF1(q);

        const pA = f1.allocInt();

        for (let i=0; i<v.length; i++) {
            f1.putInt(pA, v[i]);

            f1.f1m_neg(pA);
            f1.f1m_neg(pA);

            const a = f1.getInt(pA);
            assert.equal(a, v[i]);
        }
    });

    it("It should square right", async () => {
        const q = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;
        const v= [
            0n,
            1n,
            (q - 1n),
            (q - 2n),
            ((q - 1n) >> 1n),
            ((q - 1n) >> 1n) + 1n,
            ((q - 1n) >> 1n) + 2n,
            ((q - 1n) >> 1n) - 1n,
            ((q - 1n) >> 1n) - 2n,
            2n,
            0xFFFFFFFFFFFFFFFFFFFFn,
        ];


        const pbF1m = await buildProtoboard((module) => {
            buildF1m(module, q);
            buildTest2(module, "f1m_mul");
            buildTest1(module, "f1m_square");
        }, 32);

        const pA = pbF1m.alloc();
        const pC1 = pbF1m.alloc();
        const pC2 = pbF1m.alloc();

        for (let i=0; i<v.length; i++) {

            pbF1m.set(pA, v[i]);
            pbF1m.f1m_square(pA, pC1);
            pbF1m.f1m_mul(pA, pA, pC2);

            const c1 = pbF1m.get(pC1);
            const c2 = pbF1m.get(pC2);

            assert.equal(c1, c2);
        }

    });

    it("It should isSquare", async () => {
        const q = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;
        const v= [
            [0n, true],
            [1n, true],
            [2n, true],
            [3n, true],
            [4n, true],
            [5n, false],
            [q - 1n, true]
        ];

        const pbF1m = await buildProtoboard((module) => {
            buildF1m(module, q);
            buildTest2(module, "f1m_mul");
            buildTest1(module, "f1m_square");
        }, 32);

        const pA = pbF1m.alloc();

        for (let i=0; i<v.length; i++) {

            pbF1m.set(pA, v[i][0]);
            pbF1m.f1m_toMontgomery(pA, pA);

            const res = (pbF1m.f1m_isSquare(pA) === 1);
            assert.equal(res, v[i][1]);
        }

    });

    it("It Batch inverse", async () => {
        const q = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;

        const pbF1m = await buildProtoboard((module) => {
            buildF1m(module, q);
        }, 32);

        const pA = pbF1m.alloc(32 *10);

        pbF1m.f1m_one(pA);
        for (let i=1; i<5; i++) {
            pbF1m.f1m_add(pA, pA + 32*(i-1), pA+32*i);
        }

        pbF1m.f1m_batchInverse(pA,32, 5,pA+32*5, 32);

        for (let i=1; i<5; i++) {
            pbF1m.f1m_mul(pA+i*32, pA+(i+5)*32, pA+i*32);
            assert(pbF1m.f1m_isOne(pA+i*32));
        }
    });

    it("It should sqrt right", async () => {
        const q = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;
        const v= [
            0n,
            1n,
            (q - 1n),
            (q - 2n),
            ((q - 1n) >> 1n),
            ((q - 1n) >> 1n) + 1n,
            ((q - 1n) >> 1n) + 2n,
            ((q - 1n) >> 1n) - 1n,
            ((q - 1n) >> 1n) - 2n,
            2n,
            0xFFFFFFFFFFFFFFFFFFFFn,
        ];

        const pbF1m = await buildProtoboard((module) => {
            buildF1m(module, q);
        }, 32);

        const pA = pbF1m.alloc();
        const pC = pbF1m.alloc();
        const pD = pbF1m.alloc();

        for (let i=0; i<v.length; i++) {
            pbF1m.set(pA, v[i] * v[i] % q);
            pbF1m.f1m_toMontgomery(pA, pA);
            pbF1m.f1m_sqrt(pA, pC);
            pbF1m.f1m_fromMontgomery(pC, pC);

            const c = pbF1m.get(pC);
            const expectedC = q - v[i];
            const expectedCn = v[i];

            assert(c == expectedC || c == expectedCn );


            pbF1m.set(pA, v[i]);
            pbF1m.f1m_square(pA, pC);
            pbF1m.f1m_sqrt(pC, pD);
            pbF1m.f1m_square(pD, pD);
            assert(pbF1m.f1m_eq(pC, pD));

        }
    });


    it("It should Load", async () => {
        const q = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;
        const pbF1m = await buildProtoboard((module) => {
            buildF1m(module, q);
        }, 32);

        function num(n) {
            let acc = 0n;
            for (let i=0; i<n; i++) {
                acc = acc + ( BigInt(i%256) << BigInt(i*8)  );
            }
            return acc % q;
        }

        const pSerie = pbF1m.alloc(256);
        const pA = pbF1m.alloc();

        for (let i=0; i<256; i++) pbF1m.i8[pSerie+i] = i;

        for (let i=0; i<256; i++) {

            pbF1m.f1m_load(pSerie, i, pA);

            const c = pbF1m.get(pA);

            assert.equal(c, num(i));
        }
    });

    it("It should timesScalar", async () => {
        const q = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;
        const pbF1m = await buildProtoboard((module) => {
            buildF1m(module, q);
        }, 32);

        function num(n) {
            let acc = 0n;
            for (let i=0; i<n; i++) {
                acc = acc + ( BigInt(i%256) << BigInt(i*8)  );
            }
            return acc % q;
        }

        const pSerie = pbF1m.alloc(256);
        const pA = pbF1m.alloc();

        const base = 0xFFFFFFFFFFFFFFFFFFFFn;
        const pBase = pbF1m.alloc();
        pbF1m.set(pBase, base);
        pbF1m.f1m_toMontgomery(pBase, pBase);


        for (let i=0; i<256; i++) pbF1m.i8[pSerie+i] = i;

        for (let i=0; i<256; i++) {

            pbF1m.f1m_timesScalar(pBase, pSerie, i, pA);
            pbF1m.f1m_fromMontgomery(pA, pA);

            const c = pbF1m.get(pA);
            const ref = base * num(i) % q;

            assert.equal(c, ref);
        }
    });

    it("It should compare profiling square", async () => {

        let start,end,time;

        const q = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;
        const A = 0xFFFFFFFFFFFFFFFFFFFFn;

        const pbF1m = await buildProtoboard((module) => {
            buildF1m(module, q);
            buildTest2(module, "f1m_mul");
            buildTest1(module, "f1m_square");
        }, 32);

        const pA = pbF1m.alloc();
        const pC = pbF1m.alloc();

        pbF1m.set(pA, A);

        start = new Date().getTime();
        pbF1m.test_f1m_mul(pA, pA, pC, 50000000);
        end = new Date().getTime();
        time = end - start;

        const c1 = pbF1m.get(pC);

        console.log("Mul Time (ms): " + time);

        start = new Date().getTime();
        pbF1m.test_f1m_square(pA, pC, 50000000);
        end = new Date().getTime();
        time = end - start;

        const c2 = pbF1m.get(pC);

        console.log("Square Time (ms): " + time);

        assert.equal(c1, c2);

    }).timeout(10000000);


    it("It should profile int", async () => {

        let start,end,time;

        const q = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;
        const A=(q - 1n);
        const B=(q - 1n) >> 1n;

        const pbF1m = await buildProtoboard((module) => {
            buildF1m(module, q);
            buildTest2(module, "f1m_mul");
        }, 32);

        const pA = pbF1m.alloc();
        const pB = pbF1m.alloc();
        const pC = pbF1m.alloc();

        pbF1m.set(pA, A);
        pbF1m.f1m_toMontgomery(pA, pA);
        pbF1m.set(pB, B);
        pbF1m.f1m_toMontgomery(pB, pB);


        start = new Date().getTime();
        pbF1m.test_f1m_mul(pA, pB, pC, 50000000);
        end = new Date().getTime();
        time = end - start;

        pbF1m.f1m_fromMontgomery(pC, pC);

        const c1 = pbF1m.get(pC, 1, 32);
        assert.equal(c1, A * B % q);

        console.log("Mul Time (ms): " + time);

        //        start = new Date().getTime();
        //        pbF1m.test_f1m_mulOld(pA, pB, pC, 50000000);
        //        end = new Date().getTime();
        //        time = end - start;
        //
        //
        //        pbF1m.f1m_fromMontgomery(pC, pC);
        //
        //        const c2 = pbF1m    .get(pC, 1, 32);
        //        assert(c2.equals(A.times(B).mod(q)));
        //
        //        console.log("Mul Old Time (ms): " + time);

    }).timeout(10000000);

});

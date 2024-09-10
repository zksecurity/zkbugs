const assert = require("assert");

const buildProtoboard = require("wasmbuilder").buildProtoboard;
const buildMNT6753 = require("../src/mnt6753/build_mnt6753.js");
const buildPedersenHash = require("../src/build_pedersenhash.js");
const baseTables = require("../build/pedersenparams_mnt6753.js");

describe("Basic tests for MNT6753", function () {
    let pb;

    this.timeout(100000);

    function getPointG1(pR) {
        return [
            pb.get(pR),
            pb.get(pR+96),
            pb.get(pR+96*2)
        ];
    }

    function assertEqualG1(p1, p2) {
        for (let i=0; i<3; i++) {
            assert.equal(p1[i], p2[i]);
        }
    }

    function getPointG2(pR) {
        return [
            [
                pb.get(pR),
                pb.get(pR+96),
                pb.get(pR+96*2)
            ],
            [
                pb.get(pR+96*3),
                pb.get(pR+96*4),
                pb.get(pR+96*5)
            ],
            [
                pb.get(pR+96*6),
                pb.get(pR+96*7),
                pb.get(pR+96*8)
            ],
        ];
    }

    function assertEqualG2(p1, p2) {
        for (let i=0; i<3; i++) {
            for (let j=0; j<3; j++) {
                assert.equal(p1[i][j], p2[i][j]);
            }
        }
    }

    function getFieldElementF6(pR) {
        return [
            [
                pb.get(pR),
                pb.get(pR+96),
                pb.get(pR+96*2)
            ],
            [
                pb.get(pR+96*3),
                pb.get(pR+96*4),
                pb.get(pR+96*5)
            ]
        ];
    }

    function assertEqualF6(p1, p2) {
        for (let i=0; i<2; i++) {
            for (let j=0; j<3; j++) {
                assert.equal(p1[i][j], p2[i][j]);
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
    function printF3(s, p) {
        console.log(s + " Fq3(" + ns(p) + " + " + ns(p+96) +"*u + "+ ns(p+96*2)+ "*u^2 )" );
    }

    //eslint-disable-next-line no-unused-vars
    function printF6(s, p) {
        console.log(s + " [Fq3(\n" + ns(p) + " +\n " + ns(p+96) +"*u +\n"+ ns(p+96*2)+ "*u^2)\n],[" );
        console.log("Fq3(\n" + ns(p+96*3) + " +\n " + ns(p+96*4) +"*u +\n"+ ns(p+96*5)+ "*u^2)\n]" );
    }

    before(async () => {
        pb = await buildProtoboard((module) => {
            buildMNT6753(module);
            buildPedersenHash(module, "g1m", "g1m", "f1m", 188, baseTables);
        }, 96);
    });

    it("It should multiply generator by 0 and return generator in G1", async () => {
        const pR = pb.alloc(96*3);

        const pG1gen = pb.mnt6753.pG1gen;
        const g1gen = getPointG1(pG1gen);

        const pG1zero = pb.mnt6753.pG1zero;

        pb.g1m_add(pG1gen, pG1zero, pR);

        const res = getPointG1(pR);

        assertEqualG1(g1gen, res);
    }).timeout(100000000);

    it("Should work mixed add", async() => {
        const pP1 = pb.alloc(96*3);
        const pP2 = pb.alloc(96*3);
        const pPr = pb.alloc(96*3);

        pb.set(pP1, 2071893303198007985737678972190309212568452221625132024511988170095494148670997278812694070338313361389889122280160253462982652030041813566301365289695187505618174204273471887226695702458395861269694368663558765191107385382142n);
        pb.f1m_toMontgomery(pP1, pP1);
        pb.set(pP1+96, 17187187414417664367585796530257262302159176591062800465884265459977066325098901507827719965058588341044788483232395252403515861767227243983849894797683644816538861625368393588001624014759720661490214325432345769098675755344007n);
        pb.f1m_toMontgomery(pP1+96, pP1+96);
        pb.f1m_one(pP1+96*2, pP1+96*2);
        pb.set(pP2, 12212700530208157134689256057121042620633735483309261868159828729358269133353025097021648766749096328904625282610227267815597560656189994727627613599055093979638719153187781645363642530065802177696707603573183038198049837281284n);
        pb.f1m_toMontgomery(pP2, pP2);
        pb.set(pP2+96, 25783690089010390455572974279288664362239817189553105020262800542618336981545722940934884637537924384027963108482794866752096889610121505188228870561534980224779056104062778099246844511975082198175449341056361726557212816273203n);
        pb.f1m_toMontgomery(pP2+96, pP2+96);
        pb.f1m_one(pP2+96*2, pP2+96*2);

        pb.g1m_zero(pPr);
        pb.g1m_add(pPr, pP1, pPr);
        pb.g1m_addMixed(pPr, pP2, pPr);

        pb.g1m_normalize(pPr, pPr);
        pb.g1m_fromMontgomery(pPr, pPr);

        const resX = pb.get(pPr);
        const resY = pb.get(pPr+96);

        const expectedX = 24530173387584474493637199745573842996932458279480996633536599083023400776896850895927928300031540755827270957795883601164540695965966931068707096855134911813023933604810285308821937900908148310002633109781840767650016069631684n;
        const expectedY = 2176866345050373929048969848689325360044216568746784615606447613684338532909692353308386803545656617464229816849438838053550146942264975470731462382861977242181149443006406892148357437369226748506091130883950310503563066671343n;

        assert.equal(resX, expectedX);
        assert.equal(resY, expectedY);
    });

    it("It should give same result doubling and adding G1", async () => {
        const pR1 = pb.alloc(96*3);
        const pR2 = pb.alloc(96*3);
        const pG1gen = pb.mnt6753.pG1gen;

        pb.g1m_add(pG1gen, pG1gen, pR1);
        pb.g1m_add(pG1gen, pR1, pR1);


        pb.g1m_double(pG1gen, pR2);
        pb.g1m_double(pR2, pR2);
        pb.g1m_sub(pR2, pG1gen, pR2);

        assert(pb.g1m_eq(pR1, pR2));

        pb.g1m_normalize(pR1, pR1);
        pb.g1m_normalize(pR2, pR2);


        const res1 = getPointG1(pR1);
        const res2 = getPointG1(pR2);

        assertEqualG1(res1, res2);
    }).timeout(100000000);

    it("It should do timesScalar many times on G1", async () => {
        const pRes = pb.alloc(96*3);
        const pG1gen = pb.mnt6753.pG1gen;

        const pr = pb.alloc(16);
        pb.i8[pr] = 1;
        for (let i=1; i<16; i++) pb.i8[pr+i] = 0;

        for (let i=0; i<100; i++) {
            const a = pb.i8[pG1gen];
            pb.g1m_timesScalar(pG1gen, pr, 16, pRes);
            const b = pb.i8[pRes];
            assert.equal(a,b);
        }
    });


    it("It should multiply by r and give 0 G1", async () => {
        const pRes = pb.alloc(96*3);
        const pG1gen = pb.mnt6753.pG1gen;
        const pr = pb.mnt6753.pr;

        pb.g1m_timesScalar(pG1gen, pr, 96, pRes);
        assert(pb.g1m_isZero(pRes));

        pb.g1m_normalize(pRes, pRes);
        assert(pb.g1m_isZero(pRes));

        pb.g1m_fromMontgomery(pRes, pRes);

        const res = getPointG1(pRes);
        const zero = [
            0n,
            1n,
            0n,
        ];

        assertEqualG1(res, zero);
    }).timeout(100000000);


    it("It should multiply generator by 0 and return generator in G2", async () => {
        const pR = pb.alloc(96*3*3);

        const pG2gen = pb.mnt6753.pG2gen;
        const g2gen = getPointG2(pG2gen);

        const pG2zero = pb.mnt6753.pG2zero;

        pb.g2m_add(pG2gen, pG2zero, pR);

        const res = getPointG2(pR);

        assertEqualG2(g2gen, res);
    }).timeout(100000000);

    it("It should give same result doubling and adding G2", async () => {
        const pR1 = pb.alloc(96*3*3);
        const pR2 = pb.alloc(96*3*3);
        const pG2gen = pb.mnt6753.pG2gen;

        pb.g2m_add(pG2gen, pG2gen, pR1);
        pb.g2m_add(pG2gen, pR1, pR1);


        pb.g2m_double(pG2gen, pR2);
        pb.g2m_double(pR2, pR2);
        pb.g2m_sub(pR2, pG2gen, pR2);

        assert(pb.g2m_eq(pR1, pR2));

        pb.g2m_normalize(pR1, pR1);
        pb.g2m_normalize(pR2, pR2);


        const res1 = getPointG2(pR1);
        const res2 = getPointG2(pR2);

        assertEqualG2(res1, res2);
    }).timeout(100000000);


    it("It should multiply by r and give 0 G2", async () => {
        const pRes = pb.alloc(96*3*3);
        const pG2gen = pb.mnt6753.pG2gen;
        const pr = pb.mnt6753.pr;

        pb.g2m_timesScalar(pG2gen, pr, 96, pRes);
        assert(pb.g2m_isZero(pRes));

        pb.g2m_normalize(pRes, pRes);
        assert(pb.g2m_isZero(pRes));

        pb.g2m_fromMontgomery(pRes, pRes);

        const res = getPointG2(pRes);

        const zero = [
            [
                0n,
                0n,
                0n
            ],[
                1n,
                0n,
                0n
            ],[
                0n,
                0n,
                0n
            ],

        ];

        assertEqualG2(res, zero);
    }).timeout(100000000);
    it("Any number in F6 exp q^6 must be one ", async () => {
        const pn = pb.alloc(96*6);
        const pRes = pb.alloc(96*6);
        pb.set(pn, 2n);
        pb.set(pn+96, 3n);
        pb.set(pn+96*2, 4n);
        pb.set(pn+96*3, 5n);
        pb.set(pn+96*4, 6n);
        pb.set(pn+96*5, 7n);

        const exponent = 5409913101813341576363045668302291599458449820072868499526646883617423029586906121474798506788006694397671031577673590885022798620119980081126643874219658027503874039737652621994836168194996074405346741380634731804113137339971890770471873780502345021965391948312337347660203419741169410279449363103217103244830569284144093334085560657898661277994635379304955696976953414491055022431664196266647955575965432615404665780255777893985076973855888944208731139202505386378762319321590605849939873187485375187305667007855776339435626305095486649663243586581668683468169959717195650070111410918505575854181604281780532607044930310449658861319085652239297952853947669153282679202751252697684407848512666091987306514680322882338207035546182644930538576992455239959231616923281585155971741932688685804390869550771301466640577047983051076056451313321345622644636580325043696270929623694707265560253830135053569293119620815439617738551355908989238262136847478907738538283187813972516398937488521447584748755535560295354464381815179662311458682195895021010989988285993733522716874872508540340960227668115259892979711104420854227446429055003860810010567845565845213353300978654118081874511471494949937993651767328827761318148720200848744478072387516640966960768732904999820169231510275902088089512040501980267901062204520045230228051874039970202359677797942887369890856960000n;
        const pExponent = pb.alloc( 568 );
        pb.set(pExponent, exponent, 568);

        pb.ftm_exp(pn, pExponent, 568, pRes);
        pb.ftm_fromMontgomery(pRes, pRes);

        const res = getFieldElementF6(pRes);
        const one = [
            [
                1n,
                0n,
                0n
            ],[
                0n,
                0n,
                0n
            ]
        ];
        assertEqualF6(res, one);
    });
    it("Shuld compare with rust", async () => {
        const pP = pb.alloc(96*3);
        const pQ = pb.alloc(96*3*3);
        const pPreP = pb.alloc(96*8);
        const pPreQ = pb.alloc(96*3*5 + 377*4*3*96 + 175*2*3*96);
        const pF = pb.alloc(96*6);
        const pFInv = pb.alloc(96*6);
        const elt = pb.alloc(96*6);
        const w0part = pb.alloc(96*6);
        const w1part = pb.alloc(96*6);
        const pRes1 = pb.alloc(96*6);
        const pRes2 = pb.alloc(96*6);

        pb.set(pP,    0x0001aa18edaaa795fb0fba26b53d821e68d1e5fc23d9bebc0cec60b8b49c58656bb7aab8d5ea28420a30a40558d026180955f296167985f4dfc50ea3953eb7dff0262e7369a76962307bfd64930a7f66781ddd883a0ef093756c6a5283cfd757n);
        pb.set(pP+96, 0x00018f0b3815545dba657c61a5182916f987106ab75f88c015e923ea8c69b201edc0084053b007f8a49212c887ef8fcfb63d08f83718e29a457fe84e59dc89c4c410f9e142fb9084d19e697ec27a912c2cd761782917fcf0d1b99c0c1194147cn);
        pb.set(pP+96*2, 1n);

        pb.set(pQ     , 0x00015769c82d55cae56350dbf305b80bc281862ae62b3a143ca70518021ceb4f75bbffc754bf69df97310b66c42e65d88114bdf59047b048d3a72f49b8a2b8b6313e78706ace5a48d41f79de884b0c84c8baa4833f259b42e013c07cb0a0390en);
        pb.set(pQ+96  , 0x00018f573cec151caebf84817c3b8b05ef4565fb20e76cba27a2d44706f86914f5f02456ea6f386676f69f45b78c0c8a84d49c3bebb754224a926b9f3a06ed5125ce5049f48947729c1a5ad8a1dca07fcf59e03189f4636e1b08e58d63c89bdfn);
        pb.set(pQ+96*2, 0x0000f9a125bf169ac9e42ee761c91c1aca8a260e736102d3fdf8dc9966a342b34568e9a3b3f07aebfacaa3701f0fc5b16d6320bceeb02cb25dfb09a569e69c59af4b16ea9c3f38c5d9cd38f367619139e64126ffedeb0490b4cb6d0ab1f35c4cn);

        pb.set(pQ+96*3, 0x0000e6c308a44d02ef28c13405d24bb33f50bd5b02c220577e34031530823d1b135b6fe6538d9c33d53a03a3a3749b511ddeba6ab6e2cb8cca047e0dddf32878d808f6179e55205f3538e45547cd177ef171968093efc6b5f1941b92c6e03160n);
        pb.set(pQ+96*4, 0x0001b499d1f2ea75134bde72ff86e4a7695169599fe280e191fe986a66bbb2588d33bf42317b77b76cc0ba4123edf84be07e3f958effa7d8550a315619c1867281c8d9174c6e456a37e9dd4362e72f4d964114b5630d337e79e178987ea84272n);
        pb.set(pQ+96*5, 0x00000c76356dec6f36a01211d1b10b67ae86aba8ef1acb0d2e334252c5d1403ffc743e40ab25806eec8305ba3068c75b3cd64efe36f6c381cc6f3f7ca360741a4d25878bdd313445f89aa4f6ae3ac876936358d36fa77b7df9dcd1362d1dbcc3n);

        pb.set(pQ+96*6, 1n);
        pb.set(pQ+96*7, 0n);
        pb.set(pQ+96*8, 0n);

        pb.g1m_toMontgomery(pP, pP);
        pb.g2m_toMontgomery(pQ, pQ);

        pb.mnt6753_prepareG1(pP, pPreP);

        printF1("preP.X", pPreP);
        printF1("preP.Y", pPreP+96);
        printF3("preP.PX_twist", pPreP + 96*2);
        printF3("preP.PY_twist", pPreP + 96*2 + 96*3);

        pb.mnt6753_prepareG2(pQ, pPreQ);

        printF3("preQ.X", pPreQ);
        printF3("preQ.Y", pPreQ+96*3);
        printF3("preQ.Y2", pPreQ+96*3*2);
        printF3("preQ.PX_over_twist", pPreQ + 96*3*3);
        printF3("preQ.PY_over_twist", pPreQ + 96*3*4);

        // let o;
        // o = pPreQ + 96*3*5;
        // for (let i=0; i<376; i++) {
        //     console.log();
        //     console.log("------>"+i)
        //     printF3("h", o);
        //     printF3("4c", o+96*3);
        //     printF3("j", o+96*3*2);
        //     printF3("l", o+96*3*3);
        //     o = o + 96*3*4;
        // }

        // o = pPreQ + 96*3*5 + 96*3*4*376;
        // for (let i=0; i<174; i++) {
        //     console.log();
        //     console.log("========>"+i);
        //     printF3("L1", o);
        //     printF3("RZ", o+96*3);
        //     o = o + 96*3*2;
        // }

        pb.mnt6753_millerLoop(pPreP, pPreQ, pF);
        printF6("Miller Loop Result: ", pF);


        pb.ftm_inverse(pF, pFInv);

        pb.mnt6753__finalExponentiationFirstChunk(pF, pFInv, elt);
        printF6("Final Exponentiation First chunk: ", elt);

        pb.mnt6753__frobeniusMap1(elt, w1part);
        printF6("w1part: ", w1part);

        pb.mnt6753__cyclotomicExp_w0(elt, w0part);
        printF6("w0part: ", w0part);

        pb.ftm_mul(w1part, w0part, pRes1);
        printF6("res1: ", pRes1);

        pb.mnt6753_finalExponentiation(pF, pRes2);
        printF6("Final Exponentiation Result: ", pRes2);

    });

    it("It should do a basic pairing", async () => {
        const ps = pb.alloc(96);
        const pOne = pb.alloc(96*6);
        pb.set(ps, 10n);
        const pRes1 = pb.alloc(96*6);
        const pRes2 = pb.alloc(96*6);

        const pG1s = pb.alloc(96*3);
        const pG2s = pb.alloc(96*3*3);
        const pG1gen = pb.mnt6753.pG1gen;
        const pG2gen = pb.mnt6753.pG2gen;

        pb.ftm_one(pOne);
        pb.g1m_timesScalar(pG1gen, ps, 96, pG1s);
        pb.g2m_timesScalar(pG2gen, ps, 96, pG2s);

        pb.mnt6753_pairing(pG1s, pG2gen, pRes1);

        const start = new Date().getTime();
        pb.mnt6753_pairing(pG1gen, pG2s, pRes2);
        const end = new Date().getTime();
        const time = end - start;
        console.log("Time to compute a single pairing (ms): " + time);

        const res1 = getFieldElementF6(pRes1);
        const res2 = getFieldElementF6(pRes2);


        assertEqualF6(res1, res2);
    });


    it("It should do a 2 pairings ", async () => {
        const ps = pb.alloc(96);
        pb.set(ps, 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFn);
        const pRes1 = pb.alloc(96*6);
        const pRes2 = pb.alloc(96*6);

        const pG1s = pb.alloc(96*3);
        const pG2s = pb.alloc(96*3*3);
        const pG1gen = pb.mnt6753.pG1gen;
        const pG2gen = pb.mnt6753.pG2gen;

        const oldFree = pb.i32[0];
        pb.g1m_timesScalar(pG1gen, ps, 16, pG1s);
        pb.g2m_timesScalar(pG2gen, ps, 16, pG2s);
        pb.g1m_neg(pG1s, pG1s);

        const pPreP1 = pb.alloc(pb.mnt6753.prePSize);
        const pPreQ1 = pb.alloc(pb.mnt6753.preQSize);

        const pPreP2 = pb.alloc(pb.mnt6753.prePSize);
        const pPreQ2 = pb.alloc(pb.mnt6753.preQSize);

        pb.mnt6753_prepareG1(pG1s, pPreP1);
        pb.mnt6753_prepareG2(pG2gen, pPreQ1);

        pb.mnt6753_prepareG1(pG1gen, pPreP2);
        pb.mnt6753_prepareG2(pG2s, pPreQ2);

        pb.mnt6753_millerLoop(pPreP1, pPreQ1, pRes1);
        pb.mnt6753_millerLoop(pPreP2, pPreQ2, pRes2);

        pb.ftm_mul(pRes1, pRes2, pRes1);

        pb.mnt6753_finalExponentiation(pRes1, pRes1);

        const valid = pb.ftm_eq(pRes1, pb.mnt6753.pOneT);

        assert.equal(valid, 1);

        pb[0] = oldFree+16;

        pb.g1m_timesScalar(pG1gen, ps, 16, pG1s);
        pb.g2m_timesScalar(pG2gen, ps, 16, pG2s);
        pb.g1m_neg(pG1s, pG1s);

        const pPreP1b = pb.alloc(pb.mnt6753.prePSize);
        const pPreQ1b = pb.alloc(pb.mnt6753.preQSize);

        const pPreP2b = pb.alloc(pb.mnt6753.prePSize);
        const pPreQ2b = pb.alloc(pb.mnt6753.preQSize);

        pb.mnt6753_prepareG1(pG1s, pPreP1b);
        pb.mnt6753_prepareG2(pG2gen, pPreQ1b);

        pb.mnt6753_prepareG1(pG1gen, pPreP2b);
        pb.mnt6753_prepareG2(pG2s, pPreQ2b);

        pb.mnt6753_millerLoop(pPreP1b, pPreQ1b, pRes1);
        pb.mnt6753_millerLoop(pPreP2b, pPreQ2b, pRes2);

        pb.ftm_mul(pRes1, pRes2, pRes1);

        pb.mnt6753_finalExponentiation(pRes1, pRes1);

        const valid2 = pb.ftm_eq(pRes1, pb.mnt6753.pOneT);

        assert.equal(valid2, 1);
    });

    it("It should do a basic pairing equation", async () => {
        const ps = pb.alloc(96);
        const pns = pb.alloc(96);
        const pOne = pb.alloc(96*6);
        pb.set(ps, 10n);

        const pG1s = pb.alloc(96*3);
        const pG2ns = pb.alloc(96*3*3);
        const pG1gen = pb.mnt6753.pG1gen;
        const pG2gen = pb.mnt6753.pG2gen;
        const pr = pb.mnt6753.pr;

        pb.ftm_one(pOne);
        pb.int_sub(pr, ps, pns);
        pb.g1m_timesScalar(pG1gen, ps, 96, pG1s);
        pb.g2m_timesScalar(pG2gen, pns, 96, pG2ns);

        assert(pb.mnt6753_pairingEq2(pG1s, pG2gen, pG1gen, pG2ns, pOne));
    });

    it("Should calculate pedersen hash of one (3 bits) and give the base", async () => {

        const pData = pb.alloc(4);
        const pRes = pb.alloc(96);
        pb.i8[pData] = 0;

        pb.g1m_pedersenHash(pData, 3, pRes);

        const res= pb.get(pRes);

        const base0x = 2071893303198007985737678972190309212568452221625132024511988170095494148670997278812694070338313361389889122280160253462982652030041813566301365289695187505618174204273471887226695702458395861269694368663558765191107385382142n;

        assert.equal(res, base0x);
    });

    it("Should calculate basic hash neg", async () => {

        const pData = pb.alloc(4);
        const pRes = pb.alloc(96);
        pb.i8[pData] = 4;

        pb.g1m_pedersenHash(pData, 3, pRes);

        const res= pb.get(pRes);

        const base0x = 2071893303198007985737678972190309212568452221625132024511988170095494148670997278812694070338313361389889122280160253462982652030041813566301365289695187505618174204273471887226695702458395861269694368663558765191107385382142n;

        assert.equal(res, base0x);
    });

    it("Should calculate basic hash 6 zeroes", async () => {

        const pData = pb.alloc(4);
        const pRes = pb.alloc(96);
        pb.i8[pData] = 0;

        pb.g1m_pedersenHash(pData, 6, pRes);

        const res= pb.get(pRes);

        const base0x = 20816608607659502394900421840289171271044332788055830558015649776458417776497265324992742676954144893957470585407116684723616570393624000879947832453899136845600289543458619001847482177196784363092535078201457141611283404488316n;

        assert.equal(res, base0x);
    });
    it("Should calculate basic hash 6 ones", async () => {

        const pData = pb.alloc(4);
        const pRes = pb.alloc(96);
        pb.i8[pData] = 0x3F;

        pb.g1m_pedersenHash(pData, 6, pRes);

        const res= pb.get(pRes);

        const base0x = 14282192733065930874238745933636599887192070821881345437206947607544426706132691125830968056944446302303403310796860950413557974690259005017231322986779448272591619810499690629304664029605485941657903722880811421729487884439012n;

        assert.equal(res, base0x);
    });
    it("Should calculate basic hash 96 zeroes", async () => {

        const pData = pb.alloc(12);
        const pRes = pb.alloc(96);

        for (let i=0; i<12; i++) pb.i8[pData + i] = 0;

        pb.g1m_pedersenHash(pData, 96, pRes);

        const res= pb.get(pRes);

        const base0x = 36719536457059259739142328339053949609578779145432149277952547807304308134944476843147491033751819019994481117786479507207338870821973181582541172389797295474856795112305478011716521682509527125400768278558398921477326625201106n;

        assert.equal(res, base0x);
    });
    it("Should calculate basic hash 96 ones", async () => {

        const pData = pb.alloc(12);
        const pRes = pb.alloc(96);

        for (let i=0; i<12; i++) pb.i8[pData + i] = 0xFF;

        pb.g1m_pedersenHash(pData, 96, pRes);

        const res= pb.get(pRes);

        const base0x = 12943506456598104528184760817739887377356424268097314195693694146992183808248128784153635506456915483131432648997105737396642823576192308196708379737985833468850023888388572626724194248724619361724005840346884396875915312555198n;

        assert.equal(res, base0x);
    });

    it("Should calculate pedersen of 188*3 zeroes", async () => {

        const pData = pb.alloc(72);
        const pRes = pb.alloc(96);

        for (let i=0; i<72; i++) pb.i8[pData + i] = 0;

        pb.g1m_pedersenHash(pData, 188*3, pRes);

        const res= pb.get(pRes);

        const expectedRes = 213687556066135465554527365306729621910214427093142125223555116494992196896189723296456183032943253040434546230999412938399210615414794017698737587476557171852158993911723642896562934901917188416738033893180597449276888122873n;

        assert.equal(res, expectedRes);
    });

    it("Should calculate pedersen of 188*3 ones", async () => {

        const pData = pb.alloc(72);
        const pRes = pb.alloc(96);

        for (let i=0; i<72; i++) pb.i8[pData + i] = 0xFF;

        pb.g1m_pedersenHash(pData, 188*3, pRes);

        const res= pb.get(pRes);

        const expectedRes = 38314420180017834578241328562173665856555559674365209859535602734413854896576510828743458107172492693746845495085589760980524135846744930494433471658648942076573254332692696948802539657538178907802150333262709543907104664571945n;

        assert.equal(res, expectedRes);
    });

    it("Should calculate pedersen of 189*3 ones", async () => {

        const pData = pb.alloc(72);
        const pRes = pb.alloc(96);

        for (let i=0; i<72; i++) pb.i8[pData + i] = 0xFF;

        pb.g1m_pedersenHash(pData, 189*3, pRes);

        const res= pb.get(pRes);

        const expectedRes = 4159198707767609002396622339786149774115426008212388364464231952414690466092735882935373860037240729428866036277945757636613756633633638993393812956457240948482434712503176638643719030485994685746478573022952704372150632787750n;

        assert.equal(res, expectedRes);
    });


    it("Should calculate pedersen of 300 zeroes", async () => {
        const pData = pb.alloc(72);
        const pRes = pb.alloc(96);

        for (let i=0; i<72; i++) pb.i8[pData + i] = 0;

        pb.g1m_pedersenHash(pData, 300, pRes);

        const res= pb.get(pRes);

        const expectedRes = 20198414954759289912284023049244105057014593777847888814771980106534358919802376611034797738834305304120679279971888696233964306962602370655166228654114207358695472433344560673207519417856698461338465419185612920333096356473304n;

        assert.equal(res, expectedRes);
    });

    it("Should calculate pedersen of 600 zeroes (2)", async () => {
        const pData = pb.alloc(375);
        const pRes = pb.alloc(96);

        for (let i=0; i<375; i++) pb.i8[pData + i] = 0;

        pb.g1m_pedersenHash(pData, 600, pRes);

        const res= pb.get(pRes);

        const expectedRes = 22122183259719746059827074132354500494631645242927632038238894637065096191866603489072470059095594870027626968595744453906899509446585082376338175542555152274074679905700861385716379552259342223760863379273160023143195689133449n;

        assert.equal(res, expectedRes);
    });


    it("Should calculate pedersen of 3000 zeroes", async () => {

        const pData = pb.alloc(375);
        const pRes = pb.alloc(96);

        for (let i=0; i<375; i++) pb.i8[pData + i] = 0;

        pb.g1m_pedersenHash(pData, 3000, pRes);

        const res= pb.get(pRes);

        const expectedRes = 14749273095161889297103208954552019305445453386372547532933981106663373908756171342378541860135927504554701214562422029587973834118835363908674454111233521769204043831528199063062902303759989250392221541739624602539481323019902n;

        assert.equal(res, expectedRes);
    });

    it("Should calculate pedersen of 3000 ones", async () => {

        const pData = pb.alloc(375);
        const pRes = pb.alloc(96);

        for (let i=0; i<375; i++) pb.i8[pData + i] = 0xFF;

        pb.g1m_pedersenHash(pData, 3000, pRes);

        const res= pb.get(pRes);

        const expectedRes = 32302826505160734739377292480852216856009307903280078024378544999922792933492573455075044485324525543493497393539305677624892588453105615729203573417324057588150012130742766739228995211643930419350969441935528592103909069369408n;

        assert.equal(res, expectedRes);
    });

    it("Should Test Frobenius", async () => {
        const pA = pb.alloc(96*6);
        const pB = pb.alloc(96*6);
        const pAq = pb.alloc(96*6);
        const pAqi = pb.alloc(96*6);
        const pq = pb.mnt6753.pq;
        let res1, res2;
        for (let i=0; i<6; i++) {
            pb.set(pA+96*i, BigInt(i));
        }
        pb.ftm_toMontgomery(pA, pA);
        // printF6("pA", pA);

        pb.mnt6753__frobeniusMap0(pA, pB);
        res1 = getFieldElementF6(pA);
        res2 = getFieldElementF6(pB);
        assertEqualF6(res1, res2);

        pb.ftm_exp(pA, pq, 96,pAq);

        for (let power = 1; power<10; ++power) {
            pb["mnt6753__frobeniusMap"+power](pA, pAqi);
            res1 = getFieldElementF6(pAq);
            res2 = getFieldElementF6(pAqi);

            // printF6("Aq", pAq);
            // printF6("Aqi", pAqi);

            assertEqualF6(res1, res2);

            pb.ftm_exp(pAq, pq, 96,pAq);
        }

    });

});

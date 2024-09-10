const utils = require("../utils");

const buildF1m =require("../build_f1m.js");
const buildF1 =require("../build_f1.js");
const buildF2m =require("../build_f2m.js");
const buildF3m =require("../build_f3m.js");
const buildCurve =require("../build_curve_projective.js");
const { bitLength, isOdd, modInv } = require("../bigint.js");

//
// Curve definition: https://coinlist.co/build/coda/pages/mnt6753
//
module.exports = function buildMNT6753(module, _prefix) {

    const prefix = _prefix || "mnt6753";

    if (module.modules[prefix]) return prefix;  // already builded

    const q = 41898490967918953402344214791240637128170709919953949071783502921025352812571106773058893763790338921418070971888458477323173057491593855069696241854796396165721416325350064441470418137846398469611935719059908164220784476160001n;

    const n64 = Math.floor((bitLength(q - 1n) - 1)/64) +1;
    const n8 = n64*8;
    const f1size = n8;
    const f2size = f1size * 2;
    const f3size = f1size * 3;
    const ftsize = f1size*6;

    const f1mPrefix = buildF1m(module, q, "f1m");
    buildF1(module, q, "f1", "f1m");

    function toMontgomery(a) {
        return BigInt(a) * ( 1n << BigInt(f1size*8)) % q;
    }

    function build_mulNR3() {
        const f = module.addFunction(prefix + "_mulNR3");
        f.addParam("x", "i32");
        f.addParam("pr", "i32");

        const c = f.getCodeBuilder();

        const pNonResidueF3 =  module.alloc(utils.bigInt2BytesLE( toMontgomery(11), 96 ));

        f.addCode(
            c.call(
                f1mPrefix + "_mul",
                c.i32_const(pNonResidueF3),
                c.getLocal("x"),
                c.getLocal("pr")
            )
        );
    }
    build_mulNR3();

    const f2mPrefix = buildF2m(module, prefix + "_mulNR3", "f2m", f1mPrefix);
    const f3mPrefix = buildF3m(module, prefix + "_mulNR3", "f3m", f1mPrefix);

    function build_mulNR6() {
        const f = module.addFunction(prefix + "_mulNR6");
        f.addParam("x", "i32");
        f.addParam("pr", "i32");

        const c = f.getCodeBuilder();

        const pNonResidueF3 =  module.alloc(utils.bigInt2BytesLE( toMontgomery(11), 96 ));

        f.addCode(
            c.call(
                f1mPrefix + "_mul",
                c.i32_const(pNonResidueF3),
                c.i32_add(c.getLocal("x"), c.i32_const(2*n8)),
                c.getLocal("pr")
            ),
            c.call(
                f1mPrefix + "_copy",
                c.getLocal("x"),
                c.i32_add(c.getLocal("pr"), c.i32_const(n8)),
            ),
            c.call(
                f1mPrefix + "_copy",
                c.i32_add(c.getLocal("x"), c.i32_const(n8)),
                c.i32_add(c.getLocal("pr"), c.i32_const(2*n8)),
            )
        );
    }
    build_mulNR6();

    const ftmPrefix = buildF2m(module, prefix + "_mulNR6", "ftm", f3mPrefix);

    function build_mulByA1() {
        const f = module.addFunction(prefix + "_mulByA1");
        f.addParam("x", "i32");
        f.addParam("pr", "i32");

        const c = f.getCodeBuilder();

        const pA =  module.alloc(utils.bigInt2BytesLE( toMontgomery(11), 96 ));

        f.addCode(
            c.call(
                f1mPrefix + "_mul",
                c.i32_const(pA),
                c.getLocal("x"),
                c.getLocal("pr")
            )
        );
    }
    build_mulByA1();
    const g1mPrefix = buildCurve(module, "g1m", f1mPrefix, prefix + "_mulByA1");

    function build_mulByA2() {
        const f = module.addFunction(prefix + "_mulByA2");
        f.addParam("x", "i32");
        f.addParam("pr", "i32");

        const c = f.getCodeBuilder();

        const pA =  module.alloc(utils.bigInt2BytesLE( toMontgomery(11), 96 ));
        const pANR =  module.alloc(utils.bigInt2BytesLE( toMontgomery(11*11), 96 ));

        // [ b*A*nr, c*A*nr, a*A]
        f.addCode(
            c.call(
                f1mPrefix + "_mul",
                c.i32_const(pANR),
                c.i32_add(c.getLocal("x"), c.i32_const(n8)),
                c.getLocal("pr")
            ),
            c.call(
                f1mPrefix + "_mul",
                c.i32_const(pANR),
                c.i32_add(c.getLocal("x"), c.i32_const(2*n8)),
                c.i32_add(c.getLocal("pr"), c.i32_const(n8)),
            ),
            c.call(
                f1mPrefix + "_mul",
                c.i32_const(pA),
                c.getLocal("x"),
                c.i32_add(c.getLocal("pr"), c.i32_const(2*n8)),
            )
        );
    }
    build_mulByA2();
    const g2mPrefix = buildCurve(module, "g2m", f3mPrefix, prefix + "_mulByA2");

    const G1gen = [
        16364236387491689444759057944334173579070747473738339749093487337644739228935268157504218078126401066954815152892688541654726829424326599038522503517302466226143788988217410842672857564665527806044250003808514184274233938437290n,
        4510127914410645922431074687553594593336087066778984214797709122300210966076979927285161950203037801392624582544098750667549188549761032654706830225743998064330900301346566408501390638273322467173741629353517809979540986561128n,
        1n
    ];

    const pG1gen = module.alloc(
        [
            ...utils.bigInt2BytesLE( toMontgomery(G1gen[0]), 96 ),
            ...utils.bigInt2BytesLE( toMontgomery(G1gen[1]), 96 ),
            ...utils.bigInt2BytesLE( toMontgomery(G1gen[2]), 96 )
        ]
    );

    const G1zero = [
        0n,
        1n,
        0n
    ];

    const pG1zero = module.alloc(
        [
            ...utils.bigInt2BytesLE( toMontgomery(G1zero[0]), 96 ),
            ...utils.bigInt2BytesLE( toMontgomery(G1zero[1]), 96 ),
            ...utils.bigInt2BytesLE( toMontgomery(G1zero[2]), 96 )
        ]
    );

    const G2gen = [
        [
            46538297238006280434045879335349383221210789488441126073640895239023832290080310125413049878152095926176013036314720850781686614265244307536450228450615346834324267478485994670716807428718518299710702671895190475661871557310n,
            10329739935427016564561842963551883445915701424214177782911128765230271790215029185795830999583638744119368571742929964793955375930677178544873424392910884024986348059137449389533744851691082159233065444766899262771358355816328n,
            19962817058174334691864015232062671736353756221485896034072814261894530786568591431279230352444205682361463997175937973249929732063490256813101714586199642571344378012210374327764059557816647980334733538226843692316285591005879n
        ],[
            5648166377754359996653513138027891970842739892107427747585228022871109585680076240624013411622970109911154113378703562803827053335040877618934773712021441101121297691389632155906182656254145368668854360318258860716497525179898n,
            26817850356025045630477313828875808893994935265863280918207940412617168254772789578700316551065949899971937475487458539503514034928974530432009759562975983077355912050606509147904958229398389093697494174311832813615564256810453n,
            32332319709358578441696731586704495581796858962594701633932927358040566210788542624963749336109940335257143899293177116050031684054348958813290781394131284657165540476824211295508498842102093219808642563477603392470909217611033n
        ],[
            1n,
            0n,
            0n
        ]
    ];

    const pG2gen = module.alloc(
        [
            ...utils.bigInt2BytesLE( toMontgomery(G2gen[0][0]), 96 ),
            ...utils.bigInt2BytesLE( toMontgomery(G2gen[0][1]), 96 ),
            ...utils.bigInt2BytesLE( toMontgomery(G2gen[0][2]), 96 ),
            ...utils.bigInt2BytesLE( toMontgomery(G2gen[1][0]), 96 ),
            ...utils.bigInt2BytesLE( toMontgomery(G2gen[1][1]), 96 ),
            ...utils.bigInt2BytesLE( toMontgomery(G2gen[1][2]), 96 ),
            ...utils.bigInt2BytesLE( toMontgomery(G2gen[2][0]), 96 ),
            ...utils.bigInt2BytesLE( toMontgomery(G2gen[2][1]), 96 ),
            ...utils.bigInt2BytesLE( toMontgomery(G2gen[2][2]), 96 ),
        ]
    );

    const G2zero = [
        [
            0n,
            0n,
            0n,
        ],[
            1n,
            0n,
            0n
        ],[
            0n,
            0n,
            0n
        ]
    ];

    const pG2zero = module.alloc(
        [
            ...utils.bigInt2BytesLE( toMontgomery(G2zero[0][0]), 96 ),
            ...utils.bigInt2BytesLE( toMontgomery(G2zero[0][1]), 96 ),
            ...utils.bigInt2BytesLE( toMontgomery(G2zero[0][2]), 96 ),
            ...utils.bigInt2BytesLE( toMontgomery(G2zero[1][0]), 96 ),
            ...utils.bigInt2BytesLE( toMontgomery(G2zero[1][1]), 96 ),
            ...utils.bigInt2BytesLE( toMontgomery(G2zero[1][2]), 96 ),
            ...utils.bigInt2BytesLE( toMontgomery(G2zero[2][0]), 96 ),
            ...utils.bigInt2BytesLE( toMontgomery(G2zero[2][1]), 96 ),
            ...utils.bigInt2BytesLE( toMontgomery(G2zero[2][2]), 96 ),
        ]
    );

    const r = 41898490967918953402344214791240637128170709919953949071783502921025352812571106773058893763790338921418070971888253786114353726529584385201591605722013126468931404347949840543007986327743462853720628051692141265303114721689601n;
    const pr = module.alloc(utils.bigInt2BytesLE( r, 96 ));

    const pOneT = module.alloc([
        ...utils.bigInt2BytesLE( toMontgomery(1), 96 ),
        ...utils.bigInt2BytesLE( toMontgomery(0), 96 ),
        ...utils.bigInt2BytesLE( toMontgomery(0), 96 ),
        ...utils.bigInt2BytesLE( toMontgomery(0), 96 ),
        ...utils.bigInt2BytesLE( toMontgomery(0), 96 ),
        ...utils.bigInt2BytesLE( toMontgomery(0), 96 )
    ]);

    module.modules[prefix] = {
        n64: n64,
        pG1gen: pG1gen,
        pG1zero: pG1zero,
        pG2gen: pG2gen,
        pG2zero: pG2zero,
        pq: module.modules["f1m"].pq,
        pr: pr,
        pOneT: pOneT
    };


    //////////////
    /// Pairing //
    //////////////

    const ateLoopCount = 204691208819330962009469868104636132783269696790011977400223898462431810102935615891307667367766898917669754470400n;
    const ateLoopBitBytes = bits(ateLoopCount);
    const pAteLoopBitBytes = module.alloc(ateLoopBitBytes);
    const isLoopNegative = false;

    function naf(n) {
        let E = n;
        const res = [];
        while (E > 0n) {
            if (isOdd(E)) {
                const z = 2 - Number(E % 4n);
                res.push( z );
                E = E - BigInt(z);
            } else {
                res.push( 0 );
            }
            E = E >> 1n;
        }
        return res;
    }

    function bits(n) {
        let E = n;
        const res = [];
        while (E > 0n) {
            if (isOdd(E)) {
                res.push( 1 );
            } else {
                res.push( 0 );
            }
            E = E >> 1n;
        }
        return res;
    }


    const prePSize = f1size * 2 + f3size*2;
    module.modules[prefix].prePSize = prePSize;
    function buildPrepareG1() {
        const f = module.addFunction(prefix+ "_prepareG1");
        f.addParam("pP", "i32");
        f.addParam("ppreP", "i32");

        const c = f.getCodeBuilder();

        const PX = c.getLocal("pP");
        const PY = c.i32_add( c.getLocal("pP"), c.i32_const(n8));
        const PZ = c.i32_add( c.getLocal("pP"), c.i32_const(n8*2));

        const cPX = c.i32_add( c.getLocal("ppreP"), c.i32_const(0));
        const cPY = c.i32_add( c.getLocal("ppreP"), c.i32_const(n8));
        const cPZ = c.i32_add( c.getLocal("ppreP"), c.i32_const(n8*2));

        const cPXtwist_0 = c.i32_add( c.getLocal("ppreP"), c.i32_const(n8*2));
        const cPXtwist_1 = c.i32_add( c.getLocal("ppreP"), c.i32_const(n8*3));
        const cPXtwist_2 = c.i32_add( c.getLocal("ppreP"), c.i32_const(n8*4));
        const cPYtwist_0 = c.i32_add( c.getLocal("ppreP"), c.i32_const(n8*5));
        const cPYtwist_1 = c.i32_add( c.getLocal("ppreP"), c.i32_const(n8*6));
        const cPYtwist_2 = c.i32_add( c.getLocal("ppreP"), c.i32_const(n8*7));
        f.addCode(
            c.call(f1mPrefix + "_copy", PX, cPX),
            c.call(f1mPrefix + "_copy", PY, cPY),
            c.call(f1mPrefix + "_copy", PZ, cPZ),
            c.call(g1mPrefix + "_normalize", cPX, cPX),
            c.call(f1mPrefix + "_zero", cPXtwist_0),
            c.call(f1mPrefix + "_copy", cPX, cPXtwist_1),
            c.call(f1mPrefix + "_zero", cPXtwist_2),
            c.call(f1mPrefix + "_zero", cPYtwist_0),
            c.call(f1mPrefix + "_copy", cPY, cPYtwist_1),
            c.call(f1mPrefix + "_zero", cPYtwist_2),
        );

    }

    /*
    struct mnt6753_ate_G2_precomp {
        mnt6753_Fq3 QX;
        mnt6753_Fq3 QY;
        mnt6753_Fq3 QY2;
        mnt6753_Fq3 QX_over_twist;
        mnt6753_Fq3 QY_over_twist;
        std::vector<mnt6753_ate_dbl_coeffs> dbl_coeffs;
        std::vector<mnt6753_ate_add_coeffs> add_coeffs;

        bool operator==(const mnt6753_ate_G2_precomp &other) const;
        friend std::ostream& operator<<(std::ostream &out, const mnt6753_ate_G2_precomp &prec_Q);
        friend std::istream& operator>>(std::istream &in, mnt6753_ate_G2_precomp &prec_Q);
    };
     */

    const ateDblCoefSize = 4 * f3size;
    const ateAddCoefSize = 2 * f3size;
    const ateNDblCoefs = ateLoopBitBytes.length-1;
    const ateNAddCoefs = ateLoopBitBytes.reduce((acc, b) =>  acc + ( b!=0 ? 1 : 0)   ,0);

    const preQSize = f3size * f3size + ateNDblCoefs*ateDblCoefSize + ateNAddCoefs*ateAddCoefSize;

    module.modules[prefix].preQSize = preQSize;

    function buildPrepareG2() {
        const f = module.addFunction(prefix+ "_prepareG2");
        f.addParam("pQ", "i32");
        f.addParam("ppreQ", "i32");
        f.addLocal("pDbl", "i32");
        f.addLocal("pAdd", "i32");
        f.addLocal("i", "i32");

        const c = f.getCodeBuilder();

        const QX = c.getLocal("pQ");
        const QY = c.i32_add( c.getLocal("pQ"), c.i32_const(f3size));
        const QZ = c.i32_add( c.getLocal("pQ"), c.i32_const(f3size*2));

        const pR = module.alloc(f3size*4);
        const R = c.i32_const(pR);
        const RX = c.i32_const(pR);
        const RY = c.i32_const(pR+f3size);
        const RZ = c.i32_const(pR+2*f3size);
        const RT = c.i32_const(pR+3*f3size);

        const pTwistInv = module.alloc(f3size);

        const cQX = c.i32_add( c.getLocal("ppreQ"), c.i32_const(0));
        const cQY = c.i32_add( c.getLocal("ppreQ"), c.i32_const(f3size));
        const cQZ = c.i32_add( c.getLocal("ppreQ"), c.i32_const(f3size*2));
        const cQY2 = c.i32_add( c.getLocal("ppreQ"), c.i32_const(f3size*2));
        const cQX_over_twist = c.i32_add( c.getLocal("ppreQ"), c.i32_const(f3size*3));
        const cQY_over_twist = c.i32_add( c.getLocal("ppreQ"), c.i32_const(f3size*4));

        f.addCode(
            c.call(f3mPrefix + "_inverse", c.i32_const(pTwist), c.i32_const(pTwistInv)),
            c.call(f3mPrefix + "_copy", QX, cQX),
            c.call(f3mPrefix + "_copy", QY, cQY),
            c.call(f3mPrefix + "_copy", QZ, cQZ),
            c.call(g2mPrefix + "_normalize", cQX, cQX),  // TODO Remove if already in affine
            c.call(f3mPrefix + "_square", cQY, cQY2),
            c.call(f3mPrefix + "_mul", cQX, c.i32_const(pTwistInv), cQX_over_twist),
            c.call(f3mPrefix + "_mul", cQY, c.i32_const(pTwistInv), cQY_over_twist),
            c.call(f3mPrefix + "_copy", cQX, RX),
            c.call(f3mPrefix + "_copy", cQY, RY),
            c.call(f3mPrefix + "_one", RZ),
            c.call(f3mPrefix + "_one", RT),
        );

        f.addCode(
            c.setLocal("pDbl", c.i32_add( c.getLocal("ppreQ"), c.i32_const(f3size*5))),
            c.setLocal("pAdd", c.i32_add( c.getLocal("pDbl"), c.i32_const(ateNDblCoefs*ateDblCoefSize))),
            c.setLocal("i", c.i32_const(ateLoopBitBytes.length-2)),
            c.block(c.loop(

                c.call(prefix + "_prepDblStep", R, c.getLocal("pDbl")),
                c.setLocal("pDbl", c.i32_add(c.getLocal("pDbl"), c.i32_const(ateDblCoefSize))),

                c.if(
                    c.i32_load8_s(c.getLocal("i"), pAteLoopBitBytes),
                    [
                        ...c.call(prefix + "_prepAddStep", cQX, cQY, cQY2, R, c.getLocal("pAdd")),
                        ...c.setLocal("pAdd", c.i32_add(c.getLocal("pAdd"), c.i32_const(ateAddCoefSize))),
                    ]
                ),
                c.br_if(1, c.i32_eqz ( c.getLocal("i") )),
                c.setLocal("i", c.i32_sub(c.getLocal("i"), c.i32_const(1))),
                c.br(0)
            ))
        );

        if (isLoopNegative) {
            const RZ_INV = c.i32_const(module.alloc(f3size));
            const RZ_INV2 = c.i32_const(module.alloc(f3size));
            const RZ_INV3 = c.i32_const(module.alloc(f3size));
            const minus_R_affine_X = c.i32_const(module.alloc(f3size));
            const minus_R_affine_Y = c.i32_const(module.alloc(f3size));
            const minus_R_affine_Y2 = c.i32_const(module.alloc(f3size));
            f.addCode(
                c.call(f3mPrefix + "_inverse", RZ, RZ_INV),
                c.call(f3mPrefix + "_square", RZ_INV, RZ_INV2),
                c.call(f3mPrefix + "_mul", RZ_INV, RZ_INV2, RZ_INV3),
                c.call(f3mPrefix + "_mul", RX, RZ_INV, minus_R_affine_X),
                c.call(f3mPrefix + "_mul", RY, RZ_INV3, minus_R_affine_Y),
                c.call(f3mPrefix + "_square", minus_R_affine_Y, minus_R_affine_Y2),
                c.call(prefix + "_prepAddStep", minus_R_affine_X, minus_R_affine_Y, minus_R_affine_Y2, R, c.getLocal("pAdd")),
                // c.setLocal("pAdd", c.i32_add(c.getLocal("pAdd"), c.i32_const(ateAddCoefSize))),
            );
        }

    }


    function buildPrepAddStep() {
        const f = module.addFunction(prefix+ "_prepAddStep");
        f.addParam("pQX", "i32");
        f.addParam("pQY", "i32");
        f.addParam("pQY2", "i32");
        f.addParam("pR", "i32");
        f.addParam("pAdd", "i32");

        const c = f.getCodeBuilder();

        const QX  = c.getLocal("pQX");
        const QY  = c.getLocal("pQY");
        const QY2  = c.getLocal("pQY2");

        const RX  = c.getLocal("pR");
        const RY  = c.i32_add(c.getLocal("pR"), c.i32_const(f3size));
        const RZ  = c.i32_add(c.getLocal("pR"), c.i32_const(2*f3size));
        const RT  = c.i32_add(c.getLocal("pR"), c.i32_const(3*f3size));

        const AC_L1  = c.getLocal("pAdd");
        const AC_RZ = c.i32_add(c.getLocal("pAdd"), c.i32_const(f3size));

        const B = c.i32_const(module.alloc(f3size));
        const D = c.i32_const(module.alloc(f3size));
        const H = c.i32_const(module.alloc(f3size));
        const I = c.i32_const(module.alloc(f3size));
        const E = c.i32_const(module.alloc(f3size));
        const J = c.i32_const(module.alloc(f3size));
        const V = c.i32_const(module.alloc(f3size));
        const AUX = c.i32_const(module.alloc(f3size));

        f.addCode(

            // B = x2 * T1
            c.call(f3mPrefix + "_mul", QX, RT, B),

            // D = ((y2 + Z1)^2 - y2squared - T1) * T1
            c.call(f3mPrefix + "_add", QY, RZ, D),
            c.call(f3mPrefix + "_square", D, D),
            c.call(f3mPrefix + "_sub", D, QY2, D),
            c.call(f3mPrefix + "_sub", D, RT, D),
            c.call(f3mPrefix + "_mul", D, RT, D),

            // H = B - X1
            c.call(f3mPrefix + "_sub", B, RX, H),

            // I = H^2
            c.call(f3mPrefix + "_square", H, I),

            // E = 4*I
            c.call(f3mPrefix + "_add", I, I, E),
            c.call(f3mPrefix + "_add", E, E, E),

            // J = H * E
            c.call(f3mPrefix + "_mul", H, E, J),

            // V = X1 * E
            c.call(f3mPrefix + "_mul", RX, E, V),

            // L1 = D - 2 * Y1
            c.call(f3mPrefix + "_add", RY, RY, AC_L1),
            c.call(f3mPrefix + "_sub", D, AC_L1, AC_L1),

            // X3 = L1^2 - J - 2*V
            c.call(f3mPrefix + "_square", AC_L1, RX),
            c.call(f3mPrefix + "_add", V, V, AUX),
            c.call(f3mPrefix + "_add", AUX, J, AUX),
            c.call(f3mPrefix + "_sub", RX, AUX, RX),

            // Y3 = L1 * (V-X3) - 2*Y1 * J
            c.call(f3mPrefix + "_add", RY, RY, AUX),
            c.call(f3mPrefix + "_mul", AUX, J, AUX),
            c.call(f3mPrefix + "_sub", V, RX, RY),
            c.call(f3mPrefix + "_mul", AC_L1, RY, RY),
            c.call(f3mPrefix + "_sub", RY, AUX, RY),

            // Z3 = (Z1 + H)^2 - T1 - I
            c.call(f3mPrefix + "_add", RZ, H, RZ),
            c.call(f3mPrefix + "_square", RZ, RZ),
            c.call(f3mPrefix + "_add", RT, I, AUX),
            c.call(f3mPrefix + "_sub", RZ, AUX, RZ),

            // T3 = Z3^2
            c.call(f3mPrefix + "_square", RZ, RT),

            c.call(f3mPrefix + "_copy", RZ, AC_RZ),
        );
    }


    const TwistCoefA = [
        0n,
        0n,
        11n
    ];

    const pTwistCoefA = module.alloc(
        [
            ...utils.bigInt2BytesLE( toMontgomery(TwistCoefA[0]), 96 ),
            ...utils.bigInt2BytesLE( toMontgomery(TwistCoefA[1]), 96 ),
            ...utils.bigInt2BytesLE( toMontgomery(TwistCoefA[2]), 96 ),
        ]
    );

    const Twist = [
        0n,
        1n,
        0n
    ];
    const pTwist = module.alloc(
        [
            ...utils.bigInt2BytesLE( toMontgomery(Twist[0]), 96 ),
            ...utils.bigInt2BytesLE( toMontgomery(Twist[1]), 96 ),
            ...utils.bigInt2BytesLE( toMontgomery(Twist[2]), 96 ),
        ]
    );

    function buildPrepDblStep() {
        const f = module.addFunction(prefix+ "_prepDblStep");
        f.addParam("pR", "i32");
        f.addParam("pDbl", "i32");

        const c = f.getCodeBuilder();

        const DC_H  = c.getLocal("pDbl");
        const DC_4C = c.i32_add(c.getLocal("pDbl"), c.i32_const(f3size));
        const DC_J  = c.i32_add(c.getLocal("pDbl"), c.i32_const(2*f3size));
        const DC_L  = c.i32_add(c.getLocal("pDbl"), c.i32_const(3*f3size));

        const RX  = c.getLocal("pR");
        const RY  = c.i32_add(c.getLocal("pR"), c.i32_const(f3size));
        const RZ  = c.i32_add(c.getLocal("pR"), c.i32_const(2*f3size));
        const RT  = c.i32_add(c.getLocal("pR"), c.i32_const(3*f3size));

        const A = c.i32_const(module.alloc(f3size));
        const B = c.i32_const(module.alloc(f3size));
        const C = c.i32_const(module.alloc(f3size));
        const D = c.i32_const(module.alloc(f3size));
        const E = c.i32_const(module.alloc(f3size));
        const F = c.i32_const(module.alloc(f3size));
        const G = c.i32_const(module.alloc(f3size));
        const AUX = c.i32_const(module.alloc(f3size));
        const X = c.i32_const(module.alloc(f3size));
        const Y = c.i32_const(module.alloc(f3size));
        const T = c.i32_const(module.alloc(f3size));

        f.addCode(
            // Save T, X, Y
            c.call(f3mPrefix + "_copy", RX, X),
            c.call(f3mPrefix + "_copy", RY, Y),
            c.call(f3mPrefix + "_copy", RT, T),

            // A = T1^2
            c.call(f3mPrefix + "_square", RT, A),

            // B = X1^2
            c.call(f3mPrefix + "_square", RX, B),

            // C = Y1^2
            c.call(f3mPrefix + "_square", RY, C),

            // D = C^2
            c.call(f3mPrefix + "_square", C, D),

            // E = (X1+C)^2-B-D
            c.call(f3mPrefix + "_add", X, C, E),
            c.call(f3mPrefix + "_square", E, E),
            c.call(f3mPrefix + "_sub", E, B, E),
            c.call(f3mPrefix + "_sub", E, D, E),

            // F = 3*B +  a  *A
            c.call(f3mPrefix + "_mul", c.i32_const(pTwistCoefA), A, F),
            c.call(f3mPrefix + "_add", B, F, F),
            c.call(f3mPrefix + "_add", B, F, F),
            c.call(f3mPrefix + "_add", B, F, F),

            // G = F^2
            c.call(f3mPrefix + "_square", F, G),

            // X3 = -4*E+G
            c.call(f3mPrefix + "_add", E, E, RX),
            c.call(f3mPrefix + "_add", RX, RX, RX),
            c.call(f3mPrefix + "_sub", G, RX, RX),

            // Y3 = -8*D + F*(2*E-X3)
            c.call(f3mPrefix + "_add", E, E, RY),
            c.call(f3mPrefix + "_sub", RY, RX, RY),
            c.call(f3mPrefix + "_mul", RY, F, RY),
            c.call(f3mPrefix + "_add", D, D, AUX),
            c.call(f3mPrefix + "_add", AUX, AUX, AUX),
            c.call(f3mPrefix + "_add", AUX, AUX, AUX),
            c.call(f3mPrefix + "_sub", RY, AUX, RY),

            // Z3 = (Y1+Z1)^2-C-Z1^2
            c.call(f3mPrefix + "_add", Y , RZ, AUX),
            c.call(f3mPrefix + "_square", AUX, AUX),
            c.call(f3mPrefix + "_square", RZ, RZ),
            c.call(f3mPrefix + "_add", RZ, C, RZ),
            c.call(f3mPrefix + "_sub", AUX, RZ, RZ),

            // T3 = Z3^2
            c.call(f3mPrefix + "_square", RZ, RT),

            // H = (Z3+T1)^2-T3-A
            c.call(f3mPrefix + "_add", RZ, T, DC_H),
            c.call(f3mPrefix + "_square", DC_H, DC_H),
            c.call(f3mPrefix + "_sub", DC_H, RT, DC_H),
            c.call(f3mPrefix + "_sub", DC_H, A, DC_H),

            // fourC = 4*C
            c.call(f3mPrefix + "_add", C, C, DC_4C),
            c.call(f3mPrefix + "_add", DC_4C, DC_4C, DC_4C),

            // J = (F+T1)^2-G-A
            c.call(f3mPrefix + "_add", F, T, DC_J),
            c.call(f3mPrefix + "_square", DC_J, DC_J),
            c.call(f3mPrefix + "_sub", DC_J, G, DC_J),
            c.call(f3mPrefix + "_sub", DC_J, A, DC_J),

            // L = (F+X1)^2-G-B
            c.call(f3mPrefix + "_add", F, X, DC_L),
            c.call(f3mPrefix + "_square", DC_L, DC_L),
            c.call(f3mPrefix + "_sub", DC_L, G, DC_L),
            c.call(f3mPrefix + "_sub", DC_L, B, DC_L),
        );
    }

    function buildMillerLoop() {
        const f = module.addFunction(prefix+ "_millerLoop");
        f.addParam("ppreP", "i32");
        f.addParam("ppreQ", "i32");
        f.addParam("r", "i32");
        f.addLocal("pDbl", "i32");
        f.addLocal("pAdd", "i32");
        f.addLocal("i", "i32");

        const c = f.getCodeBuilder();

        const preP_PX = c.getLocal("ppreP");
        const preP_PX_twist = c.i32_add(c.getLocal("ppreP"), c.i32_const(f1size*2));
        const preP_PY_twist = c.i32_add(c.getLocal("ppreP"), c.i32_const(f1size*2 + f3size));

        const preQ_QX_twist = c.i32_add( c.getLocal("ppreQ"), c.i32_const(f3size*3));
        const preQ_QY_twist = c.i32_add( c.getLocal("ppreQ"), c.i32_const(f3size*4));

        const pL1Coef = module.alloc(f3size);
        const L1Coef = c.i32_const(pL1Coef);
        const L1Coef_0 = c.i32_const(pL1Coef);
        const L1Coef_1 = c.i32_const(pL1Coef+f1size);
        const L1Coef_2 = c.i32_const(pL1Coef+2*f1size);

        const pEV_at_P = module.alloc(ftsize);
        const EV_at_P = c.i32_const(pEV_at_P);
        const EV_at_P_0 = c.i32_const(pEV_at_P);
        const EV_at_P_1 = c.i32_const(pEV_at_P+f3size);

        const DC_H  = c.getLocal("pDbl");
        const DC_4C = c.i32_add(c.getLocal("pDbl"), c.i32_const(f3size));
        const DC_J  = c.i32_add(c.getLocal("pDbl"), c.i32_const(2*f3size));
        const DC_L  = c.i32_add(c.getLocal("pDbl"), c.i32_const(3*f3size));

        const AC_L1  = c.getLocal("pAdd");
        const AC_RZ = c.i32_add(c.getLocal("pAdd"), c.i32_const(f3size));

        const F = c.getLocal("r");

        const pAUX = module.alloc(f3size);
        const AUX = c.i32_const(pAUX);

        f.addCode(
            c.call(f1mPrefix + "_copy", preP_PX, L1Coef_0),
            c.call(f1mPrefix + "_zero", L1Coef_1),
            c.call(f1mPrefix + "_zero", L1Coef_2),

            c.call(f3mPrefix + "_sub", L1Coef, preQ_QX_twist, L1Coef),

            c.call(ftmPrefix + "_one", F),

            c.setLocal("pDbl", c.i32_add( c.getLocal("ppreQ"), c.i32_const(f3size*5))),
            c.setLocal("pAdd", c.i32_add( c.getLocal("pDbl"), c.i32_const(ateNDblCoefs*ateDblCoefSize))),

            c.setLocal("i", c.i32_const(ateLoopBitBytes.length-2)),
            c.block(c.loop(

                c.call(f3mPrefix + "_mul", DC_J, preP_PX_twist, EV_at_P_0),
                c.call(f3mPrefix + "_sub", DC_L, EV_at_P_0, EV_at_P_0),
                c.call(f3mPrefix + "_sub", EV_at_P_0, DC_4C, EV_at_P_0),

                c.call(f3mPrefix + "_mul", DC_H, preP_PY_twist, EV_at_P_1),

                c.call(ftmPrefix + "_square", F, F),
                c.call(ftmPrefix + "_mul", F, EV_at_P, F),

                c.setLocal("pDbl", c.i32_add(c.getLocal("pDbl"), c.i32_const(ateDblCoefSize))),

                c.if(
                    c.i32_load8_s(c.getLocal("i"), pAteLoopBitBytes),
                    [
                        ...c.call(f3mPrefix + "_mul", AC_RZ, preP_PY_twist, EV_at_P_0),

                        ...c.call(f3mPrefix + "_mul", AC_RZ, preQ_QY_twist, EV_at_P_1),
                        ...c.call(f3mPrefix + "_mul", L1Coef, AC_L1, AUX),
                        ...c.call(f3mPrefix + "_add", EV_at_P_1, AUX, EV_at_P_1),
                        ...c.call(f3mPrefix + "_neg", EV_at_P_1, EV_at_P_1),

                        ...c.call(ftmPrefix + "_mul", F, EV_at_P, F),

                        ...c.setLocal("pAdd", c.i32_add(c.getLocal("pAdd"), c.i32_const(ateAddCoefSize))),
                    ]
                ),
                c.br_if(1, c.i32_eqz ( c.getLocal("i") )),
                c.setLocal("i", c.i32_sub(c.getLocal("i"), c.i32_const(1))),
                c.br(0)
            ))

        );

        if (isLoopNegative) {
            f.addCode(
                c.call(f3mPrefix + "_mul", AC_RZ, preP_PY_twist, EV_at_P_0),

                c.call(f3mPrefix + "_mul", AC_RZ, preQ_QY_twist, EV_at_P_1),
                c.call(f3mPrefix + "_mul", L1Coef, AC_L1, AUX),
                c.call(f3mPrefix + "_add", EV_at_P_1, AUX, EV_at_P_1),
                c.call(f3mPrefix + "_neg", EV_at_P_1, EV_at_P_1),

                c.call(ftmPrefix + "_mul", F, EV_at_P, F),

                /// Next line not needed because it's going to be the last one.
                // c.setLocal("pAdd", c.i32_add(c.getLocal("pAdd"), c.i32_const(ateAddCoefSize))),
            );
        }

    }

    function buildComputeLineFunctions() {
        const f = module.addFunction(prefix+ "_computeLineFunctions");
        f.addParam("ppreP", "i32");
        f.addParam("ppreQ", "i32");
        f.addParam("r", "i32");
        f.addLocal("pDbl", "i32");
        f.addLocal("pAdd", "i32");
        f.addLocal("i", "i32");

        const c = f.getCodeBuilder();

        const preP_PX = c.getLocal("ppreP");
        const preP_PX_twist = c.i32_add(c.getLocal("ppreP"), c.i32_const(f1size*2));
        const preP_PY_twist = c.i32_add(c.getLocal("ppreP"), c.i32_const(f1size*2 + f3size));

        const preQ_QX_twist = c.i32_add( c.getLocal("ppreQ"), c.i32_const(f3size*3));
        const preQ_QY_twist = c.i32_add( c.getLocal("ppreQ"), c.i32_const(f3size*4));

        const pL1Coef = module.alloc(f3size);
        const L1Coef = c.i32_const(pL1Coef);
        const L1Coef_0 = c.i32_const(pL1Coef);
        const L1Coef_1 = c.i32_const(pL1Coef+f1size);
        const L1Coef_2 = c.i32_const(pL1Coef+2*f1size);

        const pEV_at_P = module.alloc(ftsize);
        const EV_at_P = c.i32_const(pEV_at_P);
        const EV_at_P_0 = c.i32_const(pEV_at_P);
        const EV_at_P_1 = c.i32_const(pEV_at_P+f3size);

        const DC_H  = c.getLocal("pDbl");
        const DC_4C = c.i32_add(c.getLocal("pDbl"), c.i32_const(f3size));
        const DC_J  = c.i32_add(c.getLocal("pDbl"), c.i32_const(2*f3size));
        const DC_L  = c.i32_add(c.getLocal("pDbl"), c.i32_const(3*f3size));

        const AC_L1  = c.getLocal("pAdd");
        const AC_RZ = c.i32_add(c.getLocal("pAdd"), c.i32_const(f3size));

        const pRes = c.getLocal("r");

        const pAUX = module.alloc(f3size);
        const AUX = c.i32_const(pAUX);

        function getPResOffset() {
            return c.i32_add( pRes, c.i32_mul( c.getLocal("i"), c.i32_const(ftsize)));
        }

        f.addCode(
            c.call(f1mPrefix + "_copy", preP_PX, L1Coef_0),
            c.call(f1mPrefix + "_zero", L1Coef_1),
            c.call(f1mPrefix + "_zero", L1Coef_2),

            c.call(f3mPrefix + "_sub", L1Coef, preQ_QX_twist, L1Coef),

            c.setLocal("pDbl", c.i32_add( c.getLocal("ppreQ"), c.i32_const(f3size*5))),
            c.setLocal("pAdd", c.i32_add( c.getLocal("pDbl"), c.i32_const(ateNDblCoefs*ateDblCoefSize))),

            c.setLocal("i", c.i32_const(ateLoopBitBytes.length-2)),
            c.block(c.loop(

                c.call(f3mPrefix + "_mul", DC_J, preP_PX_twist, EV_at_P_0),
                c.call(f3mPrefix + "_sub", DC_L, EV_at_P_0, EV_at_P_0),
                c.call(f3mPrefix + "_sub", EV_at_P_0, DC_4C, EV_at_P_0),

                c.call(f3mPrefix + "_mul", DC_H, preP_PY_twist, EV_at_P_1),

                c.call(ftmPrefix + "_mul", getPResOffset(), EV_at_P, getPResOffset()),

                c.setLocal("pDbl", c.i32_add(c.getLocal("pDbl"), c.i32_const(ateDblCoefSize))),

                c.if(
                    c.i32_load8_s(c.getLocal("i"), pAteLoopBitBytes),
                    [
                        ...c.call(f3mPrefix + "_mul", AC_RZ, preP_PY_twist, EV_at_P_0),

                        ...c.call(f3mPrefix + "_mul", AC_RZ, preQ_QY_twist, EV_at_P_1),
                        ...c.call(f3mPrefix + "_mul", L1Coef, AC_L1, AUX),
                        ...c.call(f3mPrefix + "_add", EV_at_P_1, AUX, EV_at_P_1),
                        ...c.call(f3mPrefix + "_neg", EV_at_P_1, EV_at_P_1),

                        ...c.call(ftmPrefix + "_mul", getPResOffset(), EV_at_P, getPResOffset()),

                        ...c.setLocal("pAdd", c.i32_add(c.getLocal("pAdd"), c.i32_const(ateAddCoefSize))),
                    ]
                ),
                c.br_if(1, c.i32_eqz ( c.getLocal("i") )),
                c.setLocal("i", c.i32_sub(c.getLocal("i"), c.i32_const(1))),
                c.br(0)
            ))

        );

        if (isLoopNegative) {
            f.addCode(
                c.setLocal("i", c.i32_const(ateLoopBitBytes.length-1)),
                c.call(f3mPrefix + "_mul", AC_RZ, preP_PY_twist, EV_at_P_0),

                c.call(f3mPrefix + "_mul", AC_RZ, preQ_QY_twist, EV_at_P_1),
                c.call(f3mPrefix + "_mul", L1Coef, AC_L1, AUX),
                c.call(f3mPrefix + "_add", EV_at_P_1, AUX, EV_at_P_1),
                c.call(f3mPrefix + "_neg", EV_at_P_1, EV_at_P_1),

                c.call(ftmPrefix + "_mul", getPResOffset(), EV_at_P, getPResOffset()),

                /// Next line not needed because it's going to be the last one.
                // c.setLocal("pAdd", c.i32_add(c.getLocal("pAdd"), c.i32_const(ateAddCoefSize))),
            );
        }

    }

    function buildFusedMillerLoop() {
        const f = module.addFunction(prefix+ "_fusedMillerLoop");
        f.addParam("l", "i32");
        f.addParam("r", "i32");
        f.addLocal("i", "i32");

        const c = f.getCodeBuilder();

        const l = c.getLocal("l");
        const F = c.getLocal("r");

        function getLineFunctionOffset() {
            return c.i32_add( l, c.i32_mul( c.getLocal("i"), c.i32_const(ftsize)));
        }

        f.addCode(
            c.call(ftmPrefix + "_one", F),

            c.setLocal("i", c.i32_const(ateLoopBitBytes.length-2)),
            c.block(c.loop(

                c.call(ftmPrefix + "_square", F, F),
                c.call(ftmPrefix + "_mul", F, getLineFunctionOffset(), F),

                c.br_if(1, c.i32_eqz ( c.getLocal("i") )),
                c.setLocal("i", c.i32_sub(c.getLocal("i"), c.i32_const(1))),
                c.br(0)
            ))

        );

        if (isLoopNegative) {
            f.addCode(
                c.setLocal("i", c.i32_const(ateLoopBitBytes.length-1)),
                c.call(ftmPrefix + "_mul", F, getLineFunctionOffset(), F),

                /// Next line not needed because it's going to be the last one.
                // c.setLocal("pAdd", c.i32_add(c.getLocal("pAdd"), c.i32_const(ateAddCoefSize))),
            );
        }

    }

    function buildCombineLineFunctions() {
        const f = module.addFunction(prefix+ "_combineLineFunctions");
        f.addParam("l", "i32");
        f.addParam("r", "i32");
        f.addParam("res", "i32");
        f.addLocal("i", "i32");

        const c = f.getCodeBuilder();

        const l = c.getLocal("l");
        const r = c.getLocal("r");
        const pRes = c.getLocal("res");

        function getLLineFunctionOffset() {
            return c.i32_add( l, c.i32_mul( c.getLocal("i"), c.i32_const(ftsize)));
        }

        function getRLineFunctionOffset() {
            return c.i32_add( r, c.i32_mul( c.getLocal("i"), c.i32_const(ftsize)));
        }

        function getPResLineFunctionOffset() {
            return c.i32_add( pRes, c.i32_mul( c.getLocal("i"), c.i32_const(ftsize)));
        }

        f.addCode(
            c.setLocal("i", c.i32_const(ateLoopBitBytes.length-2)),
            c.block(c.loop(

                c.call(ftmPrefix + "_mul", getLLineFunctionOffset(), getRLineFunctionOffset(), getPResLineFunctionOffset()),

                c.br_if(1, c.i32_eqz ( c.getLocal("i") )),
                c.setLocal("i", c.i32_sub(c.getLocal("i"), c.i32_const(1))),
                c.br(0)
            ))

        );

        if (isLoopNegative) {
            f.addCode(
                c.setLocal("i", c.i32_const(ateLoopBitBytes.length-1)),
                c.call(ftmPrefix + "_mul", getLLineFunctionOffset(), getRLineFunctionOffset(), getPResLineFunctionOffset()),

                /// Next line not needed because it's going to be the last one.
                // c.setLocal("pAdd", c.i32_add(c.getLocal("pAdd"), c.i32_const(ateAddCoefSize))),
            );
        }

    }


    function buildFrobeniusMap(n) {
        const F6 = [
            [
                1n,
                1n,
                1n,
                1n,
                1n,
                1n,
            ],
            [
                1n,
                24129022407817241407134263419936114379815707076943508280977368156625538709102831814843582780138963119807143081677569721953561801075623741378629346409604471234573396989178424163772589090105392407118197799904755622897541183052133n,
                24129022407817241407134263419936114379815707076943508280977368156625538709102831814843582780138963119807143081677569721953561801075623741378629346409604471234573396989178424163772589090105392407118197799904755622897541183052132n,
                41898490967918953402344214791240637128170709919953949071783502921025352812571106773058893763790338921418070971888458477323173057491593855069696241854796396165721416325350064441470418137846398469611935719059908164220784476160000n,
                17769468560101711995209951371304522748355002843010440790806134764399814103468274958215310983651375801610927890210888755369611256415970113691066895445191924931148019336171640277697829047741006062493737919155152541323243293107868n,
                17769468560101711995209951371304522748355002843010440790806134764399814103468274958215310983651375801610927890210888755369611256415970113691066895445191924931148019336171640277697829047741006062493737919155152541323243293107869n,
            ]
        ];

        const F3 = [
            [
                1n,
                1n,
                1n,
            ],
            [
                1n,
                24129022407817241407134263419936114379815707076943508280977368156625538709102831814843582780138963119807143081677569721953561801075623741378629346409604471234573396989178424163772589090105392407118197799904755622897541183052132n,
                17769468560101711995209951371304522748355002843010440790806134764399814103468274958215310983651375801610927890210888755369611256415970113691066895445191924931148019336171640277697829047741006062493737919155152541323243293107868n,
            ],
            [
                1n,
                17769468560101711995209951371304522748355002843010440790806134764399814103468274958215310983651375801610927890210888755369611256415970113691066895445191924931148019336171640277697829047741006062493737919155152541323243293107868n,
                24129022407817241407134263419936114379815707076943508280977368156625538709102831814843582780138963119807143081677569721953561801075623741378629346409604471234573396989178424163772589090105392407118197799904755622897541183052132n,
            ]
        ];

        const f = module.addFunction(prefix+ "__frobeniusMap"+n);
        f.addParam("x", "i32");
        f.addParam("r", "i32");

        const c = f.getCodeBuilder();

        for (let i=0; i<6; i++) {
            const X = (i==0) ? c.getLocal("x") : c.i32_add(c.getLocal("x"), c.i32_const(i*f1size));
            const R = (i==0) ? c.getLocal("r") : c.i32_add(c.getLocal("r"), c.i32_const(i*f1size));
            const coef = F6[Math.floor(i/3)][n%6] * F3[i%3][n%3];
            if (coef !== 1n) {
                const pCoef =  module.alloc(
                    utils.bigInt2BytesLE(
                        toMontgomery(coef),
                        96
                    )
                );
                f.addCode(c.call(f1mPrefix + "_mul", X, c.i32_const(pCoef), R));
            } else {
                f.addCode(c.call(f1mPrefix + "_copy", X, R));
            }
        }
    }


    function buildCyclotomicSquare() {
        const f = module.addFunction(prefix+ "__cyclotomicSquare");
        f.addParam("x", "i32");
        f.addParam("r", "i32");

        const c = f.getCodeBuilder();

        const C00 = c.getLocal("x");
        const C01 = c.i32_add(c.getLocal("x"), c.i32_const(f1size));
        const C02 = c.i32_add(c.getLocal("x"), c.i32_const(2*f1size));
        const C10 = c.i32_add(c.getLocal("x"), c.i32_const(3*f1size));
        const C11 = c.i32_add(c.getLocal("x"), c.i32_const(4*f1size));
        const C12 = c.i32_add(c.getLocal("x"), c.i32_const(5*f1size));

        const pA = module.alloc(f1size*2);
        const A = c.i32_const(pA);
        const A0 = c.i32_const(pA);
        const A1 = c.i32_const(pA+f1size);

        const pB = module.alloc(f1size*2);
        const B = c.i32_const(pB);
        const B0 = c.i32_const(pB);
        const B1 = c.i32_const(pB+f1size);

        const pC = module.alloc(f1size*2);
        const C = c.i32_const(pC);
        const C0 = c.i32_const(pC);
        const C1 = c.i32_const(pC+f1size);

        const pASQ = module.alloc(f2size);
        const ASQ = c.i32_const(pASQ);
        const ASQ0 = c.i32_const(pASQ);
        const ASQ1 = c.i32_const(pASQ+f1size);

        const pBSQ = module.alloc(f2size);
        const BSQ = c.i32_const(pBSQ);
        const BSQ0 = c.i32_const(pBSQ);
        const BSQ1 = c.i32_const(pBSQ+f1size);

        const pCSQ = module.alloc(f2size);
        const CSQ = c.i32_const(pCSQ);
        const CSQ0 = c.i32_const(pCSQ);
        const CSQ1 = c.i32_const(pCSQ+f1size);

        const Aa = c.getLocal("r");
        const Ab = c.i32_add(c.getLocal("r"), c.i32_const(4*f1size));
        const Ba = c.i32_add(c.getLocal("r"), c.i32_const(3*f1size));
        const Bb = c.i32_add(c.getLocal("r"), c.i32_const(2*f1size));
        const Ca = c.i32_add(c.getLocal("r"), c.i32_const(1*f1size));
        const Cb = c.i32_add(c.getLocal("r"), c.i32_const(5*f1size));

        const AUX = c.i32_const(module.alloc(f1size));

        f.addCode(
            c.call(f1mPrefix + "_copy", C00, A0),
            c.call(f1mPrefix + "_copy", C11, A1),
            c.call(f1mPrefix + "_copy", C10, B0),
            c.call(f1mPrefix + "_copy", C02, B1),
            c.call(f1mPrefix + "_copy", C01, C0),
            c.call(f1mPrefix + "_copy", C12, C1),

            c.call(f2mPrefix + "_square", A, ASQ),
            c.call(f2mPrefix + "_square", B, BSQ),
            c.call(f2mPrefix + "_square", C, CSQ),

            // A = vector(3*a^2 - 2*Fp2([vector(a)[0],-vector(a)[1]]))
            // Aa = 3 * ASQ0 - 2 * A0;
            c.call(f1mPrefix + "_sub", ASQ0, A0, Aa),
            c.call(f1mPrefix + "_add", Aa, Aa, Aa),
            c.call(f1mPrefix + "_add", Aa, ASQ0, Aa),
            // Ab = 3 * ASQ1 + 2 * A1;
            c.call(f1mPrefix + "_add", ASQ1, A1, Ab),
            c.call(f1mPrefix + "_add", Ab, Ab, Ab),
            c.call(f1mPrefix + "_add", Ab, ASQ1, Ab),

            // B = vector(3*Fp2([non_residue*c2[1],c2[0]]) + 2*Fp2([vector(b)[0],-vector(b)[1]]))
            // Ba = 3 * non_residue * CSQ1 + 2 * B0;
            c.call(prefix + "_mulNR3", CSQ1, AUX),
            c.call(f1mPrefix + "_add", AUX, B0, Ba),
            c.call(f1mPrefix + "_add", Ba, Ba, Ba),
            c.call(f1mPrefix + "_add", Ba, AUX, Ba),
            // Bb = 3*CSQ0 - 2 * B1;
            c.call(f1mPrefix + "_sub", CSQ0, B1, Bb),
            c.call(f1mPrefix + "_add", Bb, Bb, Bb),
            c.call(f1mPrefix + "_add", Bb, CSQ0, Bb),

            // C = vector(3*b^2 - 2*Fp2([vector(c)[0],-vector(c)[1]]))
            // Ca = 3 * BSQ0 - 2 * C0;
            c.call(f1mPrefix + "_sub", BSQ0, C0, Ca),
            c.call(f1mPrefix + "_add", Ca, Ca, Ca),
            c.call(f1mPrefix + "_add", Ca, BSQ0, Ca),
            // Cb = 3 * BSQ1 + 2 * C1;
            c.call(f1mPrefix + "_add", BSQ1, C1, Cb),
            c.call(f1mPrefix + "_add", Cb, Cb, Cb),
            c.call(f1mPrefix + "_add", Cb, BSQ1, Cb),
        );
    }

    function buildCyclotomicExp(exponent, fnName) {
        const exponentNafBytes = naf(exponent).map( (b) => (b==-1 ? 0xFF: b) );
        const pExponentNafBytes = module.alloc(exponentNafBytes);

        const f = module.addFunction(prefix+ "__cyclotomicExp_"+fnName);
        f.addParam("x", "i32");
        f.addParam("r", "i32");
        f.addLocal("bit", "i32");
        f.addLocal("i", "i32");

        const c = f.getCodeBuilder();

        const x = c.getLocal("x");
        const x00 = c.getLocal("x");
        const x01 = c.i32_add(c.getLocal("x"), c.i32_const(f1size));
        const x02 = c.i32_add(c.getLocal("x"), c.i32_const(2*f1size));
        const x10 = c.i32_add(c.getLocal("x"), c.i32_const(3*f1size));
        const x11 = c.i32_add(c.getLocal("x"), c.i32_const(4*f1size));
        const x12 = c.i32_add(c.getLocal("x"), c.i32_const(5*f1size));

        const res = c.getLocal("r");

        const pInverse = module.alloc(ftsize);
        const inverse = c.i32_const(pInverse);
        const inverse00 = c.i32_const(pInverse);
        const inverse01 = c.i32_const(pInverse+f1size);
        const inverse02 = c.i32_const(pInverse+2*f1size);
        const inverse10 = c.i32_const(pInverse+3*f1size);
        const inverse11 = c.i32_const(pInverse+4*f1size);
        const inverse12 = c.i32_const(pInverse+5*f1size);


        f.addCode(
            c.call(f1mPrefix + "_copy", x00, inverse00),
            c.call(f1mPrefix + "_copy", x01, inverse01),
            c.call(f1mPrefix + "_copy", x02, inverse02),
            c.call(f1mPrefix + "_neg", x10, inverse10),
            c.call(f1mPrefix + "_neg", x11, inverse11),
            c.call(f1mPrefix + "_neg", x12, inverse12),
            c.call(ftmPrefix + "_one", res),

            c.if(
                c.teeLocal("bit", c.i32_load8_s(c.i32_const(exponentNafBytes.length-1), pExponentNafBytes)),
                c.if(
                    c.i32_eq(
                        c.getLocal("bit"),
                        c.i32_const(1)
                    ),
                    c.call(ftmPrefix + "_mul", res, x, res),
                    c.call(ftmPrefix + "_mul", res, inverse, res),
                )
            ),

            c.setLocal("i", c.i32_const(exponentNafBytes.length-2)),
            c.block(c.loop(
                c.call(prefix + "__cyclotomicSquare", res, res),
                c.if(
                    c.teeLocal("bit", c.i32_load8_s(c.getLocal("i"), pExponentNafBytes)),
                    c.if(
                        c.i32_eq(
                            c.getLocal("bit"),
                            c.i32_const(1)
                        ),
                        c.call(ftmPrefix + "_mul", res, x, res),
                        c.call(ftmPrefix + "_mul", res, inverse, res),
                    )
                ),
                c.br_if(1, c.i32_eqz ( c.getLocal("i") )),
                c.setLocal("i", c.i32_sub(c.getLocal("i"), c.i32_const(1))),
                c.br(0)
            ))
        );
    }

    function buildFinalExponentiationLastChunk() {
        const MNT6753_final_exponent_last_chunk_abs_of_w0 = 204691208819330962009469868104636132783269696790011977400223898462431810102935615891307667367766898917669754470400n;

        buildCyclotomicSquare();
        buildCyclotomicExp(MNT6753_final_exponent_last_chunk_abs_of_w0, "w0");
        const f = module.addFunction(prefix+ "__finalExponentiationLastChunk");
        f.addParam("x", "i32");
        f.addParam("r", "i32");

        const c = f.getCodeBuilder();

        const elt = c.getLocal("x");
        const result = c.getLocal("r");
        const w1part = c.i32_const(module.alloc(ftsize));
        const w0part = c.i32_const(module.alloc(ftsize));

        f.addCode(
            c.call(prefix + "__frobeniusMap1", elt, w1part),
            c.call(prefix + "__cyclotomicExp_w0", elt, w0part),
            c.call(ftmPrefix + "_mul", w1part, w0part, result),
        );
    }


    function buildFinalExponentiationFirstChunk() {

        const f = module.addFunction(prefix+ "__finalExponentiationFirstChunk");
        f.addParam("x", "i32");
        f.addParam("xi", "i32");
        f.addParam("r", "i32");

        const c = f.getCodeBuilder();

        const elt = c.getLocal("x");
        const eltInv = c.getLocal("xi");
        const beta = c.getLocal("r");
        const eltQ3 = c.i32_const(module.alloc(ftsize));
        const eltQ3OverElt = c.i32_const(module.alloc(ftsize));
        const alpha = c.i32_const(module.alloc(ftsize));

        f.addCode(
            c.call(prefix + "__frobeniusMap3", elt, eltQ3),
            c.call(ftmPrefix + "_mul", eltQ3, eltInv, eltQ3OverElt),
            c.call(prefix + "__frobeniusMap1", eltQ3OverElt, alpha),
            c.call(ftmPrefix + "_mul", alpha, eltQ3OverElt, beta),
        );
    }

    function buildFinalExponentiation() {
        buildFinalExponentiationFirstChunk();
        buildFinalExponentiationLastChunk();
        const f = module.addFunction(prefix+ "_finalExponentiation");
        f.addParam("x", "i32");
        f.addParam("r", "i32");

        const c = f.getCodeBuilder();

        const elt = c.getLocal("x");
        const result = c.getLocal("r");
        const eltInv = c.i32_const(module.alloc(ftsize));
        const eltToFirstChunk = c.i32_const(module.alloc(ftsize));

        f.addCode(
            c.call(ftmPrefix + "_inverse", elt, eltInv ),
            c.call(prefix + "__finalExponentiationFirstChunk", elt, eltInv, eltToFirstChunk ),
            c.call(prefix + "__finalExponentiationLastChunk", eltToFirstChunk, result )
        );
    }


    function buildFinalExponentiationOld() {
        const f = module.addFunction(prefix+ "_finalExponentiationOld");
        f.addParam("x", "i32");
        f.addParam("r", "i32");

        const exponent = 129119521415595396014710306456032421075529786121916339618043051454538645105373777417137765707049510513015090026587997279208509759539952171373399816556184658054246934445122434683712249758515142075912382855071692226902812699306965286452865875620478620415339135536651578138124630852841411245063114044076427626521354349718502952988285309849333541213630352110932043828698936614474460281448819530109126473106492442797180252857193080048552501189491359213783058841481431978392771722128135286229420891567559544903231970966039315305865230923024300814788334307759652908820805819427293129932717325550045066338621261382334584633469485279042507653112873505613662346162595624798718660978835342384244182483671072189980911818690903244207181753883232560300278713216908336381030175242331281836803196022816489406715804002685525498662502919760346302653911463614694097216541218340832160715975576449518733830908486041613391828183354500089193133793376316346927602330584336604894214847791219714282509301093232896394808735738348953422584365914239193758384912179069975047674736700432948221178135004609440079320720726286913134205559121306917942266019404840960000n;
        const pExponent = module.alloc(utils.bigInt2BytesLE( exponent, 472 ));

        const c = f.getCodeBuilder();

        f.addCode(
            c.call(ftmPrefix + "_exp", c.getLocal("x"), c.i32_const(pExponent), c.i32_const(472), c.getLocal("r")),
        );
    }

    const pPreP = module.alloc(prePSize);
    const pPreQ = module.alloc(preQSize);

    function buildPairingEquation(nPairings) {

        const f = module.addFunction(prefix+ "_pairingEq"+nPairings);
        for (let i=0; i<nPairings; i++) {
            f.addParam("p_"+i, "i32");
            f.addParam("q_"+i, "i32");
        }
        f.addParam("c", "i32");
        f.setReturnType("i32");


        const c = f.getCodeBuilder();

        const resT = c.i32_const(module.alloc(ftsize));
        const auxT = c.i32_const(module.alloc(ftsize));

        f.addCode(c.call(ftmPrefix + "_one", resT ));

        for (let i=0; i<nPairings; i++) {

            f.addCode(c.call(prefix + "_prepareG1", c.getLocal("p_"+i), c.i32_const(pPreP) ));
            f.addCode(c.call(prefix + "_prepareG2", c.getLocal("q_"+i), c.i32_const(pPreQ) ));
            f.addCode(c.call(prefix + "_millerLoop", c.i32_const(pPreP), c.i32_const(pPreQ), auxT ));

            f.addCode(c.call(ftmPrefix + "_mul", resT, auxT, resT ));
        }

        f.addCode(c.call(prefix + "_finalExponentiation", resT, resT ));

        f.addCode(c.call(ftmPrefix + "_eq", resT, c.getLocal("c")));
    }


    function buildPairing() {

        const f = module.addFunction(prefix+ "_pairing");
        f.addParam("p", "i32");
        f.addParam("q", "i32");
        f.addParam("r", "i32");

        const c = f.getCodeBuilder();

        const resT = c.i32_const(module.alloc(ftsize));

        f.addCode(c.call(prefix + "_prepareG1", c.getLocal("p"), c.i32_const(pPreP) ));
        f.addCode(c.call(prefix + "_prepareG2", c.getLocal("q"), c.i32_const(pPreQ) ));
        f.addCode(c.call(prefix + "_millerLoop", c.i32_const(pPreP), c.i32_const(pPreQ), resT ));
        f.addCode(c.call(prefix + "_finalExponentiation", resT, c.getLocal("r") ));
    }

    function buildGroupMap() {

        const f = module.addFunction(prefix+ "_groupMap");
        f.addParam("t", "i32");
        f.addParam("r", "i32");

        const c = f.getCodeBuilder();

        const ResX = c.getLocal("r");
        const ResY = c.i32_add(c.getLocal("r"), c.i32_const(n8));
        const ResZ = c.i32_add(c.getLocal("r"), c.i32_const(n8*2));

        const T = c.getLocal("t");
        const U = c.i32_const(module.modules["f1m"].pOne);

        const _a = 11n;
        const A = c.i32_const(module.alloc(utils.bigInt2BytesLE((_a << BigInt(n64*64)) % q, n8)));
        const _b = 11625908999541321152027340224010374716841167701783584648338908235410859267060079819722747939267925389062611062156601938166010098747920378738927832658133625454260115409075816187555055859490253375704728027944315501122723426879114n;
        const B = c.i32_const(module.alloc(utils.bigInt2BytesLE((_b << BigInt(n64*64)) % q, n8)));
        const _uOver2 = modInv(2n, q);
        const UOver2 = c.i32_const(module.alloc(utils.bigInt2BytesLE((_uOver2 << BigInt(n64*64)) % q, n8)));
        const _conicC = 10474622741979738350586053697810159282042677479988487267945875730256338203142776693264723440947584730354517742972114619330793264372898463767424060463699099041430354081337516110367604534461599617402983929764977041055196119040012n;
        const ConicC = c.i32_const(module.alloc(utils.bigInt2BytesLE((_conicC << BigInt(n64*64)) % q, n8)));
        const _prjZ = 38365735639699746381939366704915555468563774296792699496721397906733830428037078183799997086205833647489050605889539959322880863358082391473031143521765387671570958090617625358358885062894615919620647426481572278916894388596945n;
        const ProjZ = c.i32_const(module.alloc(utils.bigInt2BytesLE((_prjZ << BigInt(n64*64)) % q, n8)));
        const ProjY = U;

        const CT = c.i32_const(module.alloc(f1size));
        const S = c.i32_const(module.alloc(f1size));
        const Z = c.i32_const(module.alloc(f1size));
        const Y = c.i32_const(module.alloc(f1size));
        const V = c.i32_const(module.alloc(f1size));
        const X = c.i32_const(module.alloc(f1size));
        const Y2 = c.i32_const(module.alloc(f1size));
        const AUX1 = c.i32_const(module.alloc(f1size));
        const AUX2 = c.i32_const(module.alloc(f1size));

        f.addCode(
            // ct = ConicC * T
            c.call(f1mPrefix + "_mul", ConicC, T, CT),

            //          CT*ProjY + ProjZ
            // S = 2 * ---------------
            //           CT*t + 1
            c.call(f1mPrefix + "_add", CT, ProjZ, AUX1),
            c.call(f1mPrefix + "_mul", CT, T, AUX2),
            c.call(f1mPrefix + "_add", AUX2, U, AUX2),
            c.call(f1mPrefix + "_inverse", AUX2, AUX2),
            c.call(f1mPrefix + "_mul", AUX1, AUX2, S),
            c.call(f1mPrefix + "_add", S, S, S),

            // Z = ProjZ - S
            c.call(f1mPrefix + "_sub", ProjZ, S, Z),

            // Y = ProjY - S*t
            c.call(f1mPrefix + "_mul", S, T, Y),
            c.call(f1mPrefix + "_sub", ProjY, Y, Y),

            // V = Z/Y - 1/2
            c.call(f1mPrefix + "_inverse", Y, V),
            c.call(f1mPrefix + "_mul", V, Z, V),
            c.call(f1mPrefix + "_sub", V, UOver2, V),

            // Test X = V
            c.call(f1mPrefix + "_copy", V, X),

            // Y2 = X^3 + A*X + B
            c.call(f1mPrefix + "_square", X, Y2),
            c.call(f1mPrefix + "_mul", Y2, X, Y2),
            c.call(f1mPrefix + "_mul", A, X, AUX1),
            c.call(f1mPrefix + "_add", Y2, AUX1, Y2),
            c.call(f1mPrefix + "_add", Y2, B, Y2),

            c.if(
                c.call(f1mPrefix + "_isSquare", Y2),
                [
                    ...c.call(f1mPrefix + "_copy", X, ResX),
                    ...c.call(f1mPrefix + "_sqrt", Y2, ResY),
                    ...c.call(f1mPrefix + "_one", ResZ),
                    ...c.ret([])
                ]
            ),

            // Test X = -U-V
            c.call(f1mPrefix + "_add", U, V, X),
            c.call(f1mPrefix + "_neg", X, X),

            // Y2 = X^3 + A*X + B
            c.call(f1mPrefix + "_square", X, Y2),
            c.call(f1mPrefix + "_mul", Y2, X, Y2),
            c.call(f1mPrefix + "_mul", A, X, AUX1),
            c.call(f1mPrefix + "_add", Y2, AUX1, Y2),
            c.call(f1mPrefix + "_add", Y2, B, Y2),

            c.if(
                c.call(f1mPrefix + "_isSquare", Y2),
                [
                    ...c.call(f1mPrefix + "_copy", X, ResX),
                    ...c.call(f1mPrefix + "_sqrt", Y2, ResY),
                    ...c.call(f1mPrefix + "_one", ResZ),
                    ...c.ret([])
                ]
            ),

            // Test X = 1 + Y^_square2
            c.call(f1mPrefix + "_square", Y, X),
            c.call(f1mPrefix + "_add", U, X, X),

            // Y2 = X^3 + A*X + B
            c.call(f1mPrefix + "_square", X, Y2),
            c.call(f1mPrefix + "_mul", Y2, X, Y2),
            c.call(f1mPrefix + "_mul", A, X, AUX1),
            c.call(f1mPrefix + "_add", Y2, AUX1, Y2),
            c.call(f1mPrefix + "_add", Y2, B, Y2),

            c.if(
                c.call(f1mPrefix + "_isSquare", Y2),
                [
                    ...c.call(f1mPrefix + "_copy", X, ResX),
                    ...c.call(f1mPrefix + "_sqrt", Y2, ResY),
                    ...c.call(f1mPrefix + "_one", ResZ),
                    ...c.ret([])
                ]
            ),
            c.unreachable()
        );

    }


    buildPrepDblStep();
    buildPrepAddStep();

    buildPrepareG1();
    buildPrepareG2();

    for (let i=0; i<10; i++) {
        buildFrobeniusMap(i);
        module.exportFunction(prefix + "__frobeniusMap"+i);
    }

    buildMillerLoop();
    buildComputeLineFunctions();
    buildFusedMillerLoop();
    buildCombineLineFunctions();

    buildFinalExponentiation();
    buildFinalExponentiationOld();

    buildPairingEquation(1);
    buildPairingEquation(2);
    buildPairingEquation(3);

    buildPairing();
    buildGroupMap();

    module.exportFunction(prefix + "_pairingEq1");
    module.exportFunction(prefix + "_pairingEq2");
    module.exportFunction(prefix + "_pairingEq3");

    module.exportFunction(prefix + "_pairing");
    module.exportFunction(prefix + "_groupMap");

    module.exportFunction(prefix + "_prepareG1");
    module.exportFunction(prefix + "_prepareG2");
    module.exportFunction(prefix + "_millerLoop");
    module.exportFunction(prefix + "_computeLineFunctions");
    module.exportFunction(prefix + "_fusedMillerLoop");
    module.exportFunction(prefix + "_combineLineFunctions");
    module.exportFunction(prefix + "_finalExponentiationOld");
    module.exportFunction(prefix + "_finalExponentiation");
    module.exportFunction(prefix + "__finalExponentiationFirstChunk");
    module.exportFunction(prefix + "__cyclotomicExp_w0");
};


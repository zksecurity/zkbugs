/*
    Copyright 2019 0KIMS association.

    This file is part of wasmsnark (Web Assembly zkSnark Prover).

    wasmsnark is a free software: you can redistribute it and/or modify it
    under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    wasmsnark is distributed in the hope that it will be useful, but WITHOUT
    ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
    or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public
    License for more details.

    You should have received a copy of the GNU General Public License
    along with wasmsnark. If not, see <https://www.gnu.org/licenses/>.
*/

const { isOdd, modInv, modPow } = require("./bigint.js");
const utils = require("./utils.js");

module.exports = function buildFFT(module, prefix, gPrefix, fPrefix, opGtimesF) {

    const n64f = module.modules[fPrefix].n64;
    const n8f = n64f*8;

    const n64g = module.modules[gPrefix].n64;
    const n8g = n64g*8;

    const q = module.modules[fPrefix].q;

    let rem = q - 1n;
    let maxBits = 0;
    while (!isOdd(rem)) {
        maxBits ++;
        rem = rem >> 1n;
    }

    let nr = 2n;

    while ( modPow(nr, q >> 1n, q) === 1n ) nr = nr + 1n;

    // console.log(nr);

    const w = new Array(maxBits+1);
    w[maxBits] = modPow(nr, rem, q);

    let n=maxBits-1;
    while (n>=0) {
        w[n] = modPow(w[n+1], 2n, q);
        n--;
    }

    const bytes = [];
    const R = (1n << BigInt(n8f*8)) % q;

    for (let i=0; i<w.length; i++) {
        const m = w[i] * R % q;
        bytes.push(...utils.bigInt2BytesLE(m, n8f));
    }

    const ROOTs = module.alloc(bytes);

    const i2 = new Array(maxBits+1);
    i2[0] = 1n;

    for (let i=1; i<=maxBits; i++) {
        i2[i] = i2[i-1] * 2n;
    }

    const bytesi2 =[];
    for (let i=0; i<=maxBits; i++) {
        const m = modInv(i2[i], q) * R % q;
        bytesi2.push(...utils.bigInt2BytesLE(m, n8f));
    }

    const INV2 = module.alloc(bytesi2);

    const shift = modPow(nr, 2n, q);
    const bytesShiftToSmallM =[];
    const bytesSConst =[];
    for (let i=0; i<=maxBits; i++) {
        const shiftToSmallM = modPow(shift, 2n ** BigInt(i), q);
        const sConst = modInv(q + 1n - shiftToSmallM, q);
        bytesShiftToSmallM.push(...utils.bigInt2BytesLE(shiftToSmallM * R % q, n8f));
        bytesSConst.push(...utils.bigInt2BytesLE(sConst * R % q, n8f));
    }

    const SHIFT_TO_M = module.alloc( bytesShiftToSmallM  );
    const SCONST = module.alloc( bytesSConst  );

    function rev(x) {
        let r=0;
        for (let i=0; i<8; i++) {
            if (x & (1 << i)) {
                r = r | (0x80 >> i);
            }
        }
        return r;
    }

    const rtable = Array(256);
    for (let i=0; i<256; i++) {
        rtable[i] = rev(i);
    }

    const REVTABLE = module.alloc(rtable);


    function buildLog2() {
        const f = module.addFunction(prefix+"__log2");
        f.addParam("n", "i32");
        f.setReturnType("i32");
        f.addLocal("bits", "i32");
        f.addLocal("aux", "i32");

        const c = f.getCodeBuilder();

        f.addCode(
            c.setLocal(
                "aux",
                c.i32_shr_u(
                    c.getLocal("n"),
                    c.i32_const(1)
                )
            )
        );
        f.addCode(c.setLocal("bits", c.i32_const(0)));

        f.addCode(c.block(c.loop(
            c.br_if(
                1,
                c.i32_eqz(c.getLocal("aux"))
            ),

            c.setLocal(
                "aux",
                c.i32_shr_u(
                    c.getLocal("aux"),
                    c.i32_const(1)
                )
            ),

            c.setLocal(
                "bits",
                c.i32_add(
                    c.getLocal("bits"),
                    c.i32_const(1)
                )
            ),

            c.br(0)
        )));

        f.addCode(c.if(
            c.i32_ne(
                c.getLocal("n"),
                c.i32_shl(
                    c.i32_const(1),
                    c.getLocal("bits")
                )
            ),
            c.unreachable()
        ));

        f.addCode(c.if(
            c.i32_gt_u(
                c.getLocal("bits"),
                c.i32_const(maxBits)
            ),
            c.unreachable()
        ));

        f.addCode(c.getLocal("bits"));
    }

    function buildFFT() {
        const f = module.addFunction(prefix+"_fft");
        f.addParam("px", "i32");
        f.addParam("n", "i32");

        f.addLocal("bits", "i32");

        const c = f.getCodeBuilder();

        const One = c.i32_const(module.alloc(n8f));

        f.addCode(
            c.setLocal(
                "bits",
                c.call(
                    prefix + "__log2",
                    c.getLocal("n")
                )
            ),
            c.call(fPrefix + "_one", One),
            c.call(
                prefix+"_rawfft",
                c.getLocal("px"),
                c.getLocal("bits"),
                c.i32_const(0),
                One
            )
        );

    }

    function buildIFFT() {
        const f = module.addFunction(prefix+"_ifft");
        f.addParam("px", "i32");
        f.addParam("n", "i32");
        f.addLocal("bits", "i32");
        f.addLocal("pInv2", "i32");

        const c = f.getCodeBuilder();

        f.addCode(
            c.setLocal(
                "bits",
                c.call(
                    prefix + "__log2",
                    c.getLocal("n")
                )
            ),
            c.setLocal(
                "pInv2",
                c.i32_add(
                    c.i32_const(INV2),
                    c.i32_mul(
                        c.getLocal("bits"),
                        c.i32_const(n8f)
                    )
                )
            ),

            c.call(
                prefix+"_rawfft",
                c.getLocal("px"),
                c.getLocal("bits"),
                c.i32_const(1),
                c.getLocal("pInv2")
            ),
        );
    }

    function buildRawFFT() {
        const f = module.addFunction(prefix+"_rawfft");
        f.addParam("px", "i32");
        f.addParam("bits", "i32"); // 2 power
        f.addParam("reverse", "i32");
        f.addParam("mulFactor", "i32");

        f.addLocal("s", "i32");
        f.addLocal("k", "i32");
        f.addLocal("j", "i32");
        f.addLocal("m", "i32");
        f.addLocal("mdiv2", "i32");
        f.addLocal("n", "i32");
        f.addLocal("pwm", "i32");
        f.addLocal("idx1", "i32");
        f.addLocal("idx2", "i32");

        const c = f.getCodeBuilder();

        const W = c.i32_const(module.alloc(n8f));
        const T = c.i32_const(module.alloc(n8g));
        const U = c.i32_const(module.alloc(n8g));

        f.addCode(
            c.call(prefix + "__reversePermutation", c.getLocal("px"), c.getLocal("bits")),
            c.setLocal("n", c.i32_shl(c.i32_const(1), c.getLocal("bits"))),
            c.setLocal("s", c.i32_const(1)),
            c.block(c.loop(
                c.br_if(
                    1,
                    c.i32_gt_u(
                        c.getLocal("s"),
                        c.getLocal("bits")
                    )
                ),
                c.setLocal("m", c.i32_shl(c.i32_const(1), c.getLocal("s"))),
                c.setLocal("pwm",
                    c.i32_add(
                        c.i32_const(ROOTs),
                        c.i32_mul(
                            c.getLocal("s"),
                            c.i32_const(n8f)
                        )
                    )
                ),
                c.setLocal("k", c.i32_const(0)),
                c.block(c.loop(
                    c.br_if(
                        1,
                        c.i32_ge_u(
                            c.getLocal("k"),
                            c.getLocal("n")
                        )
                    ),

                    c.call(fPrefix + "_one", W),

                    c.setLocal("mdiv2", c.i32_shr_u(c.getLocal("m"), c.i32_const(1)) ),
                    c.setLocal("j", c.i32_const(0)),
                    c.block(c.loop(
                        c.br_if(
                            1,
                            c.i32_ge_u(
                                c.getLocal("j"),
                                c.getLocal("mdiv2")
                            )
                        ),

                        c.setLocal(
                            "idx1",
                            c.i32_add(
                                c.getLocal("px"),
                                c.i32_mul(
                                    c.i32_add(
                                        c.getLocal("k"),
                                        c.getLocal("j")
                                    ),
                                    c.i32_const(n8g)
                                )
                            )
                        ),

                        c.setLocal(
                            "idx2",
                            c.i32_add(
                                c.getLocal("idx1"),
                                c.i32_mul(
                                    c.getLocal("mdiv2"),
                                    c.i32_const(n8g)
                                )
                            )
                        ),

                        c.call(
                            opGtimesF,
                            c.getLocal("idx2"),
                            W,
                            T
                        ),

                        c.call(
                            gPrefix + "_copy",
                            c.getLocal("idx1"),
                            U
                        ),

                        c.call(
                            gPrefix + "_add",
                            U,
                            T,
                            c.getLocal("idx1"),
                        ),

                        c.call(
                            gPrefix + "_sub",
                            U,
                            T,
                            c.getLocal("idx2"),
                        ),

                        c.call(
                            fPrefix + "_mul",
                            W,
                            c.getLocal("pwm"),
                            W,
                        ),

                        c.setLocal("j", c.i32_add(c.getLocal("j"), c.i32_const(1))),
                        c.br(0)
                    )),

                    c.setLocal("k", c.i32_add(c.getLocal("k"), c.getLocal("m"))),
                    c.br(0)
                )),

                c.setLocal("s", c.i32_add(c.getLocal("s"), c.i32_const(1))),
                c.br(0)
            )),
            c.call(
                prefix + "__fftFinal",
                c.getLocal("px"),
                c.getLocal("bits"),
                c.getLocal("reverse"),
                c.getLocal("mulFactor")
            )
        );
    }


    function buildFinalInverse() {
        const f = module.addFunction(prefix+"__fftFinal");
        f.addParam("px", "i32");
        f.addParam("bits", "i32");
        f.addParam("reverse", "i32");
        f.addParam("mulFactor", "i32");
        f.addLocal("n", "i32");
        f.addLocal("ndiv2", "i32");
        f.addLocal("pInv2", "i32");
        f.addLocal("i", "i32");
        f.addLocal("mask", "i32");
        f.addLocal("idx1", "i32");
        f.addLocal("idx2", "i32");

        const c = f.getCodeBuilder();

        const T = c.i32_const(module.alloc(n8g));

        f.addCode(
            c.if(
                c.i32_and(
                    c.i32_eqz(c.getLocal("reverse")),
                    c.call(fPrefix + "_isOne", c.getLocal("mulFactor"))
                ),
                c.ret([])
            ),
            c.setLocal("n", c.i32_shl( c.i32_const(1), c.getLocal("bits"))),

            c.setLocal("mask", c.i32_sub( c.getLocal("n") , c.i32_const(1))),
            c.setLocal("i", c.i32_const(1)),
            c.setLocal(
                "ndiv2",
                c.i32_shr_u(
                    c.getLocal("n"),
                    c.i32_const(1)
                )
            ),
            c.block(c.loop(
                c.br_if(
                    1,
                    c.i32_ge_u(
                        c.getLocal("i"),
                        c.getLocal("ndiv2")
                    )
                ),

                c.setLocal("idx1",
                    c.i32_add(
                        c.getLocal("px"),
                        c.i32_mul(
                            c.getLocal("i"),
                            c.i32_const(n8g)
                        )
                    )
                ),

                c.setLocal("idx2",
                    c.i32_add(
                        c.getLocal("px"),
                        c.i32_mul(
                            c.i32_sub(
                                c.getLocal("n"),
                                c.getLocal("i")
                            ),
                            c.i32_const(n8g)
                        )
                    )
                ),

                c.if(
                    c.getLocal("reverse"),
                    c.if(
                        c.call(fPrefix + "_isOne", c.getLocal("mulFactor")),
                        [
                            ...c.call(gPrefix + "_copy", c.getLocal("idx1"), T),
                            ...c.call(gPrefix + "_copy", c.getLocal("idx2") , c.getLocal("idx1") ),
                            ...c.call(gPrefix + "_copy", T , c.getLocal("idx2")),
                        ],
                        [
                            ...c.call(gPrefix + "_copy", c.getLocal("idx1"), T),
                            ...c.call(opGtimesF , c.getLocal("idx2") , c.getLocal("mulFactor"), c.getLocal("idx1") ),
                            ...c.call(opGtimesF , T , c.getLocal("mulFactor"), c.getLocal("idx2")),
                        ]
                    ),
                    c.if(
                        c.call(fPrefix + "_isOne", c.getLocal("mulFactor")),
                        [
                            // Do nothing (It should not be here)
                        ],
                        [
                            ...c.call(opGtimesF , c.getLocal("idx1") , c.getLocal("mulFactor"), c.getLocal("idx1") ),
                            ...c.call(opGtimesF , c.getLocal("idx2") , c.getLocal("mulFactor"), c.getLocal("idx2")),
                        ]
                    )
                ),
                c.setLocal("i", c.i32_add(c.getLocal("i"), c.i32_const(1))),

                c.br(0)
            )),

            c.if(
                c.call(fPrefix + "_isOne", c.getLocal("mulFactor")),
                [
                    // Do nothing (It should not be here)
                ],
                [
                    ...c.call(opGtimesF, c.getLocal("px") , c.getLocal("mulFactor"), c.getLocal("px")),
                    ...c.setLocal("idx2",
                        c.i32_add(
                            c.getLocal("px"),
                            c.i32_mul(
                                c.getLocal("ndiv2"),
                                c.i32_const(n8g)
                            )
                        )
                    ),
                    ...c.call(opGtimesF, c.getLocal("idx2"),c.getLocal("mulFactor"), c.getLocal("idx2"))
                ]
            )
        );
    }

    function buildReversePermutation() {
        const f = module.addFunction(prefix+"__reversePermutation");
        f.addParam("px", "i32");
        f.addParam("bits", "i32");
        f.addLocal("n", "i32");
        f.addLocal("i", "i32");
        f.addLocal("ri", "i32");
        f.addLocal("idx1", "i32");
        f.addLocal("idx2", "i32");

        const c = f.getCodeBuilder();

        const T = c.i32_const(module.alloc(n8g));

        f.addCode(
            c.setLocal("n", c.i32_shl( c.i32_const(1), c.getLocal("bits"))),
            c.setLocal("i", c.i32_const(0)),
            c.block(c.loop(
                c.br_if(
                    1,
                    c.i32_eq(
                        c.getLocal("i"),
                        c.getLocal("n")
                    )
                ),

                c.setLocal("idx1",
                    c.i32_add(
                        c.getLocal("px"),
                        c.i32_mul(
                            c.getLocal("i"),
                            c.i32_const(n8g)
                        )
                    )
                ),

                c.setLocal("ri", c.call(prefix + "__rev", c.getLocal("i"), c.getLocal("bits"))),

                c.setLocal("idx2",
                    c.i32_add(
                        c.getLocal("px"),
                        c.i32_mul(
                            c.getLocal("ri"),
                            c.i32_const(n8g)
                        )
                    )
                ),

                c.if(
                    c.i32_lt_u(
                        c.getLocal("i"),
                        c.getLocal("ri")
                    ),
                    [
                        ...c.call(gPrefix + "_copy", c.getLocal("idx1"), T),
                        ...c.call(gPrefix + "_copy", c.getLocal("idx2") , c.getLocal("idx1")),
                        ...c.call(gPrefix + "_copy", T , c.getLocal("idx2"))
                    ]
                ),

                c.setLocal("i", c.i32_add(c.getLocal("i"), c.i32_const(1))),

                c.br(0)
            ))
        );
    }

    function buildRev() {
        const f = module.addFunction(prefix+"__rev");
        f.addParam("x", "i32");
        f.addParam("bits", "i32");
        f.setReturnType("i32");

        const c = f.getCodeBuilder();

        f.addCode(
            c.i32_rotl(
                c.i32_add(
                    c.i32_add(
                        c.i32_shl(
                            c.i32_load8_u(
                                c.i32_and(
                                    c.getLocal("x"),
                                    c.i32_const(0xFF)
                                ),
                                REVTABLE,
                                0
                            ),
                            c.i32_const(24)
                        ),
                        c.i32_shl(
                            c.i32_load8_u(
                                c.i32_and(
                                    c.i32_shr_u(
                                        c.getLocal("x"),
                                        c.i32_const(8)
                                    ),
                                    c.i32_const(0xFF)
                                ),
                                REVTABLE,
                                0
                            ),
                            c.i32_const(16)
                        ),
                    ),
                    c.i32_add(
                        c.i32_shl(
                            c.i32_load8_u(
                                c.i32_and(
                                    c.i32_shr_u(
                                        c.getLocal("x"),
                                        c.i32_const(16)
                                    ),
                                    c.i32_const(0xFF)
                                ),
                                REVTABLE,
                                0
                            ),
                            c.i32_const(8)
                        ),
                        c.i32_load8_u(
                            c.i32_and(
                                c.i32_shr_u(
                                    c.getLocal("x"),
                                    c.i32_const(24)
                                ),
                                c.i32_const(0xFF)
                            ),
                            REVTABLE,
                            0
                        ),
                    )
                ),
                c.getLocal("bits")
            )
        );
    }


    function buildFFTJoin() {
        const f = module.addFunction(prefix+"_fftJoin");
        f.addParam("pBuff1", "i32");
        f.addParam("pBuff2", "i32");
        f.addParam("n", "i32");
        f.addParam("first", "i32");
        f.addParam("inc", "i32");
        f.addLocal("idx1", "i32");
        f.addLocal("idx2", "i32");
        f.addLocal("i", "i32");

        const c = f.getCodeBuilder();

        const W = c.i32_const(module.alloc(n8f));
        const T = c.i32_const(module.alloc(n8g));
        const U = c.i32_const(module.alloc(n8g));

        f.addCode(
            c.call( fPrefix + "_copy", c.getLocal("first"), W),
            c.setLocal("i", c.i32_const(0)),
            c.block(c.loop(
                c.br_if(
                    1,
                    c.i32_eq(
                        c.getLocal("i"),
                        c.getLocal("n")
                    )
                ),

                c.setLocal(
                    "idx1",
                    c.i32_add(
                        c.getLocal("pBuff1"),
                        c.i32_mul(
                            c.getLocal("i"),
                            c.i32_const(n8g)
                        )
                    )
                ),

                c.setLocal(
                    "idx2",
                    c.i32_add(
                        c.getLocal("pBuff2"),
                        c.i32_mul(
                            c.getLocal("i"),
                            c.i32_const(n8g)
                        )
                    )
                ),

                c.call(
                    opGtimesF,
                    c.getLocal("idx2"),
                    W,
                    T
                ),

                c.call(
                    gPrefix + "_copy",
                    c.getLocal("idx1"),
                    U
                ),

                c.call(
                    gPrefix + "_add",
                    U,
                    T,
                    c.getLocal("idx1"),
                ),

                c.call(
                    gPrefix + "_sub",
                    U,
                    T,
                    c.getLocal("idx2"),
                ),

                c.call(
                    fPrefix + "_mul",
                    W,
                    c.getLocal("inc"),
                    W,
                ),

                c.setLocal("i", c.i32_add(c.getLocal("i"), c.i32_const(1))),
                c.br(0)
            ))
        );
    }


    function buildFFTJoinExt() {
        const f = module.addFunction(prefix+"_fftJoinExt");
        f.addParam("pBuff1", "i32");
        f.addParam("pBuff2", "i32");
        f.addParam("n", "i32");
        f.addParam("first", "i32");
        f.addParam("inc", "i32");
        f.addParam("totalBits", "i32");
        f.addLocal("idx1", "i32");
        f.addLocal("idx2", "i32");
        f.addLocal("i", "i32");
        f.addLocal("pShiftToM", "i32");

        const c = f.getCodeBuilder();

        const W = c.i32_const(module.alloc(n8f));
        const U = c.i32_const(module.alloc(n8g));

        f.addCode(

            c.setLocal("pShiftToM",
                c.i32_add(
                    c.i32_const(SHIFT_TO_M),
                    c.i32_mul(
                        c.getLocal("totalBits"),
                        c.i32_const(n8f)
                    )
                )
            ),


            c.call( fPrefix + "_copy", c.getLocal("first"), W),
            c.setLocal("i", c.i32_const(0)),
            c.block(c.loop(
                c.br_if(
                    1,
                    c.i32_eq(
                        c.getLocal("i"),
                        c.getLocal("n")
                    )
                ),

                c.setLocal(
                    "idx1",
                    c.i32_add(
                        c.getLocal("pBuff1"),
                        c.i32_mul(
                            c.getLocal("i"),
                            c.i32_const(n8g)
                        )
                    )
                ),

                c.setLocal(
                    "idx2",
                    c.i32_add(
                        c.getLocal("pBuff2"),
                        c.i32_mul(
                            c.getLocal("i"),
                            c.i32_const(n8g)
                        )
                    )
                ),

                c.call(
                    gPrefix + "_add",
                    c.getLocal("idx1"),
                    c.getLocal("idx2"),
                    U
                ),

                c.call(
                    opGtimesF,
                    c.getLocal("idx2"),
                    c.getLocal("pShiftToM"),
                    c.getLocal("idx2")
                ),

                c.call(
                    gPrefix + "_add",
                    c.getLocal("idx1"),
                    c.getLocal("idx2"),
                    c.getLocal("idx2")
                ),

                c.call(
                    opGtimesF,
                    c.getLocal("idx2"),
                    W,
                    c.getLocal("idx2"),
                ),

                c.call(
                    gPrefix + "_copy",
                    U,
                    c.getLocal("idx1")
                ),

                c.call(
                    fPrefix + "_mul",
                    W,
                    c.getLocal("inc"),
                    W
                ),

                c.setLocal("i", c.i32_add(c.getLocal("i"), c.i32_const(1))),
                c.br(0)
            ))
        );
    }

    function buildFFTJoinExtInv() {
        const f = module.addFunction(prefix+"_fftJoinExtInv");
        f.addParam("pBuff1", "i32");
        f.addParam("pBuff2", "i32");
        f.addParam("n", "i32");
        f.addParam("first", "i32");
        f.addParam("inc", "i32");
        f.addParam("totalBits", "i32");
        f.addLocal("idx1", "i32");
        f.addLocal("idx2", "i32");
        f.addLocal("i", "i32");
        f.addLocal("pShiftToM", "i32");
        f.addLocal("pSConst", "i32");

        const c = f.getCodeBuilder();

        const W = c.i32_const(module.alloc(n8f));
        const U = c.i32_const(module.alloc(n8g));

        f.addCode(

            c.setLocal("pShiftToM",
                c.i32_add(
                    c.i32_const(SHIFT_TO_M),
                    c.i32_mul(
                        c.getLocal("totalBits"),
                        c.i32_const(n8f)
                    )
                )
            ),
            c.setLocal("pSConst",
                c.i32_add(
                    c.i32_const(SCONST),
                    c.i32_mul(
                        c.getLocal("totalBits"),
                        c.i32_const(n8f)
                    )
                )
            ),


            c.call( fPrefix + "_copy", c.getLocal("first"), W),
            c.setLocal("i", c.i32_const(0)),
            c.block(c.loop(
                c.br_if(
                    1,
                    c.i32_eq(
                        c.getLocal("i"),
                        c.getLocal("n")
                    )
                ),

                c.setLocal(
                    "idx1",
                    c.i32_add(
                        c.getLocal("pBuff1"),
                        c.i32_mul(
                            c.getLocal("i"),
                            c.i32_const(n8g)
                        )
                    )
                ),

                c.setLocal(
                    "idx2",
                    c.i32_add(
                        c.getLocal("pBuff2"),
                        c.i32_mul(
                            c.getLocal("i"),
                            c.i32_const(n8g)
                        )
                    )
                ),

                c.call(
                    opGtimesF,
                    c.getLocal("idx2"),
                    W,
                    U
                ),

                c.call(
                    gPrefix + "_sub",
                    c.getLocal("idx1"),
                    U,
                    c.getLocal("idx2"),
                ),

                c.call(
                    opGtimesF,
                    c.getLocal("idx2"),
                    c.getLocal("pSConst"),
                    c.getLocal("idx2")
                ),

                c.call(
                    opGtimesF,
                    c.getLocal("idx1"),
                    c.getLocal("pShiftToM"),
                    c.getLocal("idx1")
                ),

                c.call(
                    gPrefix + "_sub",
                    U,
                    c.getLocal("idx1"),
                    c.getLocal("idx1")
                ),

                c.call(
                    opGtimesF,
                    c.getLocal("idx1"),
                    c.getLocal("pSConst"),
                    c.getLocal("idx1")
                ),

                c.call(
                    fPrefix + "_mul",
                    W,
                    c.getLocal("inc"),
                    W
                ),

                c.setLocal("i", c.i32_add(c.getLocal("i"), c.i32_const(1))),
                c.br(0)
            ))
        );
    }



    function buildPrepareLagrangeEvaluation() {
        const f = module.addFunction(prefix+"_prepareLagrangeEvaluation");
        f.addParam("pBuff1", "i32");
        f.addParam("pBuff2", "i32");
        f.addParam("n", "i32");
        f.addParam("first", "i32");
        f.addParam("inc", "i32");
        f.addParam("totalBits", "i32");
        f.addLocal("idx1", "i32");
        f.addLocal("idx2", "i32");
        f.addLocal("i", "i32");
        f.addLocal("pShiftToM", "i32");
        f.addLocal("pSConst", "i32");

        const c = f.getCodeBuilder();

        const W = c.i32_const(module.alloc(n8f));
        const U = c.i32_const(module.alloc(n8g));

        f.addCode(

            c.setLocal("pShiftToM",
                c.i32_add(
                    c.i32_const(SHIFT_TO_M),
                    c.i32_mul(
                        c.getLocal("totalBits"),
                        c.i32_const(n8f)
                    )
                )
            ),
            c.setLocal("pSConst",
                c.i32_add(
                    c.i32_const(SCONST),
                    c.i32_mul(
                        c.getLocal("totalBits"),
                        c.i32_const(n8f)
                    )
                )
            ),


            c.call( fPrefix + "_copy", c.getLocal("first"), W),
            c.setLocal("i", c.i32_const(0)),
            c.block(c.loop(
                c.br_if(
                    1,
                    c.i32_eq(
                        c.getLocal("i"),
                        c.getLocal("n")
                    )
                ),

                c.setLocal(
                    "idx1",
                    c.i32_add(
                        c.getLocal("pBuff1"),
                        c.i32_mul(
                            c.getLocal("i"),
                            c.i32_const(n8g)
                        )
                    )
                ),

                c.setLocal(
                    "idx2",
                    c.i32_add(
                        c.getLocal("pBuff2"),
                        c.i32_mul(
                            c.getLocal("i"),
                            c.i32_const(n8g)
                        )
                    )
                ),


                c.call(
                    opGtimesF,
                    c.getLocal("idx1"),
                    c.getLocal("pShiftToM"),
                    U
                ),

                c.call(
                    gPrefix + "_sub",
                    c.getLocal("idx2"),
                    U,
                    U
                ),

                c.call(
                    gPrefix + "_sub",
                    c.getLocal("idx1"),
                    c.getLocal("idx2"),
                    c.getLocal("idx2"),
                ),

                c.call(
                    opGtimesF,
                    U,
                    c.getLocal("pSConst"),
                    c.getLocal("idx1"),
                ),

                c.call(
                    opGtimesF,
                    c.getLocal("idx2"),
                    W,
                    c.getLocal("idx2"),
                ),

                c.call(
                    fPrefix + "_mul",
                    W,
                    c.getLocal("inc"),
                    W
                ),

                c.setLocal("i", c.i32_add(c.getLocal("i"), c.i32_const(1))),
                c.br(0)
            ))
        );
    }

    function buildFFTMix() {
        const f = module.addFunction(prefix+"_fftMix");
        f.addParam("pBuff", "i32");
        f.addParam("n", "i32");
        f.addParam("exp", "i32");
        f.addLocal("nGroups", "i32");
        f.addLocal("nPerGroup", "i32");
        f.addLocal("nPerGroupDiv2", "i32");
        f.addLocal("pairOffset", "i32");
        f.addLocal("idx1", "i32");
        f.addLocal("idx2", "i32");
        f.addLocal("i", "i32");
        f.addLocal("j", "i32");
        f.addLocal("pwm", "i32");

        const c = f.getCodeBuilder();

        const W = c.i32_const(module.alloc(n8f));
        const T = c.i32_const(module.alloc(n8g));
        const U = c.i32_const(module.alloc(n8g));

        f.addCode(
            c.setLocal("nPerGroup", c.i32_shl(c.i32_const(1), c.getLocal("exp"))),
            c.setLocal("nPerGroupDiv2", c.i32_shr_u(c.getLocal("nPerGroup"), c.i32_const(1))),
            c.setLocal("nGroups", c.i32_shr_u(c.getLocal("n"), c.getLocal("exp"))),
            c.setLocal("pairOffset", c.i32_mul(c.getLocal("nPerGroupDiv2"), c.i32_const(n8g))),
            c.setLocal("pwm",
                c.i32_add(
                    c.i32_const(ROOTs),
                    c.i32_mul(
                        c.getLocal("exp"),
                        c.i32_const(n8f)
                    )
                )
            ),
            c.setLocal("i", c.i32_const(0)),
            c.block(c.loop(
                c.br_if(
                    1,
                    c.i32_eq(
                        c.getLocal("i"),
                        c.getLocal("nGroups")
                    )
                ),
                c.call( fPrefix + "_one", W),
                c.setLocal("j", c.i32_const(0)),
                c.block(c.loop(
                    c.br_if(
                        1,
                        c.i32_eq(
                            c.getLocal("j"),
                            c.getLocal("nPerGroupDiv2")
                        )
                    ),

                    c.setLocal(
                        "idx1",
                        c.i32_add(
                            c.getLocal("pBuff"),
                            c.i32_mul(
                                c.i32_add(
                                    c.i32_mul(
                                        c.getLocal("i"),
                                        c.getLocal("nPerGroup")
                                    ),
                                    c.getLocal("j")
                                ),
                                c.i32_const(n8g)
                            )
                        )
                    ),

                    c.setLocal(
                        "idx2",
                        c.i32_add(
                            c.getLocal("idx1"),
                            c.getLocal("pairOffset")
                        )
                    ),

                    c.call(
                        opGtimesF,
                        c.getLocal("idx2"),
                        W,
                        T
                    ),

                    c.call(
                        gPrefix + "_copy",
                        c.getLocal("idx1"),
                        U
                    ),

                    c.call(
                        gPrefix + "_add",
                        U,
                        T,
                        c.getLocal("idx1"),
                    ),

                    c.call(
                        gPrefix + "_sub",
                        U,
                        T,
                        c.getLocal("idx2"),
                    ),

                    c.call(
                        fPrefix + "_mul",
                        W,
                        c.getLocal("pwm"),
                        W,
                    ),
                    c.setLocal("j", c.i32_add(c.getLocal("j"), c.i32_const(1))),
                    c.br(0)
                )),
                c.setLocal("i", c.i32_add(c.getLocal("i"), c.i32_const(1))),
                c.br(0)
            ))
        );
    }


    // Reverse all and multiply by factor
    function buildFFTFinal() {
        const f = module.addFunction(prefix+"_fftFinal");
        f.addParam("pBuff", "i32");
        f.addParam("n", "i32");
        f.addParam("factor", "i32");
        f.addLocal("idx1", "i32");
        f.addLocal("idx2", "i32");
        f.addLocal("i", "i32");
        f.addLocal("ndiv2", "i32");

        const c = f.getCodeBuilder();

        const T = c.i32_const(module.alloc(n8g));

        f.addCode(
            c.setLocal("ndiv2", c.i32_shr_u(c.getLocal("n"), c.i32_const(1))),
            c.if(
                c.i32_and(
                    c.getLocal("n"),
                    c.i32_const(1)
                ),
                c.call(
                    opGtimesF,
                    c.i32_add(
                        c.getLocal("pBuff"),
                        c.i32_mul(
                            c.getLocal("ndiv2"),
                            c.i32_const(n8g)
                        )
                    ),
                    c.getLocal("factor"),
                    c.i32_add(
                        c.getLocal("pBuff"),
                        c.i32_mul(
                            c.getLocal("ndiv2"),
                            c.i32_const(n8g)
                        )
                    ),
                ),
            ),
            c.setLocal("i", c.i32_const(0)),
            c.block(c.loop(
                c.br_if(
                    1,
                    c.i32_ge_u(
                        c.getLocal("i"),
                        c.getLocal("ndiv2")
                    )
                ),

                c.setLocal(
                    "idx1",
                    c.i32_add(
                        c.getLocal("pBuff"),
                        c.i32_mul(
                            c.getLocal("i"),
                            c.i32_const(n8g)
                        )
                    )
                ),

                c.setLocal(
                    "idx2",
                    c.i32_add(
                        c.getLocal("pBuff"),
                        c.i32_mul(
                            c.i32_sub(
                                c.i32_sub(
                                    c.getLocal("n"),
                                    c.i32_const(1)
                                ),
                                c.getLocal("i")
                            ),
                            c.i32_const(n8g)
                        )
                    )
                ),

                c.call(
                    opGtimesF,
                    c.getLocal("idx2"),
                    c.getLocal("factor"),
                    T
                ),

                c.call(
                    opGtimesF,
                    c.getLocal("idx1"),
                    c.getLocal("factor"),
                    c.getLocal("idx2"),
                ),

                c.call(
                    gPrefix + "_copy",
                    T,
                    c.getLocal("idx1"),
                ),

                c.setLocal("i", c.i32_add(c.getLocal("i"), c.i32_const(1))),
                c.br(0)
            ))
        );
    }

    buildRev();
    buildReversePermutation();
    buildFinalInverse();
    buildRawFFT();
    buildLog2();
    buildFFT();
    buildIFFT();
    buildFFTJoin();
    buildFFTJoinExt();
    buildFFTJoinExtInv();
    buildFFTMix();
    buildFFTFinal();
    buildPrepareLagrangeEvaluation();

    module.exportFunction(prefix+"_fft");
    module.exportFunction(prefix+"_ifft");
    module.exportFunction(prefix+"_rawfft");
    module.exportFunction(prefix+"_fftJoin");
    module.exportFunction(prefix+"_fftJoinExt");
    module.exportFunction(prefix+"_fftJoinExtInv");
    module.exportFunction(prefix+"_fftMix");
    module.exportFunction(prefix+"_fftFinal");
    module.exportFunction(prefix+"_prepareLagrangeEvaluation");

};

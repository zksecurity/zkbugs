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

/*

    basesTable is in array of the form
    [
        base0,
        base0*2,
        base0*3,
        base0*4,
        base1,
        base1*2,
        base1*3,
        base1*4,
        ...
    ]

    chunkSize = 188 for MNT6753
                 62 for BN128

 */

module.exports = function buildPedersenHash(module, prefix, curvePrefix, pointFieldPrefix, chunkSize, basesTable) {

    const pointN64 = module.modules[curvePrefix].n64;
    const pointN8 = pointN64*8;
    const pointAfineN8 = pointN8*2/3;

    const pBaseTable = module.alloc(basesTable);

    function buildPedersenHash() {

        const f = module.addFunction(prefix+"_pedersenHash");
        f.addParam("pscalar", "i32");
        f.addParam("scalarlenbits", "i32");
        f.addParam("pr", "i32");
        f.addLocal("i", "i32");
        f.addLocal("sel", "i32");
        f.addLocal("sign", "i32");
        f.addLocal("pRes", "i32");

        const c = f.getCodeBuilder();

        const accumulators = c.i32_const(module.alloc(pointN8*chunkSize));
        const aux = c.i32_const(module.alloc(pointN8));

        f.addCode(
            c.call(prefix + "__resetAccumulators", accumulators, c.i32_const(chunkSize)),

            c.setLocal("i", c.i32_const(0)),
            c.block(c.loop(
                c.br_if(1, c.i32_ge_u ( c.getLocal("i"), c.getLocal("scalarlenbits") )),

                c.setLocal(
                    "sel",
                    c.i32_or(
                        c.call(
                            prefix + "__bit",
                            c.getLocal("pscalar"),
                            c.getLocal("scalarlenbits"),
                            c.getLocal("i")
                        ),
                        c.i32_shl(
                            c.call(
                                prefix + "__bit",
                                c.getLocal("pscalar"),
                                c.getLocal("scalarlenbits"),
                                c.i32_add(
                                    c.getLocal("i"),
                                    c.i32_const(1)
                                )
                            ),
                            c.i32_const(1)
                        )
                    )
                ),

                c.setLocal(
                    "sign",
                    c.call(
                        prefix + "__bit",
                        c.getLocal("pscalar"),
                        c.getLocal("scalarlenbits"),
                        c.i32_add(
                            c.getLocal("i"),
                            c.i32_const(2)
                        )
                    )
                ),

                c.setLocal(
                    "sel",
                    c.i32_add(
                        c.i32_add(
                            c.i32_const(pBaseTable),
                            c.i32_mul(
                                c.i32_div_u(
                                    c.getLocal("i"),
                                    c.i32_const(chunkSize*3)
                                ),
                                c.i32_const(pointAfineN8*4)
                            )
                        ),
                        c.i32_mul(
                            c.getLocal("sel"),
                            c.i32_const(pointAfineN8)
                        )
                    )
                ),

                c.setLocal("pRes",
                    c.i32_add(
                        accumulators,
                        c.i32_mul(
                            c.i32_rem_u(
                                c.i32_div_u(
                                    c.getLocal("i"),
                                    c.i32_const(3)
                                ),
                                c.i32_const(chunkSize)
                            ),
                            c.i32_const(pointN8)
                        )
                    )
                ),

                c.if(
                    c.getLocal("sign"),
                    c.call(curvePrefix + "_subMixed", c.getLocal("pRes"), c.getLocal("sel"), c.getLocal("pRes")),
                    c.call(curvePrefix + "_addMixed", c.getLocal("pRes"), c.getLocal("sel"), c.getLocal("pRes")),
                ),

                c.setLocal("i", c.i32_add(c.getLocal("i"), c.i32_const(3))),
                c.br(0)
            )),

            c.call(prefix + "__addAccumulators", accumulators, c.i32_const(chunkSize), aux),

            c.call(curvePrefix + "_normalize", aux, aux),
            c.call(curvePrefix + "_fromMontgomery", aux, aux),

            c.call(pointFieldPrefix + "_copy", aux, c.getLocal("pr"))

        );
    }


    function buildResetAccumulators() {
        const f = module.addFunction(prefix+"__resetAccumulators");
        f.addParam("paccumulators", "i32");
        f.addParam("n", "i32");  // Number of points
        f.addLocal("i", "i32");

        const c = f.getCodeBuilder();

        f.addCode(c.setLocal("i", c.i32_const(0)));
        f.addCode(c.block(c.loop(
            c.br_if(
                1,
                c.i32_eq(
                    c.getLocal("i"),
                    c.getLocal("n")
                )
            ),

            c.call(
                curvePrefix + "_zero",
                c.i32_add(
                    c.getLocal("paccumulators"),
                    c.i32_mul(
                        c.getLocal("i"),
                        c.i32_const(pointN8)
                    )
                )
            ),

            c.setLocal("i", c.i32_add(c.getLocal("i"), c.i32_const(1))),
            c.br(0)
        )));
    }

    function buildAddAccumulators() {
        const f = module.addFunction(prefix+"__addAccumulators");
        f.addParam("paccumulators", "i32");
        f.addParam("n", "i32");  // Number of points
        f.addParam("pr", "i32");
        f.addLocal("p", "i32");

        const c = f.getCodeBuilder();

        f.addCode(c.setLocal("p",
            c.i32_add(
                c.getLocal("paccumulators"),
                c.i32_mul(
                    c.i32_sub(
                        c.getLocal("n"),
                        c.i32_const(1)
                    ),
                    c.i32_const(pointN8)
                )
            )
        ));

        f.addCode(c.call(curvePrefix + "_copy", c.getLocal("p"), c.getLocal("pr")));
        f.addCode(c.setLocal("p", c.i32_sub(c.getLocal("p"), c.i32_const(pointN8))));

        f.addCode(c.block(c.loop(

            // Double 4 times (*16)
            c.call(
                curvePrefix + "_double",
                c.getLocal("pr"),
                c.getLocal("pr")
            ),
            c.call(
                curvePrefix + "_double",
                c.getLocal("pr"),
                c.getLocal("pr")
            ),
            c.call(
                curvePrefix + "_double",
                c.getLocal("pr"),
                c.getLocal("pr")
            ),
            c.call(
                curvePrefix + "_double",
                c.getLocal("pr"),
                c.getLocal("pr")
            ),

            c.call(
                curvePrefix + "_add",
                c.getLocal("p"),
                c.getLocal("pr"),
                c.getLocal("pr")
            ),

            c.br_if(
                1,
                c.i32_eq(
                    c.getLocal("p"),
                    c.getLocal("paccumulators")
                )
            ),

            c.setLocal("p", c.i32_sub(c.getLocal("p"), c.i32_const(pointN8))),
            c.br(0)
        )));
    }


    function buildBit() {

        const f = module.addFunction(prefix+"__bit");
        f.addParam("p", "i32");
        f.addParam("nbits", "i32");
        f.addParam("i", "i32");
        f.setReturnType("i32");

        const c = f.getCodeBuilder();

        f.addCode(
            c.if(
                c.i32_ge_u(
                    c.getLocal("i"),
                    c.getLocal("nbits")
                ),
                c.ret(c.i32_const(0)),
                c.ret(
                    c.i32_and(
                        c.i32_shr_u(
                            c.i32_load(
                                c.i32_add(
                                    c.getLocal("p"),
                                    c.i32_shr_u(
                                        c.i32_and(
                                            c.getLocal("i"),
                                            c.i32_const("0xFFFFFFE0")
                                        ),
                                        c.i32_const(3)
                                    )
                                )
                            ),
                            c.i32_and(
                                c.getLocal("i"),
                                c.i32_const("0x1F")
                            )
                        ),
                        c.i32_const(1)
                    )
                )
            ),
            c.i32_const(0)
        );
    }


    buildResetAccumulators();
    buildAddAccumulators();
    buildBit();

    buildPedersenHash();


    module.exportFunction(prefix+"_pedersenHash");


};

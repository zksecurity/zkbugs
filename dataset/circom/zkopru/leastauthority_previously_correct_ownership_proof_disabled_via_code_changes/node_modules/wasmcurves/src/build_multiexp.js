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

module.exports = function buildMultiexp(module, prefix, fnName, opAdd, n8b) {

    const n64g = module.modules[prefix].n64;
    const n8g = n64g*8;

    function buildGetChunk() {
        const f = module.addFunction(fnName + "_getChunk");
        f.addParam("pScalar", "i32");
        f.addParam("scalarSize", "i32");  // Number of bytes of the scalar
        f.addParam("startBit", "i32");  // Bit to start extract
        f.addParam("chunkSize", "i32");  // Chunk size in bits
        f.addLocal("bitsToEnd", "i32");
        f.addLocal("mask", "i32");
        f.setReturnType("i32");

        const c = f.getCodeBuilder();

        f.addCode(
            c.setLocal("bitsToEnd",
                c.i32_sub(
                    c.i32_mul(
                        c.getLocal("scalarSize"),
                        c.i32_const(8)
                    ),
                    c.getLocal("startBit")
                )
            ),
            c.if(
                c.i32_gt_s(
                    c.getLocal("chunkSize"),
                    c.getLocal("bitsToEnd")
                ),
                c.setLocal(
                    "mask",
                    c.i32_sub(
                        c.i32_shl(
                            c.i32_const(1),
                            c.getLocal("bitsToEnd")
                        ),
                        c.i32_const(1)
                    )
                ),
                c.setLocal(
                    "mask",
                    c.i32_sub(
                        c.i32_shl(
                            c.i32_const(1),
                            c.getLocal("chunkSize")
                        ),
                        c.i32_const(1)
                    )
                )
            ),
            c.i32_and(
                c.i32_shr_u(
                    c.i32_load(
                        c.i32_add(
                            c.getLocal("pScalar"),
                            c.i32_shr_u(
                                c.getLocal("startBit"),
                                c.i32_const(3)
                            )
                        ),
                        0,  // offset
                        0   // align to byte.
                    ),
                    c.i32_and(
                        c.getLocal("startBit"),
                        c.i32_const(0x7)
                    )
                ),
                c.getLocal("mask")
            )
        );
    }

    function buildMutiexpChunk() {
        const f = module.addFunction(fnName + "_chunk");
        f.addParam("pBases", "i32");
        f.addParam("pScalars", "i32");
        f.addParam("scalarSize", "i32");  // Number of points
        f.addParam("n", "i32");  // Number of points
        f.addParam("startBit", "i32");  // bit where it starts the chunk
        f.addParam("chunkSize", "i32");  // bit where it starts the chunk
        f.addParam("pr", "i32");
        f.addLocal("nChunks", "i32");
        f.addLocal("itScalar", "i32");
        f.addLocal("endScalar", "i32");
        f.addLocal("itBase", "i32");
        f.addLocal("i", "i32");
        f.addLocal("j", "i32");
        f.addLocal("nTable", "i32");
        f.addLocal("pTable", "i32");
        f.addLocal("idx", "i32");
        f.addLocal("pIdxTable", "i32");

        const c = f.getCodeBuilder();

        f.addCode(
            c.if(
                c.i32_eqz(c.getLocal("n")),
                [
                    ...c.call(prefix + "_zero", c.getLocal("pr")),
                    ...c.ret([])
                ]
            ),

            // Allocate memory

            c.setLocal(
                "nTable",
                c.i32_shl(
                    c.i32_const(1),
                    c.getLocal("chunkSize")
                )
            ),
            c.setLocal("pTable", c.i32_load( c.i32_const(0) )),
            c.i32_store(
                c.i32_const(0),
                c.i32_add(
                    c.getLocal("pTable"),
                    c.i32_mul(
                        c.getLocal("nTable"),
                        c.i32_const(n8g)
                    )
                )
            ),

            // Reset Table
            c.setLocal("j", c.i32_const(0)),
            c.block(c.loop(
                c.br_if(
                    1,
                    c.i32_eq(
                        c.getLocal("j"),
                        c.getLocal("nTable")
                    )
                ),

                c.call(
                    prefix + "_zero",
                    c.i32_add(
                        c.getLocal("pTable"),
                        c.i32_mul(
                            c.getLocal("j"),
                            c.i32_const(n8g)
                        )
                    )
                ),

                c.setLocal("j", c.i32_add(c.getLocal("j"), c.i32_const(1))),
                c.br(0)
            )),

            // Distribute elements
            c.setLocal("itBase", c.getLocal("pBases")),
            c.setLocal("itScalar", c.getLocal("pScalars")),
            c.setLocal("endScalar",
                c.i32_add(
                    c.getLocal("pScalars"),
                    c.i32_mul(
                        c.getLocal("n"),
                        c.getLocal("scalarSize")
                    )
                )
            ),
            c.block(c.loop(
                c.br_if(
                    1,
                    c.i32_eq(
                        c.getLocal("itScalar"),
                        c.getLocal("endScalar")
                    )
                ),

                c.setLocal(
                    "idx",
                    c.call(fnName + "_getChunk",
                        c.getLocal("itScalar"),
                        c.getLocal("scalarSize"),
                        c.getLocal("startBit"),
                        c.getLocal("chunkSize")
                    )
                ),

                c.if(
                    c.getLocal("idx"),
                    [
                        ...c.setLocal(
                            "pIdxTable",
                            c.i32_add(
                                c.getLocal("pTable"),
                                c.i32_mul(
                                    c.i32_sub(
                                        c.getLocal("idx"),
                                        c.i32_const(1)
                                    ),
                                    c.i32_const(n8g)
                                )
                            )
                        ),
                        ...c.call(
                            opAdd,
                            c.getLocal("pIdxTable"),
                            c.getLocal("itBase"),
                            c.getLocal("pIdxTable"),
                        )
                    ]
                ),

                c.setLocal("itScalar", c.i32_add(c.getLocal("itScalar"), c.getLocal("scalarSize"))),
                c.setLocal("itBase", c.i32_add(c.getLocal("itBase"), c.i32_const(n8b))),
                c.br(0)
            )),

            c.call(fnName + "_reduceTable", c.getLocal("pTable"), c.getLocal("chunkSize")),
            c.call(
                prefix + "_copy",
                c.getLocal("pTable"),
                c.getLocal("pr")
            ),


            c.i32_store(
                c.i32_const(0),
                c.getLocal("pTable")
            )

        );
    }

    function buildMultiexp() {
        const f = module.addFunction(fnName);
        f.addParam("pBases", "i32");
        f.addParam("pScalars", "i32");
        f.addParam("scalarSize", "i32");  // Number of points
        f.addParam("n", "i32");  // Number of points
        f.addParam("pr", "i32");
        f.addLocal("chunkSize", "i32");
        f.addLocal("nChunks", "i32");
        f.addLocal("itScalar", "i32");
        f.addLocal("endScalar", "i32");
        f.addLocal("itBase", "i32");
        f.addLocal("itBit", "i32");
        f.addLocal("i", "i32");
        f.addLocal("j", "i32");
        f.addLocal("nTable", "i32");
        f.addLocal("pTable", "i32");
        f.addLocal("idx", "i32");
        f.addLocal("pIdxTable", "i32");

        const c = f.getCodeBuilder();

        const aux = c.i32_const(module.alloc(n8g));

        const pTSizes = module.alloc([
            17, 17, 17, 17,   17, 17, 17, 17,
            17, 17, 16, 16,   15, 14, 13, 13,
            12, 11, 10,  9,    8,  7,  7,  6,
            5 ,  4,  3,  2,    1,  1,  1,  1
        ]);

        f.addCode(
            c.call(prefix + "_zero", c.getLocal("pr")),
            c.if(
                c.i32_eqz(c.getLocal("n")),
                c.ret([])
            ),
            c.setLocal("chunkSize", c.i32_load8_u( c.i32_clz(c.getLocal("n")),  pTSizes )),
            c.setLocal(
                "nChunks",
                c.i32_add(
                    c.i32_div_u(
                        c.i32_sub(
                            c.i32_shl(
                                c.getLocal("scalarSize"),
                                c.i32_const(3)
                            ),
                            c.i32_const(1)
                        ),
                        c.getLocal("chunkSize")
                    ),
                    c.i32_const(1)
                )
            ),


            // Allocate memory

            c.setLocal(
                "itBit",
                c.i32_mul(
                    c.i32_sub(
                        c.getLocal("nChunks"),
                        c.i32_const(1)
                    ),
                    c.getLocal("chunkSize")
                )
            ),
            c.block(c.loop(
                c.br_if(
                    1,
                    c.i32_lt_s(
                        c.getLocal("itBit"),
                        c.i32_const(0)
                    )
                ),

                // Double nChunk times
                c.if(
                    c.i32_eqz(c.call(prefix + "_isZero", c.getLocal("pr"))),
                    [
                        ...c.setLocal("j", c.i32_const(0)),
                        ...c.block(c.loop(
                            c.br_if(
                                1,
                                c.i32_eq(
                                    c.getLocal("j"),
                                    c.getLocal("chunkSize")
                                )
                            ),

                            c.call(prefix + "_double", c.getLocal("pr"), c.getLocal("pr")),

                            c.setLocal("j", c.i32_add(c.getLocal("j"), c.i32_const(1))),
                            c.br(0)
                        ))
                    ]
                ),

                c.call(
                    fnName + "_chunk",
                    c.getLocal("pBases"),
                    c.getLocal("pScalars"),
                    c.getLocal("scalarSize"),
                    c.getLocal("n"),
                    c.getLocal("itBit"),
                    c.getLocal("chunkSize"),
                    aux
                ),

                c.call(
                    prefix + "_add",
                    c.getLocal("pr"),
                    aux,
                    c.getLocal("pr")
                ),
                c.setLocal("itBit", c.i32_sub(c.getLocal("itBit"), c.getLocal("chunkSize"))),
                c.br(0)
            ))
        );
    }

    function buildReduceTable() {
        const f = module.addFunction(fnName + "_reduceTable");
        f.addParam("pTable", "i32");
        f.addParam("p", "i32");  // Number of bits of the table
        f.addLocal("half", "i32");
        f.addLocal("it1", "i32");
        f.addLocal("it2", "i32");
        f.addLocal("pAcc", "i32");

        const c = f.getCodeBuilder();

        f.addCode(
            c.if(
                c.i32_eq(c.getLocal("p"), c.i32_const(1)),
                c.ret([])
            ),
            c.setLocal(
                "half",
                c.i32_shl(
                    c.i32_const(1),
                    c.i32_sub(
                        c.getLocal("p"),
                        c.i32_const(1)
                    )
                )
            ),

            c.setLocal("it1", c.getLocal("pTable")),
            c.setLocal(
                "it2",
                c.i32_add(
                    c.getLocal("pTable"),
                    c.i32_mul(
                        c.getLocal("half"),
                        c.i32_const(n8g)
                    )
                )
            ),
            c.setLocal("pAcc",
                c.i32_sub(
                    c.getLocal("it2"),
                    c.i32_const(n8g)
                )
            ),
            c.block(c.loop(
                c.br_if(
                    1,
                    c.i32_eq(
                        c.getLocal("it1"),
                        c.getLocal("pAcc")
                    )
                ),
                c.call(
                    prefix + "_add",
                    c.getLocal("it1"),
                    c.getLocal("it2"),
                    c.getLocal("it1")
                ),
                c.call(
                    prefix + "_add",
                    c.getLocal("pAcc"),
                    c.getLocal("it2"),
                    c.getLocal("pAcc")
                ),
                c.setLocal("it1", c.i32_add(c.getLocal("it1"), c.i32_const(n8g))),
                c.setLocal("it2", c.i32_add(c.getLocal("it2"), c.i32_const(n8g))),
                c.br(0)
            )),

            c.call(
                fnName + "_reduceTable",
                c.getLocal("pTable"),
                c.i32_sub(
                    c.getLocal("p"),
                    c.i32_const(1)
                )
            ),

            c.setLocal("p", c.i32_sub(c.getLocal("p"), c.i32_const(1))),
            c.block(c.loop(
                c.br_if(1, c.i32_eqz(c.getLocal("p"))),
                c.call(prefix + "_double", c.getLocal("pAcc"), c.getLocal("pAcc")),
                c.setLocal("p", c.i32_sub(c.getLocal("p"), c.i32_const(1))),
                c.br(0)
            )),

            c.call(prefix + "_add", c.getLocal("pTable"), c.getLocal("pAcc"), c.getLocal("pTable"))
        );
    }

    buildGetChunk();
    buildReduceTable();
    buildMutiexpChunk();
    buildMultiexp();

    module.exportFunction(fnName);
    module.exportFunction(fnName +"_chunk");


};




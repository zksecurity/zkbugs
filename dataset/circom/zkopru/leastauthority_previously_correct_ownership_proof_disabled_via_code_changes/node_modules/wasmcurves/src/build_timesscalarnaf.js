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

module.exports = function buildTimesScalarNAF(module, fnName, elementLen, opAB, opAA, opAmB, opCopy, opInit) {

    const f = module.addFunction(fnName);
    f.addParam("base", "i32");
    f.addParam("scalar", "i32");
    f.addParam("scalarLength", "i32");
    f.addParam("r", "i32");
    f.addLocal("old0", "i32");
    f.addLocal("nbits", "i32");
    f.addLocal("i", "i32");
    f.addLocal("last", "i32");
    f.addLocal("cur", "i32");
    f.addLocal("carry", "i32");
    f.addLocal("p", "i32");

    const c = f.getCodeBuilder();

    const aux = c.i32_const(module.alloc(elementLen));

    function getBit(IDX) {
        return c.i32_and(
            c.i32_shr_u(
                c.i32_load(
                    c.i32_add(
                        c.getLocal("scalar"),
                        c.i32_and(
                            c.i32_shr_u(
                                IDX,
                                c.i32_const(3)
                            ),
                            c.i32_const(0xFFFFFFFC)
                        )
                    )
                ),
                c.i32_and(
                    IDX,
                    c.i32_const(0x1F)
                )
            ),
            c.i32_const(1)
        );
    }

    function pushBit(b) {
        return [
            ...c.i32_store8(
                c.getLocal("p"),
                c.i32_const(b)
            ),
            ...c.setLocal(
                "p",
                c.i32_add(
                    c.getLocal("p"),
                    c.i32_const(1)
                )
            )
        ];
    }

    f.addCode(
        c.if(
            c.i32_eqz(c.getLocal("scalarLength")),
            [
                ...c.call(opInit, c.getLocal("r")),
                ...c.ret([])
            ]
        ),
        c.setLocal("nbits", c.i32_shl(c.getLocal("scalarLength"), c.i32_const(3))),
        c.setLocal("old0", c.i32_load(c.i32_const(0))),
        c.setLocal("p", c.getLocal("old0")),
        c.i32_store(
            c.i32_const(0),
            c.i32_and(
                c.i32_add(
                    c.i32_add(
                        c.getLocal("old0"),
                        c.i32_const(32)
                    ),
                    c.getLocal("nbits")
                ),
                c.i32_const(0xFFFFFFF8)
            )
        ),
        c.setLocal("i", c.i32_const(1)),

        c.setLocal("last",getBit(c.i32_const(0))),
        c.setLocal("carry",c.i32_const(0)),

        c.block(c.loop(
            c.br_if(1, c.i32_eq( c.getLocal("i"), c.getLocal("nbits"))),

            c.setLocal("cur", getBit(c.getLocal("i"))),
            c.if( c.getLocal("last"),
                c.if( c.getLocal("cur"),
                    c.if(c.getLocal("carry"),
                        [
                            ...c.setLocal("last", c.i32_const(0)),
                            ...c.setLocal("carry", c.i32_const(1)),
                            ...pushBit(1)
                        ]
                        ,
                        [
                            ...c.setLocal("last", c.i32_const(0)),
                            ...c.setLocal("carry", c.i32_const(1)),
                            ...pushBit(255)
                        ],
                    ),
                    c.if(c.getLocal("carry"),
                        [
                            ...c.setLocal("last", c.i32_const(0)),
                            ...c.setLocal("carry", c.i32_const(1)),
                            ...pushBit(255)
                        ]
                        ,
                        [
                            ...c.setLocal("last", c.i32_const(0)),
                            ...c.setLocal("carry", c.i32_const(0)),
                            ...pushBit(1)
                        ],
                    ),
                ),
                c.if( c.getLocal("cur"),
                    c.if(c.getLocal("carry"),
                        [
                            ...c.setLocal("last", c.i32_const(0)),
                            ...c.setLocal("carry", c.i32_const(1)),
                            ...pushBit(0)
                        ]
                        ,
                        [
                            ...c.setLocal("last", c.i32_const(1)),
                            ...c.setLocal("carry", c.i32_const(0)),
                            ...pushBit(0)
                        ],
                    ),
                    c.if(c.getLocal("carry"),
                        [
                            ...c.setLocal("last", c.i32_const(1)),
                            ...c.setLocal("carry", c.i32_const(0)),
                            ...pushBit(0)
                        ]
                        ,
                        [
                            ...c.setLocal("last", c.i32_const(0)),
                            ...c.setLocal("carry", c.i32_const(0)),
                            ...pushBit(0)
                        ],
                    ),
                )
            ),
            c.setLocal("i", c.i32_add(c.getLocal("i"), c.i32_const(1))),
            c.br(0)
        )),

        c.if( c.getLocal("last"),
            c.if(c.getLocal("carry"),
                [
                    ...pushBit(255),
                    ...pushBit(0),
                    ...pushBit(1)
                ]
                ,
                [
                    ...pushBit(1)
                ],
            ),
            c.if(c.getLocal("carry"),
                [
                    ...pushBit(0),
                    ...pushBit(1)
                ]
            ),
        ),

        c.setLocal("p", c.i32_sub(c.getLocal("p"), c.i32_const(1))),

        // p already points to the last bit

        c.call(opCopy, c.getLocal("base"), aux),

        c.call(opInit, c.getLocal("r")),

        c.block(c.loop(


            c.call(opAA, c.getLocal("r"), c.getLocal("r")),


            c.setLocal("cur",
                c.i32_load8_u(
                    c.getLocal("p")
                )
            ),

            c.if(
                c.getLocal("cur"),
                c.if(
                    c.i32_eq(c.getLocal("cur"), c.i32_const(1)),
                    c.call(opAB,  c.getLocal("r"), aux, c.getLocal("r")),
                    c.call(opAmB, c.getLocal("r"), aux, c.getLocal("r")),
                )
            ),

            c.br_if(1, c.i32_eq( c.getLocal("old0"), c.getLocal("p"))),
            c.setLocal("p", c.i32_sub(c.getLocal("p"), c.i32_const(1))),
            c.br(0)

        )),

        c.i32_store( c.i32_const(0), c.getLocal("old0"))

    );

};

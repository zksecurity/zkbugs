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

module.exports = function buildInt(module, n64, _prefix) {

    const prefix = _prefix || "int";
    if (module.modules[prefix]) return prefix;  // already builded
    module.modules[prefix] = {};

    const n32 = n64*2;
    const n8 = n64*8;

    function buildCopy() {
        const f = module.addFunction(prefix+"_copy");
        f.addParam("px", "i32");
        f.addParam("pr", "i32");

        const c = f.getCodeBuilder();

        for (let i=0; i<n64; i++) {
            f.addCode(
                c.i64_store(
                    c.getLocal("pr"),
                    i*8,
                    c.i64_load(
                        c.getLocal("px"),
                        i*8
                    )
                )
            );
        }
    }

    function buildZero() {
        const f = module.addFunction(prefix+"_zero");
        f.addParam("pr", "i32");

        const c = f.getCodeBuilder();

        for (let i=0; i<n64; i++) {
            f.addCode(
                c.i64_store(
                    c.getLocal("pr"),
                    i*8,
                    c.i64_const(0)
                )
            );
        }
    }

    function buildOne() {
        const f = module.addFunction(prefix+"_one");
        f.addParam("pr", "i32");

        const c = f.getCodeBuilder();

        f.addCode(
            c.i64_store(
                c.getLocal("pr"),
                0,
                c.i64_const(1)
            )
        );
        for (let i=1; i<n64; i++) {
            f.addCode(
                c.i64_store(
                    c.getLocal("pr"),
                    i*8,
                    c.i64_const(0)
                )
            );
        }
    }

    function buildIsZero() {
        const f = module.addFunction(prefix+"_isZero");
        f.addParam("px", "i32");
        f.setReturnType("i32");

        const c = f.getCodeBuilder();

        function getCompCode(n) {
            if (n==0) {
                return  c.ret(c.i64_eqz(
                    c.i64_load(c.getLocal("px"))
                ));
            }
            return c.if(
                c.i64_eqz(
                    c.i64_load(c.getLocal("px"), n*8 )
                ),
                getCompCode(n-1),
                c.ret(c.i32_const(0))
            );
        }

        f.addCode(getCompCode(n64-1));
        f.addCode(c.ret(c.i32_const(0)));
    }

    function buildEq() {
        const f = module.addFunction(prefix+"_eq");
        f.addParam("px", "i32");
        f.addParam("py", "i32");
        f.setReturnType("i32");

        const c = f.getCodeBuilder();

        function getCompCode(n) {
            if (n==0) {
                return  c.ret(c.i64_eq(
                    c.i64_load(c.getLocal("px")),
                    c.i64_load(c.getLocal("py"))
                ));
            }
            return c.if(
                c.i64_eq(
                    c.i64_load(c.getLocal("px"), n*8 ),
                    c.i64_load(c.getLocal("py"), n*8 )
                ),
                getCompCode(n-1),
                c.ret(c.i32_const(0))
            );
        }

        f.addCode(getCompCode(n64-1));
        f.addCode(c.ret(c.i32_const(0)));
    }



    function buildGte() {
        const f = module.addFunction(prefix+"_gte");
        f.addParam("px", "i32");
        f.addParam("py", "i32");
        f.setReturnType("i32");

        const c = f.getCodeBuilder();

        function getCompCode(n) {
            if (n==0) {
                return  c.ret(c.i64_ge_u(
                    c.i64_load(c.getLocal("px")),
                    c.i64_load(c.getLocal("py"))
                ));
            }
            return c.if(
                c.i64_lt_u(
                    c.i64_load(c.getLocal("px"), n*8 ),
                    c.i64_load(c.getLocal("py"), n*8 )
                ),
                c.ret(c.i32_const(0)),
                c.if(
                    c.i64_gt_u(
                        c.i64_load(c.getLocal("px"), n*8 ),
                        c.i64_load(c.getLocal("py"), n*8 )
                    ),
                    c.ret(c.i32_const(1)),
                    getCompCode(n-1)
                )
            );
        }

        f.addCode(getCompCode(n64-1));
        f.addCode(c.ret(c.i32_const(0)));
    }



    function buildAdd() {

        const f = module.addFunction(prefix+"_add");
        f.addParam("x", "i32");
        f.addParam("y", "i32");
        f.addParam("r", "i32");
        f.setReturnType("i32");
        f.addLocal("c", "i64");

        const c = f.getCodeBuilder();

        f.addCode(c.setLocal(
            "c",
            c.i64_add(
                c.i64_load32_u(c.getLocal("x")),
                c.i64_load32_u(c.getLocal("y"))
            )
        ));

        f.addCode(c.i64_store32(
            c.getLocal("r"),
            c.getLocal("c"),
        ));

        for (let i=1; i<n32; i++) {
            f.addCode(c.setLocal( "c",
                c.i64_add(
                    c.i64_add(
                        c.i64_load32_u(c.getLocal("x"), 4*i),
                        c.i64_load32_u(c.getLocal("y"), 4*i)
                    ),
                    c.i64_shr_u (c.getLocal("c"), c.i64_const(32))
                )
            ));

            f.addCode(c.i64_store32(
                c.getLocal("r"),
                i*4,
                c.getLocal("c")
            ));
        }

        f.addCode(c.i32_wrap_i64(c.i64_shr_u (c.getLocal("c"), c.i64_const(32))));
    }


    function buildSub() {

        const f = module.addFunction(prefix+"_sub");
        f.addParam("x", "i32");
        f.addParam("y", "i32");
        f.addParam("r", "i32");
        f.setReturnType("i32");
        f.addLocal("c", "i64");

        const c = f.getCodeBuilder();

        f.addCode(c.setLocal(
            "c",
            c.i64_sub(
                c.i64_load32_u(c.getLocal("x")),
                c.i64_load32_u(c.getLocal("y"))
            )
        ));

        f.addCode(c.i64_store32(
            c.getLocal("r"),
            c.i64_and(
                c.getLocal("c"),
                c.i64_const("0xFFFFFFFF")
            )
        ));

        for (let i=1; i<n32; i++) {
            f.addCode(c.setLocal( "c",
                c.i64_add(
                    c.i64_sub(
                        c.i64_load32_u(c.getLocal("x"), 4*i),
                        c.i64_load32_u(c.getLocal("y"), 4*i)
                    ),
                    c.i64_shr_s (c.getLocal("c"), c.i64_const(32))
                )
            ));

            f.addCode(c.i64_store32(
                c.getLocal("r"),
                i*4,
                c.i64_and( c.getLocal("c"), c.i64_const("0xFFFFFFFF"))
            ));
        }

        f.addCode(c.i32_wrap_i64 ( c.i64_shr_s (c.getLocal("c"), c.i64_const(32))));
    }


    function buildMul() {

        const f = module.addFunction(prefix+"_mul");
        f.addParam("x", "i32");
        f.addParam("y", "i32");
        f.addParam("r", "i32");
        f.addLocal("c0", "i64");
        f.addLocal("c1", "i64");


        for (let i=0;i<n32; i++) {
            f.addLocal("x"+i, "i64");
            f.addLocal("y"+i, "i64");
        }

        const c = f.getCodeBuilder();

        const loadX = [];
        const loadY = [];
        function mulij(i, j) {
            let X,Y;
            if (!loadX[i]) {
                X = c.teeLocal("x"+i, c.i64_load32_u( c.getLocal("x"), i*4));
                loadX[i] = true;
            } else {
                X = c.getLocal("x"+i);
            }
            if (!loadY[j]) {
                Y = c.teeLocal("y"+j, c.i64_load32_u( c.getLocal("y"), j*4));
                loadY[j] = true;
            } else {
                Y = c.getLocal("y"+j);
            }

            return c.i64_mul( X, Y );
        }

        let c0 = "c0";
        let c1 = "c1";

        for (let k=0; k<n32*2-1; k++) {
            for (let i=Math.max(0, k-n32+1); (i<=k)&&(i<n32); i++) {
                const j= k-i;

                f.addCode(
                    c.setLocal(c0,
                        c.i64_add(
                            c.i64_and(
                                c.getLocal(c0),
                                c.i64_const(0xFFFFFFFF)
                            ),
                            mulij(i,j)
                        )
                    )
                );

                f.addCode(
                    c.setLocal(c1,
                        c.i64_add(
                            c.getLocal(c1),
                            c.i64_shr_u(
                                c.getLocal(c0),
                                c.i64_const(32)
                            )
                        )
                    )
                );

            }

            f.addCode(
                c.i64_store32(
                    c.getLocal("r"),
                    k*4,
                    c.getLocal(c0)
                )
            );
            [c0, c1] = [c1, c0];
            f.addCode(
                c.setLocal(c1,
                    c.i64_shr_u(
                        c.getLocal(c0),
                        c.i64_const(32)
                    )
                )
            );
        }
        f.addCode(
            c.i64_store32(
                c.getLocal("r"),
                n32*4*2-4,
                c.getLocal(c0)
            )
        );

    }



    function buildSquare() {

        const f = module.addFunction(prefix+"_square");
        f.addParam("x", "i32");
        f.addParam("r", "i32");
        f.addLocal("c0", "i64");
        f.addLocal("c1", "i64");
        f.addLocal("c0_old", "i64");
        f.addLocal("c1_old", "i64");


        for (let i=0;i<n32; i++) {
            f.addLocal("x"+i, "i64");
        }

        const c = f.getCodeBuilder();

        const loadX = [];
        function mulij(i, j) {
            let X,Y;
            if (!loadX[i]) {
                X = c.teeLocal("x"+i, c.i64_load32_u( c.getLocal("x"), i*4));
                loadX[i] = true;
            } else {
                X = c.getLocal("x"+i);
            }
            if (!loadX[j]) {
                Y = c.teeLocal("x"+j, c.i64_load32_u( c.getLocal("x"), j*4));
                loadX[j] = true;
            } else {
                Y = c.getLocal("x"+j);
            }

            return c.i64_mul( X, Y );
        }

        let c0 = "c0";
        let c1 = "c1";
        let c0_old = "c0_old";
        let c1_old = "c1_old";

        for (let k=0; k<n32*2-1; k++) {
            f.addCode(
                c.setLocal(c0, c.i64_const(0)),
                c.setLocal(c1, c.i64_const(0)),
            );

            for (let i=Math.max(0, k-n32+1); (i<((k+1)>>1) )&&(i<n32); i++) {
                const j= k-i;

                f.addCode(
                    c.setLocal(c0,
                        c.i64_add(
                            c.i64_and(
                                c.getLocal(c0),
                                c.i64_const(0xFFFFFFFF)
                            ),
                            mulij(i,j)
                        )
                    )
                );

                f.addCode(
                    c.setLocal(c1,
                        c.i64_add(
                            c.getLocal(c1),
                            c.i64_shr_u(
                                c.getLocal(c0),
                                c.i64_const(32)
                            )
                        )
                    )
                );
            }

            // Multiply by 2
            f.addCode(
                c.setLocal(c0,
                    c.i64_shl(
                        c.i64_and(
                            c.getLocal(c0),
                            c.i64_const(0xFFFFFFFF)
                        ),
                        c.i64_const(1)
                    )
                )
            );

            f.addCode(
                c.setLocal(c1,
                    c.i64_add(
                        c.i64_shl(
                            c.getLocal(c1),
                            c.i64_const(1)
                        ),
                        c.i64_shr_u(
                            c.getLocal(c0),
                            c.i64_const(32)
                        )
                    )
                )
            );

            if (k%2 == 0) {
                f.addCode(
                    c.setLocal(c0,
                        c.i64_add(
                            c.i64_and(
                                c.getLocal(c0),
                                c.i64_const(0xFFFFFFFF)
                            ),
                            mulij(k>>1, k>>1)
                        )
                    )
                );

                f.addCode(
                    c.setLocal(c1,
                        c.i64_add(
                            c.getLocal(c1),
                            c.i64_shr_u(
                                c.getLocal(c0),
                                c.i64_const(32)
                            )
                        )
                    )
                );
            }

            // Add the old carry

            if (k>0) {
                f.addCode(
                    c.setLocal(c0,
                        c.i64_add(
                            c.i64_and(
                                c.getLocal(c0),
                                c.i64_const(0xFFFFFFFF)
                            ),
                            c.i64_and(
                                c.getLocal(c0_old),
                                c.i64_const(0xFFFFFFFF)
                            ),
                        )
                    )
                );

                f.addCode(
                    c.setLocal(c1,
                        c.i64_add(
                            c.i64_add(
                                c.getLocal(c1),
                                c.i64_shr_u(
                                    c.getLocal(c0),
                                    c.i64_const(32)
                                )
                            ),
                            c.getLocal(c1_old)
                        )
                    )
                );
            }

            f.addCode(
                c.i64_store32(
                    c.getLocal("r"),
                    k*4,
                    c.getLocal(c0)
                )
            );

            f.addCode(
                c.setLocal(
                    c0_old,
                    c.getLocal(c1)
                ),
                c.setLocal(
                    c1_old,
                    c.i64_shr_u(
                        c.getLocal(c0_old),
                        c.i64_const(32)
                    )
                )
            );

        }
        f.addCode(
            c.i64_store32(
                c.getLocal("r"),
                n32*4*2-4,
                c.getLocal(c0_old)
            )
        );

    }


    function buildSquareOld() {
        const f = module.addFunction(prefix+"_squareOld");
        f.addParam("x", "i32");
        f.addParam("r", "i32");

        const c = f.getCodeBuilder();

        f.addCode(c.call(prefix + "_mul", c.getLocal("x"), c.getLocal("x"), c.getLocal("r")));
    }

    function _buildMul1() {
        const f = module.addFunction(prefix+"__mul1");
        f.addParam("px", "i32");
        f.addParam("y", "i64");
        f.addParam("pr", "i32");
        f.addLocal("c", "i64");

        const c = f.getCodeBuilder();

        f.addCode(c.setLocal(
            "c",
            c.i64_mul(
                c.i64_load32_u(c.getLocal("px"), 0, 0),
                c.getLocal("y")
            )
        ));

        f.addCode(c.i64_store32(
            c.getLocal("pr"),
            0,
            0,
            c.getLocal("c"),
        ));

        for (let i=1; i<n32; i++) {
            f.addCode(c.setLocal( "c",
                c.i64_add(
                    c.i64_mul(
                        c.i64_load32_u(c.getLocal("px"), 4*i, 0),
                        c.getLocal("y")
                    ),
                    c.i64_shr_u (c.getLocal("c"), c.i64_const(32))
                )
            ));

            f.addCode(c.i64_store32(
                c.getLocal("pr"),
                i*4,
                0,
                c.getLocal("c")
            ));
        }
    }

    function _buildAdd1() {
        const f = module.addFunction(prefix+"__add1");
        f.addParam("x", "i32");
        f.addParam("y", "i64");
        f.addLocal("c", "i64");
        f.addLocal("px", "i32");

        const c = f.getCodeBuilder();

        f.addCode(c.setLocal("px", c.getLocal("x")));

        f.addCode(c.setLocal(
            "c",
            c.i64_add(
                c.i64_load32_u(c.getLocal("px"), 0, 0),
                c.getLocal("y")
            )
        ));

        f.addCode(c.i64_store32(
            c.getLocal("px"),
            0,
            0,
            c.getLocal("c"),
        ));

        f.addCode(c.setLocal(
            "c",
            c.i64_shr_u(
                c.getLocal("c"),
                c.i64_const(32)
            )
        ));

        f.addCode(c.block(c.loop(
            c.br_if(
                1,
                c.i64_eqz(c.getLocal("c"))
            ),
            c.setLocal(
                "px",
                c.i32_add(
                    c.getLocal("px"),
                    c.i32_const(4)
                )
            ),

            c.setLocal(
                "c",
                c.i64_add(
                    c.i64_load32_u(c.getLocal("px"), 0, 0),
                    c.getLocal("c")
                )
            ),

            c.i64_store32(
                c.getLocal("px"),
                0,
                0,
                c.getLocal("c"),
            ),

            c.setLocal(
                "c",
                c.i64_shr_u(
                    c.getLocal("c"),
                    c.i64_const(32)
                )
            ),

            c.br(0)
        )));
    }


    function buildDiv() {
        _buildMul1();
        _buildAdd1();

        const f = module.addFunction(prefix+"_div");
        f.addParam("x", "i32");
        f.addParam("y", "i32");
        f.addParam("c", "i32");
        f.addParam("r", "i32");
        f.addLocal("rr", "i32");
        f.addLocal("cc", "i32");
        f.addLocal("eX", "i32");
        f.addLocal("eY", "i32");
        f.addLocal("sy", "i64");
        f.addLocal("sx", "i64");
        f.addLocal("ec", "i32");

        const c = f.getCodeBuilder();

        const Y = c.i32_const(module.alloc(n8));
        const Caux = c.i32_const(module.alloc(n8));
        const Raux = c.i32_const(module.alloc(n8));
        const C = c.getLocal("cc");
        const R = c.getLocal("rr");
        const pr1 = module.alloc(n8*2);
        const R1 = c.i32_const(pr1);
        const R2 = c.i32_const(pr1+n8);

        // Ic c is 0 then store it in an auxiliary buffer
        f.addCode(c.if(
            c.getLocal("c"),
            c.setLocal("cc", c.getLocal("c")),
            c.setLocal("cc", Caux)
        ));

        // Ic r is 0 then store it in an auxiliary buffer
        f.addCode(c.if(
            c.getLocal("r"),
            c.setLocal("rr", c.getLocal("r")),
            c.setLocal("rr", Raux)
        ));

        // Copy
        f.addCode(c.call(prefix + "_copy", c.getLocal("x"), R));
        f.addCode(c.call(prefix + "_copy", c.getLocal("y"), Y));
        f.addCode(c.call(prefix + "_zero", C));
        f.addCode(c.call(prefix + "_zero", R1));


        f.addCode(c.setLocal("eX", c.i32_const(n8-1)));
        f.addCode(c.setLocal("eY", c.i32_const(n8-1)));

        // while (eY>3)&&(Y[eY]==0) ey--;
        f.addCode(c.block(c.loop(
            c.br_if(
                1,
                c.i32_or(
                    c.i32_load8_u(
                        c.i32_add(Y , c.getLocal("eY")),
                        0,
                        0
                    ),
                    c.i32_eq(
                        c.getLocal("eY"),
                        c.i32_const(3)
                    )
                )
            ),
            c.setLocal("eY", c.i32_sub(c.getLocal("eY"), c.i32_const(1))),
            c.br(0)
        )));

        f.addCode(
            c.setLocal(
                "sy",
                c.i64_add(
                    c.i64_load32_u(
                        c.i32_sub(
                            c.i32_add( Y, c.getLocal("eY")),
                            c.i32_const(3)
                        ),
                        0,
                        0
                    ),
                    c.i64_const(1)
                )
            )
        );

        // Force a divide by 0 if quotien is 0
        f.addCode(
            c.if(
                c.i64_eq(
                    c.getLocal("sy"),
                    c.i64_const(1)
                ),
                c.drop(c.i64_div_u(c.i64_const(0), c.i64_const(0)))
            )
        );

        f.addCode(c.block(c.loop(

            // while (eX>7)&&(Y[eX]==0) ex--;
            c.block(c.loop(
                c.br_if(
                    1,
                    c.i32_or(
                        c.i32_load8_u(
                            c.i32_add(R , c.getLocal("eX")),
                            0,
                            0
                        ),
                        c.i32_eq(
                            c.getLocal("eX"),
                            c.i32_const(7)
                        )
                    )
                ),
                c.setLocal("eX", c.i32_sub(c.getLocal("eX"), c.i32_const(1))),
                c.br(0)
            )),

            c.setLocal(
                "sx",
                c.i64_load(
                    c.i32_sub(
                        c.i32_add( R, c.getLocal("eX")),
                        c.i32_const(7)
                    ),
                    0,
                    0
                )
            ),

            c.setLocal(
                "sx",
                c.i64_div_u(
                    c.getLocal("sx"),
                    c.getLocal("sy")
                )
            ),
            c.setLocal(
                "ec",
                c.i32_sub(
                    c.i32_sub(
                        c.getLocal("eX"),
                        c.getLocal("eY")
                    ),
                    c.i32_const(4)
                )
            ),

            // While greater than 32 bits or ec is neg, shr and inc exp
            c.block(c.loop(
                c.br_if(
                    1,
                    c.i32_and(
                        c.i64_eqz(
                            c.i64_and(
                                c.getLocal("sx"),
                                c.i64_const("0xFFFFFFFF00000000")
                            )
                        ),
                        c.i32_ge_s(
                            c.getLocal("ec"),
                            c.i32_const(0)
                        )
                    )
                ),

                c.setLocal(
                    "sx",
                    c.i64_shr_u(
                        c.getLocal("sx"),
                        c.i64_const(8)
                    )
                ),

                c.setLocal(
                    "ec",
                    c.i32_add(
                        c.getLocal("ec"),
                        c.i32_const(1)
                    )
                ),
                c.br(0)
            )),

            c.if(
                c.i64_eqz(c.getLocal("sx")),
                [
                    ...c.br_if(
                        2,
                        c.i32_eqz(c.call(prefix + "_gte", R, Y))
                    ),
                    ...c.setLocal("sx", c.i64_const(1)),
                    ...c.setLocal("ec", c.i32_const(0))
                ]
            ),

            c.call(prefix + "__mul1", Y, c.getLocal("sx"), R2),
            c.drop(c.call(
                prefix + "_sub",
                R,
                c.i32_sub(R2, c.getLocal("ec")),
                R
            )),
            c.call(
                prefix + "__add1",
                c.i32_add(C, c.getLocal("ec")),
                c.getLocal("sx")
            ),
            c.br(0)
        )));
    }

    function buildInverseMod() {

        const f = module.addFunction(prefix+"_inverseMod");
        f.addParam("px", "i32");
        f.addParam("pm", "i32");
        f.addParam("pr", "i32");
        f.addLocal("t", "i32");
        f.addLocal("newt", "i32");
        f.addLocal("r", "i32");
        f.addLocal("qq", "i32");
        f.addLocal("qr", "i32");
        f.addLocal("newr", "i32");
        f.addLocal("swp", "i32");
        f.addLocal("x", "i32");
        f.addLocal("signt", "i32");
        f.addLocal("signnewt", "i32");
        f.addLocal("signx", "i32");

        const c = f.getCodeBuilder();

        const aux1 = c.i32_const(module.alloc(n8));
        const aux2 = c.i32_const(module.alloc(n8));
        const aux3 = c.i32_const(module.alloc(n8));
        const aux4 = c.i32_const(module.alloc(n8));
        const aux5 = c.i32_const(module.alloc(n8));
        const aux6 = c.i32_const(module.alloc(n8));
        const mulBuff = c.i32_const(module.alloc(n8*2));
        const aux7 = c.i32_const(module.alloc(n8));

        f.addCode(
            c.setLocal("t", aux1),
            c.call(prefix + "_zero", aux1),
            c.setLocal("signt", c.i32_const(0)),
        );

        f.addCode(
            c.setLocal("r", aux2),
            c.call(prefix + "_copy", c.getLocal("pm"), aux2)
        );

        f.addCode(
            c.setLocal("newt", aux3),
            c.call(prefix + "_one", aux3),
            c.setLocal("signnewt", c.i32_const(0)),
        );

        f.addCode(
            c.setLocal("newr", aux4),
            c.call(prefix + "_copy", c.getLocal("px"), aux4)
        );




        f.addCode(c.setLocal("qq", aux5));
        f.addCode(c.setLocal("qr", aux6));
        f.addCode(c.setLocal("x", aux7));

        f.addCode(c.block(c.loop(
            c.br_if(
                1,
                c.call(prefix + "_isZero", c.getLocal("newr") )
            ),
            c.call(prefix + "_div", c.getLocal("r"), c.getLocal("newr"), c.getLocal("qq"), c.getLocal("qr")),

            c.call(prefix + "_mul", c.getLocal("qq"), c.getLocal("newt"), mulBuff),

            c.if(
                c.getLocal("signt"),
                c.if(
                    c.getLocal("signnewt"),
                    c.if (
                        c.call(prefix + "_gte", mulBuff, c.getLocal("t")),
                        [
                            ...c.drop(c.call(prefix + "_sub", mulBuff, c.getLocal("t"), c.getLocal("x"))),
                            ...c.setLocal("signx", c.i32_const(0))
                        ],
                        [
                            ...c.drop(c.call(prefix + "_sub", c.getLocal("t"), mulBuff, c.getLocal("x"))),
                            ...c.setLocal("signx", c.i32_const(1))
                        ],
                    ),
                    [
                        ...c.drop(c.call(prefix + "_add", mulBuff, c.getLocal("t"), c.getLocal("x"))),
                        ...c.setLocal("signx", c.i32_const(1))
                    ]
                ),
                c.if(
                    c.getLocal("signnewt"),
                    [
                        ...c.drop(c.call(prefix + "_add", mulBuff, c.getLocal("t"), c.getLocal("x"))),
                        ...c.setLocal("signx", c.i32_const(0))
                    ],
                    c.if (
                        c.call(prefix + "_gte", c.getLocal("t"), mulBuff),
                        [
                            ...c.drop(c.call(prefix + "_sub", c.getLocal("t"), mulBuff, c.getLocal("x"))),
                            ...c.setLocal("signx", c.i32_const(0))
                        ],
                        [
                            ...c.drop(c.call(prefix + "_sub", mulBuff, c.getLocal("t"), c.getLocal("x"))),
                            ...c.setLocal("signx", c.i32_const(1))
                        ]
                    )
                )
            ),

            c.setLocal("swp", c.getLocal("t")),
            c.setLocal("t", c.getLocal("newt")),
            c.setLocal("newt", c.getLocal("x")),
            c.setLocal("x", c.getLocal("swp")),

            c.setLocal("signt", c.getLocal("signnewt")),
            c.setLocal("signnewt", c.getLocal("signx")),

            c.setLocal("swp", c.getLocal("r")),
            c.setLocal("r", c.getLocal("newr")),
            c.setLocal("newr", c.getLocal("qr")),
            c.setLocal("qr", c.getLocal("swp")),

            c.br(0)
        )));

        f.addCode(c.if(
            c.getLocal("signt"),
            c.drop(c.call(prefix + "_sub", c.getLocal("pm"), c.getLocal("t"), c.getLocal("pr"))),
            c.call(prefix + "_copy", c.getLocal("t"), c.getLocal("pr"))
        ));
    }


    buildCopy();
    buildZero();
    buildIsZero();
    buildOne();
    buildEq();
    buildGte();
    buildAdd();
    buildSub();
    buildMul();
    buildSquare();
    buildSquareOld();
    buildDiv();
    buildInverseMod();
    module.exportFunction(prefix+"_copy");
    module.exportFunction(prefix+"_zero");
    module.exportFunction(prefix+"_one");
    module.exportFunction(prefix+"_isZero");
    module.exportFunction(prefix+"_eq");
    module.exportFunction(prefix+"_gte");
    module.exportFunction(prefix+"_add");
    module.exportFunction(prefix+"_sub");
    module.exportFunction(prefix+"_mul");
    module.exportFunction(prefix+"_square");
    module.exportFunction(prefix+"_squareOld");
    module.exportFunction(prefix+"_div");
    module.exportFunction(prefix+"_inverseMod");

    return prefix;
};

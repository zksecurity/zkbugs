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

module.exports = function buildMulAcc(windowSize, prefix, curvePrefix, scalarPrefix) {
    const pointN64 = module.modules[curvePrefix].n64;
    const pointN8 = pointN64*8;
    const scalarN64 = module.modules[scalarPrefix].n64;
    const scalarN8 = scalarN64*8;

    function buildMultiMul64() {
        const f = module.addFunction(prefix+"__multimul");
        f.addParam("pscalars", "i32");
        f.addParam("ppoints", "i32");
        f.addParam("pr", "i32");
        f.addLocal("sel");
        f.addLocal("ppminusone");

        const c = f.getCodeBuilder();

        f.addCode(c.setLocal("sel", c.i32_const(0)));
        f.addCode(c.setLocal(
            "ppminusone",
            c.sub(
                c.getLocal("ppoints"),
                c.i32_const(pointN8)
            )
        ));

        for (let i=0; i<64; i++) {
            for (let s=0; s<windowSize; s++) {
                f.addCode(c.setLocal(
                    "sel",
                    c.i32_or(
                        c.getLocal("sel"),
                        c.i32_and(
                            c.i32_wrap_i64(
                                c.i64_rotl(
                                    c.i64_load(
                                        c.getLocal("pscalars"),
                                        i*scalarN64
                                    ),
                                    c.i64_const(i+s+1)
                                )
                            ),
                            c.i32_const(1<<s)
                        )
                    )
                ));

                f.addCode(c.if(
                    c.getLocal("sel"),
                    c.call(
                        curvePrefix + "_add",
                        c.i32_add(
                            c.getLocal("ppminusone"),
                            c.i32_mul(
                                c.getLocal("sel"),
                                c.i32_const(pointN8)
                            )
                        )
                    )
                ));

            }

        }

    }


    function buildMultiMul() {
        buildMultiMul64();
        const f = module.addFunction(prefix+"__multimul");
        f.addParam("pscalars", "i32");
        f.addParam("ppoints", "i32");
        f.addParam("pr", "i32");

        const c = f.getCodeBuilder();

        f.addCode(c.call(prefix + "_zero", c.getLocal("pr")));

        for (let i=0; i<scalarN64; i++) {
            if (i>0) f.addCode(c.call(curvePrefix + "_double"), c.getLocal("pr"));
            f.addCode(c.call(
                prefix + "__multimul64",
                c.i32_add(c.getLocal("pscalars"), c.const(i*8)),
                c.getLocal("ppoints")
            ));
        }

    }

    function buildMulAcc() {
        buildMultiMul();
        const f = module.addFunction(prefix+"_mulacc");
        f.addParam("pscalars", "i32");
        f.addParam("ppoints", "i32");
        f.addParam("n", "i32");
        f.addParam("pr", "i32");
        f.addLocal("inc", "i32");
        f.addLocal("pp", "i32");
        f.addLocal("ps", "i32");
        f.addLocal("last", "i32");

        const c = f.getCodeBuilder();

        const aux = c.i32_const(module.alloc(pointN8));

        // Check n is windowSize multiple
        f.addCode(c.if(
            c.eqz(
                c.i32_mod(
                    c.getLocal("n"),
                    c.i32_const(windowSize)
                )
            ),
            c.unreachable()
        ));

        // Set zero the output
        f.addCode(c.call(prefix + "_zero", c.getLocal("pr")));

        // Calculate the increment
        f.addCode(c.setLocal(
            "incPoint",
            c.i32_const(((1 << windowSize)-1) *pointN8 )
        ));

        f.addCode(c.setLocal(
            "incScalar",
            c.i32_const(windowSize *scalarN8 )
        ));

        // Calculate Initial
        f.addCode(c.setLocal(
            "pp",
            c.getLocal("ppoints")
        ));

        f.addCode(c.setLocal(
            "ps",
            c.getLocal("pscalars")
        ));

        // Calculate Last
        f.addCode(c.setLocal(
            "last",
            c.i32_mul(
                c.getLocal("incPoint"),
                c.getLocal("n")
            )
        ));

        f.addCode(c.block(c.loop(
            c.br_if(
                1,
                c.i32_eq(
                    c.getLocal("pp"),
                    c.getLocal("last")
                )
            ),

            c.call(prefix + "__multimul", c.getLocal("ps"), c.getLocal("pp"), aux),
            c.call(curvePrefix + "_add", aux, c.getLocal("pr"), c.getLocal("pr")),

            c.setLocal(
                "pp",
                c.add(
                    c.getLocal("pp"),
                    c.getLocal("incPoint")
                )
            ),
            c.setLocal(
                "ps",
                c.add(
                    c.getLocal("ps"),
                    c.getLocal("incScalar")
                )
            ),
            c.br(0)
        )));

    }

    buildMulAcc();
    module.exportFunction(prefix+"_mulacc");


};

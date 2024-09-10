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

module.exports = function buildPol(module, prefix, prefixField) {

    const n64 = module.modules[prefixField].n64;
    const n8 = n64*8;


    function buildZero() {
        const f = module.addFunction(prefix+"_zero");
        f.addParam("px", "i32");
        f.addParam("n", "i32");
        f.addLocal("lastp", "i32");
        f.addLocal("p", "i32");

        const c = f.getCodeBuilder();

        f.addCode(
            c.setLocal("p", c.getLocal("px")),
            c.setLocal(
                "lastp",
                c.i32_add(
                    c.getLocal("px"),
                    c.i32_mul(
                        c.getLocal("n"),
                        c.i32_const(n8)
                    )
                )
            ),
            c.block(c.loop(
                c.br_if(
                    1,
                    c.i32_eq(
                        c.getLocal("p"),
                        c.getLocal("lastp")
                    )
                ),
                c.call(prefixField + "_zero", c.getLocal("p")),
                c.setLocal("p", c.i32_add(c.getLocal("p"), c.i32_const(n8))),
                c.br(0)
            ))
        );
    }

    function buildConstructLC() {
        const f = module.addFunction(prefix+"_constructLC");
        f.addParam("ppolynomials", "i32");
        f.addParam("psignals", "i32");
        f.addParam("nSignals", "i32");
        f.addParam("pres", "i32");
        f.addLocal("i", "i32");
        f.addLocal("j", "i32");
        f.addLocal("pp", "i32");
        f.addLocal("ps", "i32");
        f.addLocal("pd", "i32");
        f.addLocal("ncoefs", "i32");

        const c = f.getCodeBuilder();

        const aux = c.i32_const(module.alloc(n8));

        f.addCode(
            c.setLocal("i", c.i32_const(0)),
            c.setLocal("pp", c.getLocal("ppolynomials")),
            c.setLocal("ps", c.getLocal("psignals")),
            c.block(c.loop(
                c.br_if(
                    1,
                    c.i32_eq(
                        c.getLocal("i"),
                        c.getLocal("nSignals")
                    )
                ),

                c.setLocal("ncoefs", c.i32_load(c.getLocal("pp"))),
                c.setLocal("pp", c.i32_add(c.getLocal("pp"), c.i32_const(4))),

                c.setLocal("j", c.i32_const(0)),
                c.block(c.loop(
                    c.br_if(
                        1,
                        c.i32_eq(
                            c.getLocal("j"),
                            c.getLocal("ncoefs")
                        )
                    ),

                    c.setLocal(
                        "pd",
                        c.i32_add(
                            c.getLocal("pres"),
                            c.i32_mul(
                                c.i32_load(c.getLocal("pp")),
                                c.i32_const(n8)
                            )
                        )
                    ),

                    c.setLocal("pp", c.i32_add(c.getLocal("pp"), c.i32_const(4))),


                    c.call(
                        prefixField + "_mul",
                        c.getLocal("ps"),
                        c.getLocal("pp"),
                        aux
                    ),

                    c.call(
                        prefixField + "_add",
                        aux,
                        c.getLocal("pd"),
                        c.getLocal("pd")
                    ),

                    c.setLocal("pp", c.i32_add(c.getLocal("pp"), c.i32_const(n8))),
                    c.setLocal("j", c.i32_add(c.getLocal("j"), c.i32_const(1))),
                    c.br(0)
                )),

                c.setLocal("ps", c.i32_add(c.getLocal("ps"), c.i32_const(n8))),
                c.setLocal("i", c.i32_add(c.getLocal("i"), c.i32_const(1))),
                c.br(0)
            ))
        );

    }

    buildZero();
    buildConstructLC();


    module.exportFunction(prefix + "_zero");
    module.exportFunction(prefix + "_constructLC");

    return prefix;




};

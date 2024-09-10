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

const buildTimesScalarNAF = require("./build_timesscalarnaf");
//const buildTimesScalar = require("./build_timesscalar");
const buildBatchConvertion = require("./build_batchconvertion");
const buildMultiexp = require("./build_multiexp");

module.exports = function buildCurve(module, prefix, prefixField, pB) {


    const n64 = module.modules[prefixField].n64;
    const n8 = n64*8;

    if (module.modules[prefix]) return prefix;  // already builded
    module.modules[prefix] = {
        n64: n64*3
    };

    function buildIsZero() {
        const f = module.addFunction(prefix + "_isZero");
        f.addParam("p1", "i32");
        f.setReturnType("i32");

        const c = f.getCodeBuilder();

        f.addCode(c.call(
            prefixField + "_isZero",
            c.i32_add(
                c.getLocal("p1"),
                c.i32_const(n8*2)
            )
        ));
    }
    function buildIsZeroAffine() {
        const f = module.addFunction(prefix + "_isZeroAffine");
        f.addParam("p1", "i32");
        f.setReturnType("i32");

        const c = f.getCodeBuilder();

        f.addCode(
            c.i32_and(
                c.call(
                    prefixField + "_isZero",
                    c.getLocal("p1")
                ),
                c.call(
                    prefixField + "_isZero",
                    c.i32_add(
                        c.getLocal("p1"),
                        c.i32_const(n8)
                    )
                )
            )
        );
    }

    function buildCopy() {
        const f = module.addFunction(prefix + "_copy");
        f.addParam("ps", "i32");
        f.addParam("pd", "i32");

        const c = f.getCodeBuilder();

        for (let i=0; i<n64*3; i++) {
            f.addCode(
                c.i64_store(
                    c.getLocal("pd"),
                    i*8,
                    c.i64_load(
                        c.getLocal("ps"),
                        i*8
                    )
                )
            );
        }
    }


    function buildCopyAffine() {
        const f = module.addFunction(prefix + "_copyAffine");
        f.addParam("ps", "i32");
        f.addParam("pd", "i32");

        const c = f.getCodeBuilder();

        for (let i=0; i<n64*2; i++) {
            f.addCode(
                c.i64_store(
                    c.getLocal("pd"),
                    i*8,
                    c.i64_load(
                        c.getLocal("ps"),
                        i*8
                    )
                )
            );
        }

    }


    function buildZero() {
        const f = module.addFunction(prefix + "_zero");
        f.addParam("pr", "i32");

        const c = f.getCodeBuilder();

        f.addCode(c.call(
            prefixField + "_zero",
            c.getLocal("pr")
        ));

        f.addCode(c.call(
            prefixField + "_one",
            c.i32_add(
                c.getLocal("pr"),
                c.i32_const(n8)
            )
        ));

        f.addCode(c.call(
            prefixField + "_zero",
            c.i32_add(
                c.getLocal("pr"),
                c.i32_const(n8*2)
            )
        ));
    }


    function buildZeroAffine() {
        const f = module.addFunction(prefix + "_zeroAffine");
        f.addParam("pr", "i32");

        const c = f.getCodeBuilder();

        f.addCode(c.call(
            prefixField + "_zero",
            c.getLocal("pr")
        ));

        f.addCode(c.call(
            prefixField + "_zero",
            c.i32_add(
                c.getLocal("pr"),
                c.i32_const(n8)
            )
        ));
    }

    function buildEq() {
        const f = module.addFunction(prefix + "_eq");
        f.addParam("p1", "i32");
        f.addParam("p2", "i32");
        f.setReturnType("i32");
        f.addLocal("z1", "i32");
        f.addLocal("z2", "i32");

        const c = f.getCodeBuilder();

        const x1 = c.getLocal("p1");
        const y1 = c.i32_add(c.getLocal("p1"), c.i32_const(n8));
        f.addCode(c.setLocal("z1", c.i32_add(c.getLocal("p1"), c.i32_const(n8*2))));
        const z1 = c.getLocal("z1");
        const x2 = c.getLocal("p2");
        const y2 = c.i32_add(c.getLocal("p2"), c.i32_const(n8));
        f.addCode(c.setLocal("z2", c.i32_add(c.getLocal("p2"), c.i32_const(n8*2))));
        const z2 = c.getLocal("z2");

        const Z1Z1 = c.i32_const(module.alloc(n8));
        const Z2Z2 = c.i32_const(module.alloc(n8));
        const U1 = c.i32_const(module.alloc(n8));
        const U2 = c.i32_const(module.alloc(n8));
        const Z1_cubed = c.i32_const(module.alloc(n8));
        const Z2_cubed = c.i32_const(module.alloc(n8));
        const S1 = c.i32_const(module.alloc(n8));
        const S2 = c.i32_const(module.alloc(n8));


        f.addCode(
            c.if(
                c.call(prefix + "_isZero", c.getLocal("p1")),
                c.ret( c.call(prefix + "_isZero", c.getLocal("p2"))),
            ),
            c.if(
                c.call(prefix + "_isZero", c.getLocal("p2")),
                c.ret(c.i32_const(0))
            ),
            c.if(
                c.call(prefixField + "_isOne", z1),
                c.ret(c.call(prefix + "_eqMixed", c.getLocal("p2"), c.getLocal("p1")))
            ),
            c.if(
                c.call(prefixField + "_isOne", z2),
                c.ret(c.call(prefix + "_eqMixed", c.getLocal("p1"), c.getLocal("p2")))
            ),

            c.call(prefixField + "_square", z1, Z1Z1),
            c.call(prefixField + "_square", z2, Z2Z2),
            c.call(prefixField + "_mul", x1, Z2Z2, U1),
            c.call(prefixField + "_mul", x2, Z1Z1, U2),
            c.call(prefixField + "_mul", z1, Z1Z1, Z1_cubed),
            c.call(prefixField + "_mul", z2, Z2Z2, Z2_cubed),
            c.call(prefixField + "_mul", y1, Z2_cubed, S1),
            c.call(prefixField + "_mul", y2, Z1_cubed, S2),

            c.if(
                c.call(prefixField + "_eq", U1, U2),
                c.if(
                    c.call(prefixField + "_eq", S1, S2),
                    c.ret(c.i32_const(1))
                )
            ),
            c.ret(c.i32_const(0))
        );
    }


    function buildEqMixed() {
        const f = module.addFunction(prefix + "_eqMixed");
        f.addParam("p1", "i32");
        f.addParam("p2", "i32");
        f.setReturnType("i32");
        f.addLocal("z1", "i32");

        const c = f.getCodeBuilder();

        const x1 = c.getLocal("p1");
        const y1 = c.i32_add(c.getLocal("p1"), c.i32_const(n8));
        f.addCode(c.setLocal("z1", c.i32_add(c.getLocal("p1"), c.i32_const(n8*2))));
        const z1 = c.getLocal("z1");
        const x2 = c.getLocal("p2");
        const y2 = c.i32_add(c.getLocal("p2"), c.i32_const(n8));

        const Z1Z1 = c.i32_const(module.alloc(n8));
        const U2 = c.i32_const(module.alloc(n8));
        const Z1_cubed = c.i32_const(module.alloc(n8));
        const S2 = c.i32_const(module.alloc(n8));

        f.addCode(
            c.if(
                c.call(prefix + "_isZero", c.getLocal("p1")),
                c.ret( c.call(prefix + "_isZeroAffine", c.getLocal("p2"))),
            ),
            c.if(
                c.call(prefix + "_isZeroAffine", c.getLocal("p2")),
                c.ret(c.i32_const(0))
            ),
            c.if(
                c.call(prefixField + "_isOne", z1),
                c.ret(c.call(prefix + "_eqAffine", c.getLocal("p1"), c.getLocal("p2")))
            ),
            c.call(prefixField + "_square", z1, Z1Z1),
            c.call(prefixField + "_mul", x2, Z1Z1, U2),
            c.call(prefixField + "_mul", z1, Z1Z1, Z1_cubed),
            c.call(prefixField + "_mul", y2, Z1_cubed, S2),

            c.if(
                c.call(prefixField + "_eq", x1, U2),
                c.if(
                    c.call(prefixField + "_eq", y1, S2),
                    c.ret(c.i32_const(1))
                )
            ),
            c.ret(c.i32_const(0))
        );
    }

    function buildDouble() {
        const f = module.addFunction(prefix + "_double");
        f.addParam("p1", "i32");
        f.addParam("pr", "i32");

        const c = f.getCodeBuilder();

        const x = c.getLocal("p1");
        const y = c.i32_add(c.getLocal("p1"), c.i32_const(n8));
        const z = c.i32_add(c.getLocal("p1"), c.i32_const(n8*2));
        const x3 = c.getLocal("pr");
        const y3 = c.i32_add(c.getLocal("pr"), c.i32_const(n8));
        const z3 = c.i32_add(c.getLocal("pr"), c.i32_const(n8*2));

        const A = c.i32_const(module.alloc(n8));
        const B = c.i32_const(module.alloc(n8));
        const C = c.i32_const(module.alloc(n8));
        const D = c.i32_const(module.alloc(n8));
        const E = c.i32_const(module.alloc(n8));
        const F = c.i32_const(module.alloc(n8));
        const G = c.i32_const(module.alloc(n8));
        const eightC = c.i32_const(module.alloc(n8));

        f.addCode(
            c.if(
                c.call(prefix + "_isZero", c.getLocal("p1")),
                [
                    ...c.call(prefix + "_copy", c.getLocal("p1"), c.getLocal("pr")),
                    ...c.ret([])
                ]
            ),
            c.if(
                c.call(prefixField + "_isOne", z),
                [
                    ...c.ret(c.call(prefix + "_doubleAffine", c.getLocal("p1"), c.getLocal("pr"))),
                    ...c.ret([])
                ]
            ),

            c.call(prefixField + "_square", x, A),
            c.call(prefixField + "_square", y, B),
            c.call(prefixField + "_square", B, C),

            c.call(prefixField + "_add", x, B, D),
            c.call(prefixField + "_square", D, D),
            c.call(prefixField + "_sub", D, A, D),
            c.call(prefixField + "_sub", D, C, D),
            c.call(prefixField + "_add", D, D, D),

            c.call(prefixField + "_add", A, A, E),
            c.call(prefixField + "_add", E, A, E),
            c.call(prefixField + "_square", E, F),

            c.call(prefixField + "_mul", y, z, G),

            c.call(prefixField + "_add", D, D, x3),
            c.call(prefixField + "_sub", F, x3, x3),

            c.call(prefixField + "_add", C, C, eightC),
            c.call(prefixField + "_add", eightC, eightC, eightC),
            c.call(prefixField + "_add", eightC, eightC, eightC),

            c.call(prefixField + "_sub", D, x3, y3),
            c.call(prefixField + "_mul", y3, E, y3),
            c.call(prefixField + "_sub", y3, eightC, y3),

            c.call(prefixField + "_add", G, G, z3),
        );
    }


    function buildDoubleAffine() {
        const f = module.addFunction(prefix + "_doubleAffine");
        f.addParam("p1", "i32");
        f.addParam("pr", "i32");

        const c = f.getCodeBuilder();

        const x = c.getLocal("p1");
        const y = c.i32_add(c.getLocal("p1"), c.i32_const(n8));
        const x3 = c.getLocal("pr");
        const y3 = c.i32_add(c.getLocal("pr"), c.i32_const(n8));
        const z3 = c.i32_add(c.getLocal("pr"), c.i32_const(n8*2));

        const XX = c.i32_const(module.alloc(n8));
        const YY = c.i32_const(module.alloc(n8));
        const YYYY = c.i32_const(module.alloc(n8));
        const S = c.i32_const(module.alloc(n8));
        const M = c.i32_const(module.alloc(n8));
        const eightYYYY = c.i32_const(module.alloc(n8));

        f.addCode(
            c.if(
                c.call(prefix + "_isZeroAffine", c.getLocal("p1")),
                [
                    ...c.call(prefix + "_toJacobian", c.getLocal("p1"), c.getLocal("pr")),
                    ...c.ret([])
                ]
            ),

            // XX = X1^2
            c.call(prefixField + "_square", x, XX),

            // YY = Y1^2
            c.call(prefixField + "_square", y, YY),

            // YYYY = YY^2
            c.call(prefixField + "_square", YY, YYYY),

            // S = 2*((X1+YY)^2-XX-YYYY)
            c.call(prefixField + "_add", x, YY, S),
            c.call(prefixField + "_square", S, S),
            c.call(prefixField + "_sub", S, XX, S),
            c.call(prefixField + "_sub", S, YYYY, S),
            c.call(prefixField + "_add", S, S, S),

            // M = 3*XX+a  (Hera a=0)
            c.call(prefixField + "_add", XX, XX, M),
            c.call(prefixField + "_add", M, XX, M),

            // Z3 = 2*Y1
            c.call(prefixField + "_add", y, y, z3),

            // T = M^2-2*S
            // X3 = T
            c.call(prefixField + "_square", M, x3),
            c.call(prefixField + "_sub", x3, S, x3),
            c.call(prefixField + "_sub", x3, S, x3),

            // Y3 = M*(S-T)-8*YYYY
            c.call(prefixField + "_add", YYYY, YYYY, eightYYYY),
            c.call(prefixField + "_add", eightYYYY, eightYYYY, eightYYYY),
            c.call(prefixField + "_add", eightYYYY, eightYYYY, eightYYYY),
            c.call(prefixField + "_sub", S, x3, y3),
            c.call(prefixField + "_mul", y3, M, y3),
            c.call(prefixField + "_sub", y3, eightYYYY, y3),
        );
    }


    function buildEqAffine() {
        const f = module.addFunction(prefix + "_eqAffine");
        f.addParam("p1", "i32");
        f.addParam("p2", "i32");
        f.setReturnType("i32");
        f.addLocal("z1", "i32");

        const c = f.getCodeBuilder();

        f.addCode(
            c.ret(c.i32_and(
                c.call(
                    prefixField + "_eq",
                    c.getLocal("p1"),
                    c.getLocal("p2")
                ),
                c.call(
                    prefixField + "_eq",
                    c.i32_add(c.getLocal("p1"), c.i32_const(n8)),
                    c.i32_add(c.getLocal("p2"), c.i32_const(n8))
                )
            ))
        );
    }

    function buildToMontgomery() {
        const f = module.addFunction(prefix + "_toMontgomery");
        f.addParam("p1", "i32");
        f.addParam("pr", "i32");

        const c = f.getCodeBuilder();

        f.addCode(c.call(
            prefixField + "_toMontgomery",
            c.getLocal("p1"),
            c.getLocal("pr")
        ));
        for (let i=1; i<3; i++) {
            f.addCode(c.call(
                prefixField + "_toMontgomery",
                c.i32_add(c.getLocal("p1"), c.i32_const(i*n8)),
                c.i32_add(c.getLocal("pr"), c.i32_const(i*n8))
            ));
        }
    }

    function buildToMontgomeryAffine() {
        const f = module.addFunction(prefix + "_toMontgomeryAffine");
        f.addParam("p1", "i32");
        f.addParam("pr", "i32");

        const c = f.getCodeBuilder();

        f.addCode(c.call(
            prefixField + "_toMontgomery",
            c.getLocal("p1"),
            c.getLocal("pr")
        ));
        for (let i=1; i<2; i++) {
            f.addCode(c.call(
                prefixField + "_toMontgomery",
                c.i32_add(c.getLocal("p1"), c.i32_const(i*n8)),
                c.i32_add(c.getLocal("pr"), c.i32_const(i*n8))
            ));
        }
    }

    function buildFromMontgomery() {
        const f = module.addFunction(prefix + "_fromMontgomery");
        f.addParam("p1", "i32");
        f.addParam("pr", "i32");

        const c = f.getCodeBuilder();

        f.addCode(c.call(
            prefixField + "_fromMontgomery",
            c.getLocal("p1"),
            c.getLocal("pr")
        ));
        for (let i=1; i<3; i++) {
            f.addCode(c.call(
                prefixField + "_fromMontgomery",
                c.i32_add(c.getLocal("p1"), c.i32_const(i*n8)),
                c.i32_add(c.getLocal("pr"), c.i32_const(i*n8))
            ));
        }
    }


    function buildFromMontgomeryAffine() {
        const f = module.addFunction(prefix + "_fromMontgomeryAffine");
        f.addParam("p1", "i32");
        f.addParam("pr", "i32");

        const c = f.getCodeBuilder();

        f.addCode(c.call(
            prefixField + "_fromMontgomery",
            c.getLocal("p1"),
            c.getLocal("pr")
        ));
        for (let i=1; i<2; i++) {
            f.addCode(c.call(
                prefixField + "_fromMontgomery",
                c.i32_add(c.getLocal("p1"), c.i32_const(i*n8)),
                c.i32_add(c.getLocal("pr"), c.i32_const(i*n8))
            ));
        }
    }

    function buildAdd() {

        const f = module.addFunction(prefix + "_add");
        f.addParam("p1", "i32");
        f.addParam("p2", "i32");
        f.addParam("pr", "i32");
        f.addLocal("z1", "i32");
        f.addLocal("z2", "i32");

        const c = f.getCodeBuilder();

        const x1 = c.getLocal("p1");
        const y1 = c.i32_add(c.getLocal("p1"), c.i32_const(n8));
        f.addCode(c.setLocal("z1", c.i32_add(c.getLocal("p1"), c.i32_const(n8*2))));
        const z1 = c.getLocal("z1");
        const x2 = c.getLocal("p2");
        const y2 = c.i32_add(c.getLocal("p2"), c.i32_const(n8));
        f.addCode(c.setLocal("z2", c.i32_add(c.getLocal("p2"), c.i32_const(n8*2))));
        const z2 = c.getLocal("z2");
        const x3 = c.getLocal("pr");
        const y3 = c.i32_add(c.getLocal("pr"), c.i32_const(n8));
        const z3 = c.i32_add(c.getLocal("pr"), c.i32_const(n8*2));

        const Z1Z1 = c.i32_const(module.alloc(n8));
        const Z2Z2 = c.i32_const(module.alloc(n8));
        const U1 = c.i32_const(module.alloc(n8));
        const U2 = c.i32_const(module.alloc(n8));
        const Z1_cubed = c.i32_const(module.alloc(n8));
        const Z2_cubed = c.i32_const(module.alloc(n8));
        const S1 = c.i32_const(module.alloc(n8));
        const S2 = c.i32_const(module.alloc(n8));
        const H = c.i32_const(module.alloc(n8));
        const S2_minus_S1 = c.i32_const(module.alloc(n8));
        const I = c.i32_const(module.alloc(n8));
        const J = c.i32_const(module.alloc(n8));
        const r = c.i32_const(module.alloc(n8));
        const r2 = c.i32_const(module.alloc(n8));
        const V = c.i32_const(module.alloc(n8));
        const V2 = c.i32_const(module.alloc(n8));
        const S1_J2 = c.i32_const(module.alloc(n8));

        f.addCode(
            c.if(
                c.call(prefix + "_isZero", c.getLocal("p1")),
                [
                    ...c.call(prefix + "_copy", c.getLocal("p2"), c.getLocal("pr")),
                    ...c.ret([])
                ]
            ),
            c.if(
                c.call(prefix + "_isZero", c.getLocal("p2")),
                [
                    ...c.call(prefix + "_copy", c.getLocal("p1"), c.getLocal("pr")),
                    ...c.ret([])
                ]
            ),
            c.if(
                c.call(prefixField + "_isOne", z1),
                [
                    ...c.call(prefix + "_addMixed", x2, x1, x3),
                    ...c.ret([])
                ]
            ),
            c.if(
                c.call(prefixField + "_isOne", z2),
                [
                    ...c.call(prefix + "_addMixed", x1, x2, x3),
                    ...c.ret([])
                ]
            ),
            c.call(prefixField + "_square", z1, Z1Z1),
            c.call(prefixField + "_square", z2, Z2Z2),
            c.call(prefixField + "_mul", x1, Z2Z2, U1),
            c.call(prefixField + "_mul", x2, Z1Z1, U2),
            c.call(prefixField + "_mul", z1, Z1Z1, Z1_cubed),
            c.call(prefixField + "_mul", z2, Z2Z2, Z2_cubed),
            c.call(prefixField + "_mul", y1, Z2_cubed, S1),
            c.call(prefixField + "_mul", y2, Z1_cubed, S2),

            c.if(
                c.call(prefixField + "_eq", U1, U2),
                c.if(
                    c.call(prefixField + "_eq", S1, S2),
                    [
                        ...c.call(prefix + "_double", c.getLocal("p1"), c.getLocal("pr")),
                        ...c.ret([])
                    ]
                )
            ),

            c.call(prefixField + "_sub", U2, U1, H),
            c.call(prefixField + "_sub", S2, S1, S2_minus_S1),
            c.call(prefixField + "_add", H, H, I),
            c.call(prefixField + "_square", I, I),
            c.call(prefixField + "_mul", H, I, J),
            c.call(prefixField + "_add", S2_minus_S1, S2_minus_S1, r),
            c.call(prefixField + "_mul", U1, I, V),
            c.call(prefixField + "_square", r, r2),
            c.call(prefixField + "_add", V, V, V2),

            c.call(prefixField + "_sub", r2, J, x3),
            c.call(prefixField + "_sub", x3, V2, x3),

            c.call(prefixField + "_mul", S1, J, S1_J2),
            c.call(prefixField + "_add", S1_J2, S1_J2, S1_J2),

            c.call(prefixField + "_sub", V, x3, y3),
            c.call(prefixField + "_mul", y3, r, y3),
            c.call(prefixField + "_sub", y3, S1_J2, y3),

            c.call(prefixField + "_add", z1, z2, z3),
            c.call(prefixField + "_square", z3, z3),
            c.call(prefixField + "_sub", z3, Z1Z1, z3),
            c.call(prefixField + "_sub", z3, Z2Z2, z3),
            c.call(prefixField + "_mul", z3, H, z3),
        );

    }


    function buildAddMixed() {

        const f = module.addFunction(prefix + "_addMixed");
        f.addParam("p1", "i32");
        f.addParam("p2", "i32");
        f.addParam("pr", "i32");
        f.addLocal("z1", "i32");

        const c = f.getCodeBuilder();

        const x1 = c.getLocal("p1");
        const y1 = c.i32_add(c.getLocal("p1"), c.i32_const(n8));
        f.addCode(c.setLocal("z1", c.i32_add(c.getLocal("p1"), c.i32_const(n8*2))));
        const z1 = c.getLocal("z1");
        const x2 = c.getLocal("p2");
        const y2 = c.i32_add(c.getLocal("p2"), c.i32_const(n8));
        const x3 = c.getLocal("pr");
        const y3 = c.i32_add(c.getLocal("pr"), c.i32_const(n8));
        const z3 = c.i32_add(c.getLocal("pr"), c.i32_const(n8*2));

        const Z1Z1 = c.i32_const(module.alloc(n8));
        const U2 = c.i32_const(module.alloc(n8));
        const Z1_cubed = c.i32_const(module.alloc(n8));
        const S2 = c.i32_const(module.alloc(n8));
        const H = c.i32_const(module.alloc(n8));
        const HH = c.i32_const(module.alloc(n8));
        const S2_minus_y1 = c.i32_const(module.alloc(n8));
        const I = c.i32_const(module.alloc(n8));
        const J = c.i32_const(module.alloc(n8));
        const r = c.i32_const(module.alloc(n8));
        const r2 = c.i32_const(module.alloc(n8));
        const V = c.i32_const(module.alloc(n8));
        const V2 = c.i32_const(module.alloc(n8));
        const y1_J2 = c.i32_const(module.alloc(n8));

        f.addCode(
            c.if(
                c.call(prefix + "_isZero", c.getLocal("p1")),
                [
                    ...c.call(prefix + "_copyAffine", c.getLocal("p2"), c.getLocal("pr")),
                    ...c.call(prefixField + "_one", c.i32_add(c.getLocal("pr") , c.i32_const(n8*2))),
                    ...c.ret([])
                ]
            ),
            c.if(
                c.call(prefix + "_isZeroAffine", c.getLocal("p2")),
                [
                    ...c.call(prefix + "_copy", c.getLocal("p1"), c.getLocal("pr")),
                    ...c.ret([])
                ]
            ),
            c.if(
                c.call(prefixField + "_isOne", z1),
                [
                    ...c.call(prefix + "_addAffine", x1, x2, x3),
                    ...c.ret([])
                ]
            ),
            c.call(prefixField + "_square", z1, Z1Z1),
            c.call(prefixField + "_mul", x2, Z1Z1, U2),
            c.call(prefixField + "_mul", z1, Z1Z1, Z1_cubed),
            c.call(prefixField + "_mul", y2, Z1_cubed, S2),

            c.if(
                c.call(prefixField + "_eq", x1, U2),
                c.if(
                    c.call(prefixField + "_eq", y1, S2),
                    [
                        ...c.call(prefix + "_doubleAffine", c.getLocal("p2"), c.getLocal("pr")),
                        ...c.ret([])
                    ]
                )
            ),

            c.call(prefixField + "_sub", U2, x1, H),
            c.call(prefixField + "_sub", S2, y1, S2_minus_y1),
            c.call(prefixField + "_square", H, HH),
            c.call(prefixField + "_add", HH , HH, I),
            c.call(prefixField + "_add", I , I, I),
            c.call(prefixField + "_mul", H, I, J),
            c.call(prefixField + "_add", S2_minus_y1, S2_minus_y1, r),
            c.call(prefixField + "_mul", x1, I, V),
            c.call(prefixField + "_square", r, r2),
            c.call(prefixField + "_add", V, V, V2),

            c.call(prefixField + "_sub", r2, J, x3),
            c.call(prefixField + "_sub", x3, V2, x3),

            c.call(prefixField + "_mul", y1, J, y1_J2),
            c.call(prefixField + "_add", y1_J2, y1_J2, y1_J2),

            c.call(prefixField + "_sub", V, x3, y3),
            c.call(prefixField + "_mul", y3, r, y3),
            c.call(prefixField + "_sub", y3, y1_J2, y3),

            c.call(prefixField + "_add", z1, H, z3),
            c.call(prefixField + "_square", z3, z3),
            c.call(prefixField + "_sub", z3, Z1Z1, z3),
            c.call(prefixField + "_sub", z3, HH, z3),
        );
    }


    function buildAddAffine() {

        const f = module.addFunction(prefix + "_addAffine");
        f.addParam("p1", "i32");
        f.addParam("p2", "i32");
        f.addParam("pr", "i32");
        f.addLocal("z1", "i32");

        const c = f.getCodeBuilder();

        const x1 = c.getLocal("p1");
        const y1 = c.i32_add(c.getLocal("p1"), c.i32_const(n8));
        f.addCode(c.setLocal("z1", c.i32_add(c.getLocal("p1"), c.i32_const(n8*2))));
        const x2 = c.getLocal("p2");
        const y2 = c.i32_add(c.getLocal("p2"), c.i32_const(n8));
        const x3 = c.getLocal("pr");
        const y3 = c.i32_add(c.getLocal("pr"), c.i32_const(n8));
        const z3 = c.i32_add(c.getLocal("pr"), c.i32_const(n8*2));

        const H = c.i32_const(module.alloc(n8));
        const HH = c.i32_const(module.alloc(n8));
        const y2_minus_y1 = c.i32_const(module.alloc(n8));
        const I = c.i32_const(module.alloc(n8));
        const J = c.i32_const(module.alloc(n8));
        const r = c.i32_const(module.alloc(n8));
        const r2 = c.i32_const(module.alloc(n8));
        const V = c.i32_const(module.alloc(n8));
        const V2 = c.i32_const(module.alloc(n8));
        const y1_J2 = c.i32_const(module.alloc(n8));

        f.addCode(
            c.if(
                c.call(prefix + "_isZeroAffine", c.getLocal("p1")),
                [
                    ...c.call(prefix + "_copyAffine", c.getLocal("p2"), c.getLocal("pr")),
                    ...c.call(prefixField + "_one", c.i32_add(c.getLocal("pr") , c.i32_const(n8*2))),
                    ...c.ret([])
                ]
            ),
            c.if(
                c.call(prefix + "_isZeroAffine", c.getLocal("p2")),
                [
                    ...c.call(prefix + "_copyAffine", c.getLocal("p1"), c.getLocal("pr")),
                    ...c.call(prefixField + "_one", c.i32_add(c.getLocal("pr") , c.i32_const(n8*2))),
                    ...c.ret([])
                ]
            ),


            c.if(
                c.call(prefixField + "_eq", x1, x2),
                c.if(
                    c.call(prefixField + "_eq", y1, y2),
                    [
                        ...c.call(prefix + "_doubleAffine", c.getLocal("p2"), c.getLocal("pr")),
                        ...c.ret([])
                    ]
                )
            ),

            c.call(prefixField + "_sub", x2, x1, H),
            c.call(prefixField + "_sub", y2, y1, y2_minus_y1),
            c.call(prefixField + "_square", H, HH),
            c.call(prefixField + "_add", HH , HH, I),
            c.call(prefixField + "_add", I , I, I),
            c.call(prefixField + "_mul", H, I, J),
            c.call(prefixField + "_add", y2_minus_y1, y2_minus_y1, r),
            c.call(prefixField + "_mul", x1, I, V),
            c.call(prefixField + "_square", r, r2),
            c.call(prefixField + "_add", V, V, V2),

            c.call(prefixField + "_sub", r2, J, x3),
            c.call(prefixField + "_sub", x3, V2, x3),

            c.call(prefixField + "_mul", y1, J, y1_J2),
            c.call(prefixField + "_add", y1_J2, y1_J2, y1_J2),

            c.call(prefixField + "_sub", V, x3, y3),
            c.call(prefixField + "_mul", y3, r, y3),
            c.call(prefixField + "_sub", y3, y1_J2, y3),

            c.call(prefixField + "_add", H, H, z3),
        );
    }

    function buildNeg() {
        const f = module.addFunction(prefix + "_neg");
        f.addParam("p1", "i32");
        f.addParam("pr", "i32");

        const c = f.getCodeBuilder();

        const x = c.getLocal("p1");
        const y = c.i32_add(c.getLocal("p1"), c.i32_const(n8));
        const z = c.i32_add(c.getLocal("p1"), c.i32_const(n8*2));
        const x3 = c.getLocal("pr");
        const y3 = c.i32_add(c.getLocal("pr"), c.i32_const(n8));
        const z3 = c.i32_add(c.getLocal("pr"), c.i32_const(n8*2));

        f.addCode(
            c.call(prefixField + "_copy", x, x3),
            c.call(prefixField + "_neg", y, y3),
            c.call(prefixField + "_copy", z, z3)
        );
    }


    function buildNegAffine() {
        const f = module.addFunction(prefix + "_negAffine");
        f.addParam("p1", "i32");
        f.addParam("pr", "i32");

        const c = f.getCodeBuilder();

        const x = c.getLocal("p1");
        const y = c.i32_add(c.getLocal("p1"), c.i32_const(n8));
        const x3 = c.getLocal("pr");
        const y3 = c.i32_add(c.getLocal("pr"), c.i32_const(n8));

        f.addCode(
            c.call(prefixField + "_copy", x, x3),
            c.call(prefixField + "_neg", y, y3),
        );
    }


    function buildSub() {
        const f = module.addFunction(prefix + "_sub");
        f.addParam("p1", "i32");
        f.addParam("p2", "i32");
        f.addParam("pr", "i32");

        const c = f.getCodeBuilder();

        const AUX = c.i32_const(module.alloc(n8*3));

        f.addCode(
            c.call(prefix + "_neg", c.getLocal("p2"), AUX),
            c.call(prefix + "_add", c.getLocal("p1"), AUX, c.getLocal("pr")),
        );
    }

    function buildSubMixed() {
        const f = module.addFunction(prefix + "_subMixed");
        f.addParam("p1", "i32");
        f.addParam("p2", "i32");
        f.addParam("pr", "i32");

        const c = f.getCodeBuilder();

        const AUX = c.i32_const(module.alloc(n8*3));

        f.addCode(
            c.call(prefix + "_negAffine", c.getLocal("p2"), AUX),
            c.call(prefix + "_addMixed", c.getLocal("p1"), AUX, c.getLocal("pr")),
        );
    }


    function buildSubAffine() {
        const f = module.addFunction(prefix + "_subAffine");
        f.addParam("p1", "i32");
        f.addParam("p2", "i32");
        f.addParam("pr", "i32");

        const c = f.getCodeBuilder();

        const AUX = c.i32_const(module.alloc(n8*3));

        f.addCode(
            c.call(prefix + "_negAffine", c.getLocal("p2"), AUX),
            c.call(prefix + "_addAffine", c.getLocal("p1"), AUX, c.getLocal("pr")),
        );
    }

    // This sets Z to One
    function buildNormalize() {
        const f = module.addFunction(prefix + "_normalize");
        f.addParam("p1", "i32");
        f.addParam("pr", "i32");

        const c = f.getCodeBuilder();

        const x = c.getLocal("p1");
        const y = c.i32_add(c.getLocal("p1"), c.i32_const(n8));
        const z = c.i32_add(c.getLocal("p1"), c.i32_const(n8*2));
        const x3 = c.getLocal("pr");
        const y3 = c.i32_add(c.getLocal("pr"), c.i32_const(n8));
        const z3 = c.i32_add(c.getLocal("pr"), c.i32_const(n8*2));


        const Z_inv = c.i32_const(module.alloc(n8));
        const Z2_inv = c.i32_const(module.alloc(n8));
        const Z3_inv = c.i32_const(module.alloc(n8));

        f.addCode(
            c.if(
                c.call(prefix + "_isZero", c.getLocal("p1")),
                c.call(prefix + "_zero", c.getLocal("pr")),
                [
                    ...c.call(prefixField + "_inverse", z, Z_inv),
                    ...c.call(prefixField + "_square", Z_inv, Z2_inv),
                    ...c.call(prefixField + "_mul", Z_inv, Z2_inv, Z3_inv),
                    ...c.call(prefixField + "_mul", x, Z2_inv, x3),
                    ...c.call(prefixField + "_mul", y, Z3_inv, y3),
                    ...c.call(prefixField + "_one", z3),
                ]
            )
        );
    }


    // Does not set Z.
    function buildToAffine() {
        const f = module.addFunction(prefix + "_toAffine");
        f.addParam("p1", "i32");
        f.addParam("pr", "i32");

        const c = f.getCodeBuilder();

        const x = c.getLocal("p1");
        const y = c.i32_add(c.getLocal("p1"), c.i32_const(n8));
        const z = c.i32_add(c.getLocal("p1"), c.i32_const(n8*2));
        const x3 = c.getLocal("pr");
        const y3 = c.i32_add(c.getLocal("pr"), c.i32_const(n8));


        const Z_inv = c.i32_const(module.alloc(n8));
        const Z2_inv = c.i32_const(module.alloc(n8));
        const Z3_inv = c.i32_const(module.alloc(n8));

        f.addCode(
            c.if(
                c.call(prefix + "_isZero", c.getLocal("p1")),
                [
                    ...c.call(prefixField + "_zero", x3),
                    ...c.call(prefixField + "_zero", y3),
                ],
                [
                    ...c.call(prefixField + "_inverse", z, Z_inv),
                    ...c.call(prefixField + "_square", Z_inv, Z2_inv),
                    ...c.call(prefixField + "_mul", Z_inv, Z2_inv, Z3_inv),
                    ...c.call(prefixField + "_mul", x, Z2_inv, x3),
                    ...c.call(prefixField + "_mul", y, Z3_inv, y3),
                ]
            )
        );
    }


    function buildToJacobian() {
        const f = module.addFunction(prefix + "_toJacobian");
        f.addParam("p1", "i32");
        f.addParam("pr", "i32");

        const c = f.getCodeBuilder();

        const x = c.getLocal("p1");
        const y = c.i32_add(c.getLocal("p1"), c.i32_const(n8));
        const x3 = c.getLocal("pr");
        const y3 = c.i32_add(c.getLocal("pr"), c.i32_const(n8));
        const z3 = c.i32_add(c.getLocal("pr"), c.i32_const(n8*2));

        f.addCode(
            c.if(
                c.call(prefix + "_isZeroAffine", c.getLocal("p1")),
                c.call(prefix + "_zero", c.getLocal("pr")),
                [
                    ...c.call(prefixField + "_one", z3),
                    ...c.call(prefixField + "_copy", y, y3),
                    ...c.call(prefixField + "_copy", x, x3)
                ]
            )
        );
    }

    function buildBatchToAffine() {
        const f = module.addFunction(prefix + "_batchToAffine");
        f.addParam("pIn", "i32");
        f.addParam("n", "i32");
        f.addParam("pOut", "i32");
        f.addLocal("pAux", "i32");
        f.addLocal("itIn", "i32");
        f.addLocal("itAux", "i32");
        f.addLocal("itOut", "i32");
        f.addLocal("i", "i32");

        const c = f.getCodeBuilder();

        const tmp = c.i32_const(module.alloc(n8));

        f.addCode(
            c.setLocal("pAux", c.i32_load( c.i32_const(0) )),
            c.i32_store(
                c.i32_const(0),
                c.i32_add(
                    c.getLocal("pAux"),
                    c.i32_mul(c.getLocal("n"), c.i32_const(n8))
                )
            ),

            c.call(
                prefixField + "_batchInverse",
                c.i32_add(c.getLocal("pIn"), c.i32_const(n8*2)),
                c.i32_const(n8*3),
                c.getLocal("n"),
                c.getLocal("pAux"),
                c.i32_const(n8)
            ),

            c.setLocal("itIn", c.getLocal("pIn")),
            c.setLocal("itAux", c.getLocal("pAux")),
            c.setLocal("itOut", c.getLocal("pOut")),
            c.setLocal("i", c.i32_const(0)),
            c.block(c.loop(
                c.br_if(1, c.i32_eq ( c.getLocal("i"), c.getLocal("n") )),

                c.if(
                    c.call(prefixField + "_isZero", c.getLocal("itAux")),
                    [
                        ...c.call(prefixField + "_zero", c.getLocal("itOut")),
                        ...c.call(prefixField + "_zero", c.i32_add(c.getLocal("itOut"), c.i32_const(n8)))
                    ],
                    [
                        ...c.call(
                            prefixField+"_mul",
                            c.getLocal("itAux"),
                            c.i32_add(c.getLocal("itIn"), c.i32_const(n8)),
                            tmp,
                        ),
                        ...c.call(
                            prefixField+"_square",
                            c.getLocal("itAux"),
                            c.getLocal("itAux")
                        ),
                        ...c.call(
                            prefixField+"_mul",
                            c.getLocal("itAux"),
                            c.getLocal("itIn"),
                            c.getLocal("itOut"),
                        ),
                        ...c.call(
                            prefixField+"_mul",
                            c.getLocal("itAux"),
                            tmp,
                            c.i32_add(c.getLocal("itOut"), c.i32_const(n8)),
                        ),
                    ]
                ),

                c.setLocal("itIn", c.i32_add(c.getLocal("itIn"), c.i32_const(n8*3))),
                c.setLocal("itOut", c.i32_add(c.getLocal("itOut"), c.i32_const(n8*2))),
                c.setLocal("itAux", c.i32_add(c.getLocal("itAux"), c.i32_const(n8))),
                c.setLocal("i", c.i32_add(c.getLocal("i"), c.i32_const(1))),
                c.br(0)
            )),
            c.i32_store(
                c.i32_const(0),
                c.getLocal("pAux")
            )
        );
    }


    // This function is private and does not allow to OVERLAP buffers.
    function buildReverseBytes() {
        const f = module.addFunction(prefix + "__reverseBytes");
        f.addParam("pIn", "i32");
        f.addParam("n", "i32");
        f.addParam("pOut", "i32");
        f.addLocal("itOut", "i32");
        f.addLocal("itIn", "i32");

        const c = f.getCodeBuilder();

        f.addCode(
            c.setLocal(
                "itOut",
                c.i32_sub(
                    c.i32_add(
                        c.getLocal("pOut"),
                        c.getLocal("n")
                    ),
                    c.i32_const(1)
                )
            ),
            c.setLocal(
                "itIn",
                c.getLocal("pIn")
            ),
            c.block(c.loop(
                c.br_if(1, c.i32_lt_s( c.getLocal("itOut"), c.getLocal("pOut") )),
                c.i32_store8(
                    c.getLocal("itOut"),
                    c.i32_load8_u(c.getLocal("itIn")),
                ),
                c.setLocal("itOut", c.i32_sub(c.getLocal("itOut"), c.i32_const(1))),
                c.setLocal("itIn", c.i32_add(c.getLocal("itIn"), c.i32_const(1))),
                c.br(0)
            )),
        );

    }

    function buildLEMtoC() {
        const f = module.addFunction(prefix + "_LEMtoC");
        f.addParam("pIn", "i32");
        f.addParam("pOut", "i32");

        const c = f.getCodeBuilder();

        const tmp = c.i32_const(module.alloc(n8));

        f.addCode(
            c.if(
                c.call(prefix + "_isZeroAffine", c.getLocal("pIn")),
                [
                    ...c.call(prefixField + "_zero", c.getLocal("pOut")),
                    ...c.i32_store8(
                        c.getLocal("pOut"),
                        c.i32_const(0x40)
                    ),
                    ...c.ret([])
                ]
            ),
            c.call(prefixField + "_fromMontgomery", c.getLocal("pIn"), tmp),
            c.call(prefix + "__reverseBytes", tmp, c.i32_const(n8), c.getLocal("pOut")),
            c.if(
                c.i32_eq(
                    c.call(prefixField + "_sign", c.i32_add(c.getLocal("pIn"), c.i32_const(n8))),
                    c.i32_const(-1)
                ),
                c.i32_store8(
                    c.getLocal("pOut"),
                    c.i32_or(
                        c.i32_load8_u(c.getLocal("pOut")),
                        c.i32_const(0x80)
                    )
                )
            ),
        );
    }

    function buildLEMtoU() {
        const f = module.addFunction(prefix + "_LEMtoU");
        f.addParam("pIn", "i32");
        f.addParam("pOut", "i32");

        const c = f.getCodeBuilder();

        const pTmp = module.alloc(n8*2);
        const tmp = c.i32_const(pTmp);
        const tmpX = c.i32_const(pTmp);
        const tmpY = c.i32_const(pTmp + n8);

        f.addCode(
            c.if(
                c.call(prefix + "_isZeroAffine", c.getLocal("pIn")),
                [
                    ...c.call(prefix + "_zeroAffine", c.getLocal("pOut")),
                    ...c.ret([])
                ]
            ),

            c.call(prefix + "_fromMontgomeryAffine", c.getLocal("pIn"), tmp),

            c.call(prefix + "__reverseBytes", tmpX, c.i32_const(n8), c.getLocal("pOut")),
            c.call(prefix + "__reverseBytes", tmpY, c.i32_const(n8), c.i32_add(c.getLocal("pOut"), c.i32_const(n8))),
        );
    }

    function buildUtoLEM() {
        const f = module.addFunction(prefix + "_UtoLEM");
        f.addParam("pIn", "i32");
        f.addParam("pOut", "i32");

        const c = f.getCodeBuilder();

        const pTmp = module.alloc(n8*2);
        const tmp = c.i32_const(pTmp);
        const tmpX = c.i32_const(pTmp);
        const tmpY = c.i32_const(pTmp + n8);

        f.addCode(
            c.if(
                c.i32_and(c.i32_load8_u(c.getLocal("pIn")), c.i32_const(0x40)),
                [
                    ...c.call(prefix + "_zeroAffine", c.getLocal("pOut")),
                    ...c.ret([])
                ]
            ),
            c.call(prefix + "__reverseBytes", c.getLocal("pIn"), c.i32_const(n8), tmpX),
            c.call(prefix + "__reverseBytes", c.i32_add(c.getLocal("pIn"), c.i32_const(n8)), c.i32_const(n8), tmpY),
            c.call(prefix + "_toMontgomeryAffine", tmp,  c.getLocal("pOut"))
        );
    }

    function buildCtoLEM() {
        const f = module.addFunction(prefix + "_CtoLEM");
        f.addParam("pIn", "i32");
        f.addParam("pOut", "i32");
        f.addLocal("firstByte", "i32");
        f.addLocal("greatest", "i32");

        const c = f.getCodeBuilder();

        const pTmp = module.alloc(n8*2);
        const tmpX = c.i32_const(pTmp);
        const tmpY = c.i32_const(pTmp + n8);

        f.addCode(
            c.setLocal("firstByte", c.i32_load8_u(c.getLocal("pIn"))),
            c.if(
                c.i32_and(
                    c.getLocal("firstByte"),
                    c.i32_const(0x40)
                ),
                [
                    ...c.call(prefix + "_zeroAffine", c.getLocal("pOut")),
                    ...c.ret([])
                ]
            ),
            c.setLocal(
                "greatest",
                c.i32_and(
                    c.getLocal("firstByte"),
                    c.i32_const(0x80)
                )
            ),

            c.call(prefixField + "_copy", c.getLocal("pIn"), tmpY),
            c.i32_store8(tmpY, c.i32_and(c.getLocal("firstByte"), c.i32_const(0x3F))),
            c.call(prefix + "__reverseBytes", tmpY, c.i32_const(n8), tmpX),
            c.call(prefixField + "_toMontgomery", tmpX, c.getLocal("pOut")),

            c.call(prefixField + "_square", c.getLocal("pOut"), tmpY),
            c.call(prefixField + "_mul", c.getLocal("pOut"), tmpY,  tmpY),
            c.call(prefixField + "_add", tmpY, c.i32_const(pB),  tmpY),

            c.call(prefixField + "_sqrt", tmpY, tmpY),
            c.call(prefixField + "_neg", tmpY, tmpX),

            c.if(
                c.i32_eq(
                    c.call(prefixField + "_sign", tmpY),
                    c.i32_const(-1)
                ),
                c.if(
                    c.getLocal("greatest"),
                    c.call(prefixField + "_copy", tmpY, c.i32_add(c.getLocal("pOut"), c.i32_const(n8))),
                    c.call(prefixField + "_neg", tmpY, c.i32_add(c.getLocal("pOut"), c.i32_const(n8)))
                ),
                c.if(
                    c.getLocal("greatest"),
                    c.call(prefixField + "_neg", tmpY, c.i32_add(c.getLocal("pOut"), c.i32_const(n8))),
                    c.call(prefixField + "_copy", tmpY, c.i32_add(c.getLocal("pOut"), c.i32_const(n8)))
                ),
            )

        );
    }

    function buildInCurveAffine() {
        const f = module.addFunction(prefix + "_inCurveAffine");
        f.addParam("pIn", "i32");
        f.setReturnType("i32");

        const c = f.getCodeBuilder();

        const x = c.getLocal("pIn");
        const y = c.i32_add(c.getLocal("pIn"), c.i32_const(n8));

        const y2 = c.i32_const(module.alloc(n8));
        const x3b = c.i32_const(module.alloc(n8));

        f.addCode(
            c.call(prefixField + "_square", y, y2),
            c.call(prefixField + "_square", x, x3b),
            c.call(prefixField + "_mul", x, x3b, x3b),
            c.call(prefixField + "_add", x3b, c.i32_const(pB), x3b),

            c.ret(
                c.call(prefixField + "_eq", y2, x3b)
            )
        );
    }

    function buildInCurve() {
        const f = module.addFunction(prefix + "_inCurve");
        f.addParam("pIn", "i32");
        f.setReturnType("i32");

        const c = f.getCodeBuilder();

        const aux = c.i32_const(module.alloc(n8*2));

        f.addCode(
            c.call(prefix + "_toAffine", c.getLocal("pIn"), aux),

            c.ret(
                c.call(prefix + "_inCurveAffine", aux),
            )
        );
    }

    buildIsZeroAffine();
    buildIsZero();
    buildZeroAffine();
    buildZero();
    buildCopyAffine();
    buildCopy();
    buildToJacobian();
    buildEqAffine();
    buildEqMixed();
    buildEq();
    buildDoubleAffine();
    buildDouble();
    buildAddAffine();
    buildAddMixed();
    buildAdd();
    buildNegAffine();
    buildNeg();
    buildSubAffine();
    buildSubMixed();
    buildSub();
    buildFromMontgomeryAffine();
    buildFromMontgomery();
    buildToMontgomeryAffine();
    buildToMontgomery();
    buildToAffine();
    buildInCurveAffine();
    buildInCurve();

    buildBatchToAffine();

    buildNormalize();


    buildReverseBytes();

    buildLEMtoU();
    buildLEMtoC();
    buildUtoLEM();
    buildCtoLEM();

    buildBatchConvertion(module, prefix + "_batchLEMtoU", prefix + "_LEMtoU", n8*2, n8*2);
    buildBatchConvertion(module, prefix + "_batchLEMtoC", prefix + "_LEMtoC", n8*2, n8);
    buildBatchConvertion(module, prefix + "_batchUtoLEM", prefix + "_UtoLEM", n8*2, n8*2);
    buildBatchConvertion(module, prefix + "_batchCtoLEM", prefix + "_CtoLEM", n8, n8*2, true);

    buildBatchConvertion(module, prefix + "_batchToJacobian", prefix + "_toJacobian", n8*2, n8*3, true);

    buildMultiexp(module, prefix, prefix + "_multiexp", prefix + "_add", n8*3);
    buildMultiexp(module, prefix, prefix + "_multiexpAffine", prefix + "_addMixed", n8*2);

    /*
    buildTimesScalar(
        module,
        prefix + "_timesScalarOld",
        n8*3,
        prefix + "_add",
        prefix + "_double",
        prefix + "_copy",
        prefix + "_zero",
    );
    */
    buildTimesScalarNAF(
        module,
        prefix + "_timesScalar",
        n8*3,
        prefix + "_add",
        prefix + "_double",
        prefix + "_sub",
        prefix + "_copy",
        prefix + "_zero"
    );

    buildTimesScalarNAF(
        module,
        prefix + "_timesScalarAffine",
        n8*2,
        prefix + "_addMixed",
        prefix + "_double",
        prefix + "_subMixed",
        prefix + "_copyAffine",
        prefix + "_zero"
    );

    module.exportFunction(prefix + "_isZero");
    module.exportFunction(prefix + "_isZeroAffine");

    module.exportFunction(prefix + "_eq");
    module.exportFunction(prefix + "_eqMixed");
    module.exportFunction(prefix + "_eqAffine");

    module.exportFunction(prefix + "_copy");
    module.exportFunction(prefix + "_copyAffine");

    module.exportFunction(prefix + "_zero");
    module.exportFunction(prefix + "_zeroAffine");

    module.exportFunction(prefix + "_double");
    module.exportFunction(prefix + "_doubleAffine");

    module.exportFunction(prefix + "_add");
    module.exportFunction(prefix + "_addMixed");
    module.exportFunction(prefix + "_addAffine");

    module.exportFunction(prefix + "_neg");
    module.exportFunction(prefix + "_negAffine");

    module.exportFunction(prefix + "_sub");
    module.exportFunction(prefix + "_subMixed");
    module.exportFunction(prefix + "_subAffine");

    module.exportFunction(prefix + "_fromMontgomery");
    module.exportFunction(prefix + "_fromMontgomeryAffine");

    module.exportFunction(prefix + "_toMontgomery");
    module.exportFunction(prefix + "_toMontgomeryAffine");

    module.exportFunction(prefix + "_timesScalar");
    module.exportFunction(prefix + "_timesScalarAffine");

    module.exportFunction(prefix + "_normalize");

    // Convertion functions
    module.exportFunction(prefix + "_LEMtoU");
    module.exportFunction(prefix + "_LEMtoC");
    module.exportFunction(prefix + "_UtoLEM");
    module.exportFunction(prefix + "_CtoLEM");

    module.exportFunction(prefix + "_batchLEMtoU");
    module.exportFunction(prefix + "_batchLEMtoC");
    module.exportFunction(prefix + "_batchUtoLEM");
    module.exportFunction(prefix + "_batchCtoLEM");

    module.exportFunction(prefix + "_toAffine");
    module.exportFunction(prefix + "_toJacobian");

    module.exportFunction(prefix + "_batchToAffine");
    module.exportFunction(prefix + "_batchToJacobian");

    module.exportFunction(prefix + "_inCurve");
    module.exportFunction(prefix + "_inCurveAffine");

    /*
    buildG1MulScalar(module, zq);
    module.exportFunction("g1MulScalar");
    */

    return prefix;
};

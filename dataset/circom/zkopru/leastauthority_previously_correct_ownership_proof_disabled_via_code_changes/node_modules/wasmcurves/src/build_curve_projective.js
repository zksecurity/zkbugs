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
MNT 6573 Curve Operations implementation

Operations in: http://www.hyperelliptic.org/EFD/g1p/auto-shortw-projective.html#addition-add-1998-cmo-2

    y^2 = x^3 + a*x + b

    Projective Coordenates.
 f
 */

const buildTimesScalar = require("./build_timesscalar");
const buildTimesScalarNAF = require("./build_timesscalarnaf");

module.exports = function buildCurve(module, prefix, prefixField, fnMulByA) {


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

        f.addCode(
            c.if(
                c.call(
                    prefixField + "_isZero",
                    c.i32_add(
                        c.getLocal("p1"),
                        c.i32_const(n8*2)
                    )
                ),
                c.ret(
                    c.call(
                        prefixField + "_isZero",
                        c.getLocal("p1"),
                    ),
                )
            ),
            c.i32_const(0)
        );
    }

    function buildIsZeroAffine() {
        const f = module.addFunction(prefix + "_isZeroAffine");
        f.addParam("p1", "i32");
        f.setReturnType("i32");

        const c = f.getCodeBuilder();

        const x1 = c.getLocal("p1");
        const y1 = c.i32_add(c.getLocal("p1"), c.i32_const(n8));


        f.addCode(
            c.if(
                c.call(
                    prefixField + "_isZero",
                    x1
                ),
                c.ret(
                    c.call(
                        prefixField + "_isZero",
                        y1,
                    ),
                )
            ),
            c.i32_const(0)
        );
    }

    function buildCopy() {
        const f = module.addFunction(prefix + "_copy");
        f.addParam("p1", "i32");
        f.addParam("pr", "i32");

        const c = f.getCodeBuilder();
        for (let i=0; i<n64*3; i++) {
            f.addCode(
                c.i64_store(
                    c.getLocal("pr"),
                    i*8,
                    c.i64_load(
                        c.getLocal("p1"),
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

    function buildEq() {
        const f = module.addFunction(prefix + "_eq");
        f.addParam("p1", "i32");
        f.addParam("p2", "i32");
        f.setReturnType("i32");

        const c = f.getCodeBuilder();

        const x1 = c.getLocal("p1");
        const y1 = c.i32_add(c.getLocal("p1"), c.i32_const(n8));
        const z1 = c.i32_add(c.getLocal("p1"), c.i32_const(n8*2));
        const x2 = c.getLocal("p2");
        const y2 = c.i32_add(c.getLocal("p2"), c.i32_const(n8));
        const z2 = c.i32_add(c.getLocal("p2"), c.i32_const(n8*2));

        const X1Z2 = c.i32_const(module.alloc(n8));
        const X2Z1 = c.i32_const(module.alloc(n8));
        const Y1Z2 = c.i32_const(module.alloc(n8));
        const Y2Z1 = c.i32_const(module.alloc(n8));

        f.addCode(
            c.if(
                c.call(prefix + "_isZero", c.getLocal("p1")),
                c.ret( c.call(prefix + "_isZero", c.getLocal("p2"))),
            ),
            c.if(
                c.call(prefix + "_isZero", c.getLocal("p2")),
                c.ret(c.i32_const(0))
            ),

            // X1Z2 = X1*Z2
            c.call(prefixField + "_mul", x1, z2, X1Z2),

            // X2Z1 = X2*Z1
            c.call(prefixField + "_mul", x2, z1, X2Z1),

            // Y1Z2 = Y1*Z2
            c.call(prefixField + "_mul", y1, z2, Y1Z2),

            // Y2Z1 = Y2*Z1
            c.call(prefixField + "_mul", y2, z1, Y2Z1),

            c.if(
                c.call(prefixField + "_eq", X1Z2, X2Z1),
                c.if(
                    c.call(prefixField + "_eq", Y1Z2, Y2Z1),
                    c.ret(c.i32_const(1))
                )
            ),

            c.i32_const(1)
        );
    }

    function buildDouble() {
        const f = module.addFunction(prefix + "_double");
        f.addParam("p1", "i32");
        f.addParam("pr", "i32");

        const c = f.getCodeBuilder();

        const x1 = c.getLocal("p1");
        const y1 = c.i32_add(c.getLocal("p1"), c.i32_const(n8));
        const z1 = c.i32_add(c.getLocal("p1"), c.i32_const(n8*2));
        const x3 = c.getLocal("pr");
        const y3 = c.i32_add(c.getLocal("pr"), c.i32_const(n8));
        // z3 is sss

        const XX = c.i32_const(module.alloc(n8));
        const ZZ = c.i32_const(module.alloc(n8));
        const w = c.i32_const(module.alloc(n8));
        const s = c.i32_const(module.alloc(n8));
        const ss = c.i32_const(module.alloc(n8));
        const sss = c.i32_add(c.getLocal("pr"), c.i32_const(n8*2));
        const R = c.i32_const(module.alloc(n8));
        const RR = c.i32_const(module.alloc(n8));
        const B = c.i32_const(module.alloc(n8));
        const h = c.i32_const(module.alloc(n8));
        const AUX = c.i32_const(module.alloc(n8));

        f.addCode(
            c.if(
                c.call(prefix + "_isZero", c.getLocal("p1")),
                [
                    ...c.call(prefix + "_copy", c.getLocal("p1"), c.getLocal("pr")),
                    ...c.ret([])
                ]
            ),

            // XX  = X1^2
            c.call(prefixField + "_square", x1, XX),

            // ZZ  = Z1^2
            c.call(prefixField + "_square", z1, ZZ),

            // w   = a*ZZ + 3*XX
            c.call(fnMulByA, ZZ, w),
            c.call(prefixField + "_add", w, XX, w),
            c.call(prefixField + "_add", w, XX, w),
            c.call(prefixField + "_add", w, XX, w),

            // s   = 2*Y1*Z1
            c.call(prefixField + "_mul", y1, z1, s),
            c.call(prefixField + "_add", s, s, s),

            // ss  = s^2
            c.call(prefixField + "_square", s, ss),

            // sss = s*ss
            c.call(prefixField + "_mul", s, ss, sss),

            // R   = Y1*s
            c.call(prefixField + "_mul", y1, s, R),

            // RR  = R^2
            c.call(prefixField + "_square", R, RR),

            // B   = (X1+R)^2 - XX - RR
            c.call(prefixField + "_add", x1, R, B),
            c.call(prefixField + "_square", B, B),
            c.call(prefixField + "_add", XX, RR, AUX),
            c.call(prefixField + "_sub", B, AUX, B),

            // h   = w^2 - 2*B
            c.call(prefixField + "_square", w, h),
            c.call(prefixField + "_add", B, B, AUX),
            c.call(prefixField + "_sub", h, AUX, h),

            // X3  = h*s
            c.call(prefixField + "_mul", h, s, x3),

            // Y3  = w*(B-h) - 2*RR
            c.call(prefixField + "_sub", B, h, y3),
            c.call(prefixField + "_mul", w, y3, y3),
            c.call(prefixField + "_add", RR, RR, AUX),
            c.call(prefixField + "_sub", y3, AUX, y3),

            // Z3  = sss

        );
    }


    function buildAdd() {

        const f = module.addFunction(prefix + "_add");
        f.addParam("p1", "i32");
        f.addParam("p2", "i32");
        f.addParam("pr", "i32");

        const c = f.getCodeBuilder();

        const x1 = c.getLocal("p1");
        const y1 = c.i32_add(c.getLocal("p1"), c.i32_const(n8));
        const z1 = c.i32_add(c.getLocal("p1"), c.i32_const(n8*2));
        const x2 = c.getLocal("p2");
        const y2 = c.i32_add(c.getLocal("p2"), c.i32_const(n8));
        const z2 = c.i32_add(c.getLocal("p2"), c.i32_const(n8*2));
        const x3 = c.getLocal("pr");
        const y3 = c.i32_add(c.getLocal("pr"), c.i32_const(n8));
        const z3 = c.i32_add(c.getLocal("pr"), c.i32_const(n8*2));

        const X1Z2 = c.i32_const(module.alloc(n8));
        const X2Z1 = c.i32_const(module.alloc(n8));
        const Y1Z2 = c.i32_const(module.alloc(n8));
        const Y2Z1 = c.i32_const(module.alloc(n8));
        const Z1Z2 = c.i32_const(module.alloc(n8));
        const u = c.i32_const(module.alloc(n8));
        const uu = c.i32_const(module.alloc(n8));
        const v = c.i32_const(module.alloc(n8));
        const vv = c.i32_const(module.alloc(n8));
        const vvv = c.i32_const(module.alloc(n8));
        const R = c.i32_const(module.alloc(n8));
        const A = c.i32_const(module.alloc(n8));
        const AUX = c.i32_const(module.alloc(n8));


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

            // X1Z2 = X1*Z2
            c.call(prefixField + "_mul", x1, z2, X1Z2),

            // X2Z1 = X2*Z1
            c.call(prefixField + "_mul", x2, z1, X2Z1),

            // Y1Z2 = Y1*Z2
            c.call(prefixField + "_mul", y1, z2, Y1Z2),

            // Y2Z1 = Y2*Z1
            c.call(prefixField + "_mul", y2, z1, Y2Z1),

            c.if(
                c.call(prefixField + "_eq", X1Z2, X2Z1),
                c.if(
                    c.call(prefixField + "_eq", Y1Z2, Y2Z1),
                    [
                        ...c.call(prefix + "_double", c.getLocal("p1"), c.getLocal("pr")),
                        ...c.ret([])
                    ]
                )
            ),

            // Z1Z2 = Z1*Z2
            c.call(prefixField + "_mul", z1, z2, Z1Z2),

            // u    = Y2Z1-Y1Z2
            c.call(prefixField + "_sub", Y2Z1, Y1Z2, u),


            // uu   = u^2
            c.call(prefixField + "_square", u, uu),

            // v    = X2Z1-X1Z2
            c.call(prefixField + "_sub", X2Z1, X1Z2, v),

            // vv   = v^2
            c.call(prefixField + "_square", v, vv),

            // vvv  = v*vv
            c.call(prefixField + "_mul", v, vv, vvv),

            // R    = vv*X1Z2
            c.call(prefixField + "_mul", vv, X1Z2, R),

            // A    = uu*Z1Z2 - vvv - 2*R
            c.call(prefixField + "_mul", uu, Z1Z2, A),
            c.call(prefixField + "_add", R, R, AUX),
            c.call(prefixField + "_add", vvv, AUX, AUX),
            c.call(prefixField + "_sub", A, AUX, A),

            // X3   = v*A
            c.call(prefixField + "_mul", v, A, x3),



            // Y3   = u*(R-A) - vvv*Y1Z2
            c.call(prefixField + "_sub", R, A, y3),
            c.call(prefixField + "_mul", u, y3, y3),
            c.call(prefixField + "_mul", vvv, Y1Z2, AUX),
            c.call(prefixField + "_sub", y3, AUX, y3),


            // Z3   = vvv*Z1Z2
            c.call(prefixField + "_mul", vvv, Z1Z2, z3),
        );
    }



    function buildAddMixed() {

        const f = module.addFunction(prefix + "_addMixed");
        f.addParam("p1", "i32");
        f.addParam("p2", "i32");
        f.addParam("pr", "i32");

        const c = f.getCodeBuilder();

        const x1 = c.getLocal("p1");
        const y1 = c.i32_add(c.getLocal("p1"), c.i32_const(n8));
        const z1 = c.i32_add(c.getLocal("p1"), c.i32_const(n8*2));
        const x2 = c.getLocal("p2");
        const y2 = c.i32_add(c.getLocal("p2"), c.i32_const(n8));
        const x3 = c.getLocal("pr");
        const y3 = c.i32_add(c.getLocal("pr"), c.i32_const(n8));
        const z3 = c.i32_add(c.getLocal("pr"), c.i32_const(n8*2));

        const X2Z1 = c.i32_const(module.alloc(n8));
        const Y2Z1 = c.i32_const(module.alloc(n8));
        const u = c.i32_const(module.alloc(n8));
        const uu = c.i32_const(module.alloc(n8));
        const v = c.i32_const(module.alloc(n8));
        const vv = c.i32_const(module.alloc(n8));
        const vvv = c.i32_const(module.alloc(n8));
        const R = c.i32_const(module.alloc(n8));
        const A = c.i32_const(module.alloc(n8));
        const AUX = c.i32_const(module.alloc(n8));


        f.addCode(
            c.if(
                c.call(prefix + "_isZero", c.getLocal("p1")),
                [
                    ...c.call(prefixField + "_copy", x2, x3),
                    ...c.call(prefixField + "_copy", y2, y3),
                    ...c.call(prefixField + "_one", z3),
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


            // X2Z1 = X2*Z1
            c.call(prefixField + "_mul", x2, z1, X2Z1),

            // Y2Z1 = Y2*Z1
            c.call(prefixField + "_mul", y2, z1, Y2Z1),

            c.if(
                c.call(prefixField + "_eq", x1, X2Z1),
                c.if(
                    c.call(prefixField + "_eq", y1, Y2Z1),
                    [
                        ...c.call(prefix + "_double", c.getLocal("p1"), c.getLocal("pr")),
                        ...c.ret([])
                    ]
                )
            ),

            // u    = Y2Z1-Y1
            c.call(prefixField + "_sub", Y2Z1, y1, u),

            // uu   = u^2
            c.call(prefixField + "_square", u, uu),

            // v    = X2Z1-X1
            c.call(prefixField + "_sub", X2Z1, x1, v),


            // vv   = v^2
            c.call(prefixField + "_square", v, vv),

            // vvv  = v*vv
            c.call(prefixField + "_mul", v, vv, vvv),

            // R    = vv*X1
            c.call(prefixField + "_mul", vv, x1, R),

            // A    = uu*Z1 - vvv - 2*R
            c.call(prefixField + "_mul", uu, z1, A),
            c.call(prefixField + "_add", R, R, AUX),
            c.call(prefixField + "_add", vvv, AUX, AUX),
            c.call(prefixField + "_sub", A, AUX, A),

            // X3   = v*A
            c.call(prefixField + "_mul", v, A, x3),

            // Y3   = u*(R-A) - vvv*Y1
            c.call(prefixField + "_mul", vvv, y1, y3),
            c.call(prefixField + "_sub", R, A, AUX),
            c.call(prefixField + "_mul", u, AUX, AUX),
            c.call(prefixField + "_sub", AUX, y3, y3),

            // Z3   = vvv*Z1
            c.call(prefixField + "_mul", vvv, z1, z3),
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

        const x2 = c.getLocal("p2");
        const y2 = c.i32_add(c.getLocal("p2"), c.i32_const(n8));

        const pAux = module.alloc(n8*2);
        const AUX = c.i32_const(pAux);
        const AUXX = c.i32_const(pAux);
        const AUXY = c.i32_const(pAux+n8);

        f.addCode(
            c.call(prefixField + "_copy", x2, AUXX),
            c.call(prefixField + "_neg", y2, AUXY),
            c.call(prefix + "_addMixed", c.getLocal("p1"), AUX, c.getLocal("pr")),
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

        f.addCode(
            c.if(
                c.call(prefix + "_isZero", c.getLocal("p1")),
                c.call(prefix + "_zero", c.getLocal("pr")),
                [
                    ...c.call(prefixField + "_inverse", z, Z_inv),
                    ...c.call(prefixField + "_mul", x, Z_inv, x3),
                    ...c.call(prefixField + "_mul", y, Z_inv, y3),
                    ...c.call(prefixField + "_one", z3)
                ]
            )
        );
    }


    buildIsZero();
    buildIsZeroAffine();
    buildEq();
    buildZero();
    buildCopy();
    buildDouble();
    buildAdd();
    buildAddMixed();
    buildNeg();
    buildSub();
    buildSubMixed();
    buildFromMontgomery();
    buildToMontgomery();
    buildNormalize();


    buildTimesScalar(
        module,
        prefix + "_timesScalarOld",
        n8*3,
        prefix + "_add",
        prefix + "_double",
        prefix + "_copy",
        prefix + "_zero"
    );

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

    module.exportFunction(prefix + "_isZero");
    module.exportFunction(prefix + "_isZeroAffine");
    module.exportFunction(prefix + "_eq");
    module.exportFunction(prefix + "_copy");
    module.exportFunction(prefix + "_zero");
    module.exportFunction(prefix + "_double");
    module.exportFunction(prefix + "_add");
    module.exportFunction(prefix + "_addMixed");
    module.exportFunction(prefix + "_neg");
    module.exportFunction(prefix + "_sub");
    module.exportFunction(prefix + "_subMixed");
    module.exportFunction(prefix + "_fromMontgomery");
    module.exportFunction(prefix + "_toMontgomery");
    module.exportFunction(prefix + "_normalize");
    module.exportFunction(prefix + "_timesScalar");
    module.exportFunction(prefix + "_timesScalarOld");

    /*
    buildG1MulScalar(module, zq);
    module.exportFunction("g1MulScalar");
    */

    return prefix;
};

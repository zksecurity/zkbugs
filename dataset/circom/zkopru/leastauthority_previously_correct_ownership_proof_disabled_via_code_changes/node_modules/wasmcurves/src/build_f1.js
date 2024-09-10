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

const buildF1m =require("./build_f1m.js");
const { bitLength } = require("./bigint.js");

module.exports = function buildF1(module, _q, _prefix, _f1mPrefix, _intPrefix) {

    const q = BigInt(_q);
    const n64 = Math.floor((bitLength(q - 1n) - 1)/64) +1;
    const n8 = n64*8;

    const prefix = _prefix || "f1";
    if (module.modules[prefix]) return prefix;  // already builded
    module.modules[prefix] = {
        n64: n64
    };

    const intPrefix = _intPrefix || "int";
    const f1mPrefix = buildF1m(module, q, _f1mPrefix, intPrefix);


    const pR2 =     module.modules[f1mPrefix].pR2;
    const pq =     module.modules[f1mPrefix].pq;
    const pePlusOne = module.modules[f1mPrefix].pePlusOne;

    function buildMul() {
        const pAux1 = module.alloc(n8);

        const f = module.addFunction(prefix+ "_mul");
        f.addParam("x", "i32");
        f.addParam("y", "i32");
        f.addParam("r", "i32");

        const c = f.getCodeBuilder();
        f.addCode(c.call(f1mPrefix + "_mul", c.getLocal("x"), c.getLocal("y"), c.i32_const(pAux1)));
        f.addCode(c.call(f1mPrefix + "_mul", c.i32_const(pAux1), c.i32_const(pR2), c.getLocal("r")));
    }

    function buildSquare() {
        const f = module.addFunction(prefix+"_square");
        f.addParam("x", "i32");
        f.addParam("r", "i32");

        const c = f.getCodeBuilder();

        f.addCode(c.call(prefix + "_mul", c.getLocal("x"), c.getLocal("x"), c.getLocal("r")));
    }


    function buildInverse() {

        const f = module.addFunction(prefix+ "_inverse");
        f.addParam("x", "i32");
        f.addParam("r", "i32");

        const c = f.getCodeBuilder();
        f.addCode(c.call(intPrefix + "_inverseMod", c.getLocal("x"), c.i32_const(pq), c.getLocal("r")));
    }

    function buildIsNegative() {
        const f = module.addFunction(prefix+"_isNegative");
        f.addParam("x", "i32");
        f.setReturnType("i32");

        const c = f.getCodeBuilder();

        f.addCode(
            c.call(intPrefix + "_gte", c.getLocal("x"), c.i32_const(pePlusOne) )
        );
    }


    buildMul();
    buildSquare();
    buildInverse();
    buildIsNegative();
    module.exportFunction(f1mPrefix + "_add", prefix + "_add");
    module.exportFunction(f1mPrefix + "_sub", prefix + "_sub");
    module.exportFunction(f1mPrefix + "_neg", prefix + "_neg");
    module.exportFunction(prefix + "_mul");
    module.exportFunction(prefix + "_square");
    module.exportFunction(prefix + "_inverse");
    module.exportFunction(prefix + "_isNegative");
    module.exportFunction(f1mPrefix + "_copy", prefix+"_copy");
    module.exportFunction(f1mPrefix + "_zero", prefix+"_zero");
    module.exportFunction(f1mPrefix + "_one", prefix+"_one");
    module.exportFunction(f1mPrefix + "_isZero", prefix+"_isZero");
    module.exportFunction(f1mPrefix + "_eq", prefix+"_eq");

    return prefix;
};

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

module.exports = function buildTestF1(module) {

    const pR2 = module.modules.f1m.pR2;
    const n8 = module.modules.f1m.n64*8;


    function buildTestF1() {
        const f = module.addFunction("testF1");
        f.addParam("n", "i32");
        f.addLocal("i", "i32");

        const c = f.getCodeBuilder();

        const pAux1 = module.alloc(n8);

        f.addCode(c.setLocal("i", c.getLocal("n")));
        f.addCode(c.block(c.loop(
            c.call("f1m_mul", c.i32_const(pR2), c.i32_const(pR2), c.i32_const(pAux1)),
            c.setLocal("i", c.i32_sub(c.getLocal("i"), c.i32_const(1))),
            c.br_if(1, c.i32_eqz ( c.getLocal("i") )),
            c.br(0)
        )));
    }

    buildTestF1();
    module.exportFunction("testF1");
};

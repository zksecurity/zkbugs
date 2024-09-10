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

module.exports = function buildTestAddG1(module) {

    function buildTestAddG1() {
        const f = module.addFunction("testAddG1");
        f.addParam("n", "i32");
        f.addParam("pP", "i32");
        f.addParam("pR", "i32");
        f.addLocal("i", "i32");

        const c = f.getCodeBuilder();

        f.addCode(c.call("g1_zero", c.getLocal("pR")));

        f.addCode(c.setLocal("i", c.getLocal("n")));
        f.addCode(c.block(c.loop(
            c.call("g1_add", c.getLocal("pP"), c.getLocal("pR"), c.getLocal("pR")),
            c.setLocal("i", c.i32_sub(c.getLocal("i"), c.i32_const(1))),
            c.br_if(1, c.i32_eqz ( c.getLocal("i") )),
            c.br(0)
        )));
    }

    buildTestAddG1();
    module.exportFunction("testAddG1");
};


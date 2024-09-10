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

module.exports = function buildTimesScalar(module, fnName, elementLen, opAB, opAA, opCopy, opInit) {

    const f = module.addFunction(fnName);
    f.addParam("base", "i32");
    f.addParam("scalar", "i32");
    f.addParam("scalarLength", "i32");
    f.addParam("r", "i32");
    f.addLocal("i", "i32");
    f.addLocal("b", "i32");

    const c = f.getCodeBuilder();

    const aux = c.i32_const(module.alloc(elementLen));

    f.addCode(
        c.if(
            c.i32_eqz(c.getLocal("scalarLength")),
            [
                ...c.call(opInit, c.getLocal("r")),
                ...c.ret([])
            ]
        )
    );
    f.addCode(c.call(opCopy, c.getLocal("base"), aux));
    f.addCode(c.call(opInit, c.getLocal("r")));
    f.addCode(c.setLocal("i", c.getLocal("scalarLength")));
    f.addCode(c.block(c.loop(
        c.setLocal("i", c.i32_sub(c.getLocal("i"), c.i32_const(1))),

        c.setLocal(
            "b",
            c.i32_load8_u(
                c.i32_add(
                    c.getLocal("scalar"),
                    c.getLocal("i")
                )
            )
        ),
        ...innerLoop(),
        c.br_if(1, c.i32_eqz ( c.getLocal("i") )),
        c.br(0)
    )));


    function innerLoop() {
        const code = [];
        for (let i=0; i<8; i++) {
            code.push(
                ...c.call(opAA, c.getLocal("r"), c.getLocal("r")),
                ...c.if(
                    c.i32_ge_u( c.getLocal("b"), c.i32_const(0x80 >> i)),
                    [
                        ...c.setLocal(
                            "b",
                            c.i32_sub(
                                c.getLocal("b"),
                                c.i32_const(0x80 >> i)
                            )
                        ),
                        ...c.call(opAB, c.getLocal("r"),aux, c.getLocal("r"))
                    ]
                )
            );
        }
        return code;
    }

};

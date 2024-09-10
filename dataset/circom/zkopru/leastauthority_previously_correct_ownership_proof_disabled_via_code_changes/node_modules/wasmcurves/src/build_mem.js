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

module.exports = function buildMem(module, prefix) {

    function buildCopy() {
        const f = module.addFunction(prefix+"copy");
        f.addParam("s", "i32");
        f.addParam("d", "i32");
        f.addParam("n", "i32");
        f.addLocal("bytesAfter", "i32");
        f.addLocal("sp", "i32");

        const c = f.getCodeBuilder();

        f.addCode(
            c.setLocal(
                "n64",
                c.i32_shl(
                    c.getLocal("n"),
                    c.i32_const(3)
                )
            ),
            c.setLocal(
                "bytesAfter",
                c.i32_and(
                    c.getLocal("n"),
                    c.i32_const(0x7)
                )
            ),
            c.setLocal("sp", c.getLocal("s")),
            c.setLocal("dp", c.getLocal("d")),
            c.setLocal("lastsp",
                c.add(
                    c.getLocal("s"),
                    c.i32_and(
                        c.getLocal("n"),
                        c.i32_const(0xFFFFFFF8)
                    )
                )
            ),


            c.block(c.loop(
                c.br_if(
                    1,
                    c.i32_eq(
                        c.getLocal("sp"),
                        c.getLocal("lastsp")
                    )
                ),
                c.i64_store(
                    c.getLocal("dp"),
                    c.i64_load(
                        c.getLocal("sp")
                    )
                ),
                c.setLocal("sp", c.i32_add(c.getLocal("sp"), c.i32_const(8))),
                c.setLocal("dp", c.i32_add(c.getLocal("dp"), c.i32_const(8))),
                c.br(0)
            )),

            c.if(
                c.getLocal("bytesAfter"),
                [
                    ...c.if(
                        c.i32_and(c.getLocal("bytesAfter"), c.i32_const(0x4)),
                        [
                            ...c.i32_store(
                                c.getLocal("dp"),
                                c.i32_load(
                                    c.getLocal("sp")
                                )
                            ),
                            ...c.setLocal("sp", c.i32_add(c.getLocal("sp"), c.i32_const(4))),
                            ...c.setLocal("dp", c.i32_add(c.getLocal("dp"), c.i32_const(4))),
                        ]
                    ),
                    ...c.if(
                        c.i32_and(c.getLocal("bytesAfter"), c.i32_const(0x2)),
                        [
                            ...c.i32_store16(
                                c.getLocal("dp"),
                                c.i32_load16(
                                    c.getLocal("sp")
                                )
                            ),
                            ...c.setLocal("sp", c.i32_add(c.getLocal("sp"), c.i32_const(2))),
                            ...c.setLocal("dp", c.i32_add(c.getLocal("dp"), c.i32_const(2))),
                        ]
                    ),
                    ...c.if(
                        c.i32_and(c.getLocal("bytesAfter"), c.i32_const(0x1)),
                        c.i32_store8(
                            c.getLocal("dp"),
                            c.i32_load8(
                                c.getLocal("sp")
                            )
                        )
                    )
                ]
            )
        );

    }

    buildCopy();
    module.exportFunction(prefix+"_copy");

    return prefix;
};

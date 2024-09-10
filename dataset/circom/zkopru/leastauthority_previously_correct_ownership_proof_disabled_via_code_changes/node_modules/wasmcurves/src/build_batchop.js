

module.exports = buildBatchConvertion;

function buildBatchConvertion(module, fnName, internalFnName, sizeIn, sizeOut, reverse) {
    if (typeof reverse === "undefined") {
        // Set the reverse in a way that allows to use the same buffer as in/out.
        if (sizeIn < sizeOut) {
            reverse = true;
        } else {
            reverse = false;
        }
    }

    const f = module.addFunction(fnName);
    f.addParam("pIn1", "i32");
    f.addParam("pIn2", "i32");
    f.addParam("n", "i32");
    f.addParam("pOut", "i32");
    f.addLocal("i", "i32");
    f.addLocal("itIn1", "i32");
    f.addLocal("itIn2", "i32");
    f.addLocal("itOut", "i32");

    const c = f.getCodeBuilder();

    if (reverse) {
        f.addCode(
            c.setLocal("itIn1",
                c.i32_add(
                    c.getLocal("pIn1"),
                    c.i32_mul(
                        c.i32_sub(
                            c.getLocal("n"),
                            c.i32_const(1)
                        ),
                        c.i32_const(sizeIn)
                    )
                )
            ),
            c.setLocal("itIn2",
                c.i32_add(
                    c.getLocal("pIn2"),
                    c.i32_mul(
                        c.i32_sub(
                            c.getLocal("n"),
                            c.i32_const(1)
                        ),
                        c.i32_const(sizeIn)
                    )
                )
            ),
            c.setLocal("itOut",
                c.i32_add(
                    c.getLocal("pOut"),
                    c.i32_mul(
                        c.i32_sub(
                            c.getLocal("n"),
                            c.i32_const(1)
                        ),
                        c.i32_const(sizeOut)
                    )
                )
            ),
            c.setLocal("i", c.i32_const(0)),
            c.block(c.loop(
                c.br_if(1, c.i32_eq ( c.getLocal("i"), c.getLocal("n") )),

                c.call(internalFnName, c.getLocal("itIn1"), c.getLocal("itIn2"), c.getLocal("itOut")),

                c.setLocal("itIn1", c.i32_sub(c.getLocal("itIn1"), c.i32_const(sizeIn))),
                c.setLocal("itIn2", c.i32_sub(c.getLocal("itIn2"), c.i32_const(sizeIn))),
                c.setLocal("itOut", c.i32_sub(c.getLocal("itOut"), c.i32_const(sizeOut))),
                c.setLocal("i", c.i32_add(c.getLocal("i"), c.i32_const(1))),
                c.br(0)
            )),
        );
    } else {
        f.addCode(
            c.setLocal("itIn1", c.getLocal("pIn1")),
            c.setLocal("itIn2", c.getLocal("pIn2")),
            c.setLocal("itOut", c.getLocal("pOut")),
            c.setLocal("i", c.i32_const(0)),
            c.block(c.loop(
                c.br_if(1, c.i32_eq ( c.getLocal("i"), c.getLocal("n") )),

                c.call(internalFnName, c.getLocal("itIn1"), c.getLocal("itIn2"), c.getLocal("itOut")),

                c.setLocal("itIn1", c.i32_add(c.getLocal("itIn1"), c.i32_const(sizeIn))),
                c.setLocal("itIn2", c.i32_add(c.getLocal("itIn2"), c.i32_const(sizeIn))),
                c.setLocal("itOut", c.i32_add(c.getLocal("itOut"), c.i32_const(sizeOut))),
                c.setLocal("i", c.i32_add(c.getLocal("i"), c.i32_const(1))),
                c.br(0)
            )),
        );
    }
}

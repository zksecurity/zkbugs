
module.exports = buildBatchInverse;

function buildBatchInverse(module, prefix) {


    const n8 = module.modules[prefix].n64*8;

    const f = module.addFunction(prefix+"_batchInverse");
    f.addParam("pIn", "i32");
    f.addParam("inStep", "i32");
    f.addParam("n", "i32");
    f.addParam("pOut", "i32");
    f.addParam("outStep", "i32");
    f.addLocal("itAux", "i32");
    f.addLocal("itIn", "i32");
    f.addLocal("itOut","i32");
    f.addLocal("i","i32");

    const c = f.getCodeBuilder();

    const AUX = c.i32_const(module.alloc(n8));


    // Alloc Working space for accumulated umltiplications
    f.addCode(
        c.setLocal("itAux", c.i32_load( c.i32_const(0) )),
        c.i32_store(
            c.i32_const(0),
            c.i32_add(
                c.getLocal("itAux"),
                c.i32_mul(
                    c.i32_add(
                        c.getLocal("n"),
                        c.i32_const(1)
                    ),
                    c.i32_const(n8)
                )
            )
        )
    );

    f.addCode(

        // aux[0] = a;
        c.call(prefix+"_one", c.getLocal("itAux")),
        // for (i=0;i<n;i++) aux[i] = aux[i-1]*in[i]
        c.setLocal("itIn", c.getLocal("pIn")),
        c.setLocal("itAux", c.i32_add(c.getLocal("itAux"), c.i32_const(n8))),
        c.setLocal("i", c.i32_const(0)),

        c.block(c.loop(
            c.br_if(1, c.i32_eq ( c.getLocal("i"), c.getLocal("n") )),
            c.if(
                c.call(prefix+"_isZero", c.getLocal("itIn")),
                c.call(
                    prefix + "_copy",
                    c.i32_sub(c.getLocal("itAux"), c.i32_const(n8)),
                    c.getLocal("itAux")
                ),
                c.call(
                    prefix+"_mul",
                    c.getLocal("itIn"),
                    c.i32_sub(c.getLocal("itAux"), c.i32_const(n8)),
                    c.getLocal("itAux")
                )
            ),
            c.setLocal("itIn", c.i32_add(c.getLocal("itIn"), c.getLocal("inStep"))),
            c.setLocal("itAux", c.i32_add(c.getLocal("itAux"), c.i32_const(n8))),
            c.setLocal("i", c.i32_add(c.getLocal("i"), c.i32_const(1))),
            c.br(0)
        )),

        // point to the last
        c.setLocal("itIn", c.i32_sub(c.getLocal("itIn"), c.getLocal("inStep"))),
        c.setLocal("itAux", c.i32_sub(c.getLocal("itAux"), c.i32_const(n8))),
        // itOut = pOut + (n-1)*stepOut   // Point to the last
        c.setLocal(
            "itOut",
            c.i32_add(
                c.getLocal("pOut"),
                c.i32_mul(
                    c.i32_sub(c.getLocal("n"), c.i32_const(1)),
                    c.getLocal("outStep"),
                )
            )
        ),

        // aux[n-1] = 1/aux[n-1]
        c.call(prefix+"_inverse", c.getLocal("itAux"), c.getLocal("itAux") ),

        c.block(c.loop(
            c.br_if(1, c.i32_eqz( c.getLocal("i"))),
            c.if(
                c.call(prefix+"_isZero", c.getLocal("itIn")),
                [
                    ...c.call(
                        prefix + "_copy",
                        c.getLocal("itAux"),
                        c.i32_sub(c.getLocal("itAux"), c.i32_const(n8)),
                    ),
                    ...c.call(
                        prefix + "_zero",
                        c.getLocal("itOut")
                    )
                ],[
                    ...c.call(prefix + "_copy", c.i32_sub(c.getLocal("itAux"), c.i32_const(n8)), AUX),
                    ...c.call(
                        prefix+"_mul",
                        c.getLocal("itAux"),
                        c.getLocal("itIn"),
                        c.i32_sub(c.getLocal("itAux"), c.i32_const(n8)),
                    ),
                    ...c.call(
                        prefix+"_mul",
                        c.getLocal("itAux"),
                        AUX,
                        c.getLocal("itOut")
                    )
                ]
            ),
            c.setLocal("itIn", c.i32_sub(c.getLocal("itIn"), c.getLocal("inStep"))),
            c.setLocal("itOut", c.i32_sub(c.getLocal("itOut"), c.getLocal("outStep"))),
            c.setLocal("itAux", c.i32_sub(c.getLocal("itAux"), c.i32_const(n8))),
            c.setLocal("i", c.i32_sub(c.getLocal("i"), c.i32_const(1))),
            c.br(0)
        ))

    );


    // Recover Old memory
    f.addCode(
        c.i32_store(
            c.i32_const(0),
            c.getLocal("itAux")
        )
    );

}

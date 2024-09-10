
module.exports = function buildQAP(module, prefix, prefixField) {

    const n64 = module.modules[prefixField].n64;
    const n8 = n64*8;


    function buildBuildABC() {
        const f = module.addFunction(prefix+"_buildABC");
        f.addParam("pCoefs", "i32");
        f.addParam("nCoefs", "i32");
        f.addParam("pWitness", "i32");
        f.addParam("pA", "i32");
        f.addParam("pB", "i32");
        f.addParam("pC", "i32");
        f.addParam("offsetOut", "i32");
        f.addParam("nOut", "i32");
        f.addParam("offsetWitness", "i32");
        f.addParam("nWitness", "i32");
        f.addLocal("it", "i32");
        f.addLocal("ita", "i32");
        f.addLocal("itb", "i32");
        f.addLocal("last", "i32");
        f.addLocal("m", "i32");
        f.addLocal("c", "i32");
        f.addLocal("s", "i32");
        f.addLocal("pOut", "i32");

        const c = f.getCodeBuilder();

        const aux = c.i32_const(module.alloc(n8));

        f.addCode(

            // Set output a and b to 0
            c.setLocal("ita", c.getLocal("pA")),
            c.setLocal("itb", c.getLocal("pB")),
            c.setLocal(
                "last",
                c.i32_add(
                    c.getLocal("pA"),
                    c.i32_mul(
                        c.getLocal("nOut"),
                        c.i32_const(n8)
                    )
                )
            ),
            c.block(c.loop(
                c.br_if(
                    1,
                    c.i32_eq(
                        c.getLocal("ita"),
                        c.getLocal("last")
                    )
                ),
                c.call(prefixField + "_zero", c.getLocal("ita")),
                c.call(prefixField + "_zero", c.getLocal("itb")),
                c.setLocal("ita", c.i32_add(c.getLocal("ita"), c.i32_const(n8))),
                c.setLocal("itb", c.i32_add(c.getLocal("itb"), c.i32_const(n8))),
                c.br(0)
            )),


            c.setLocal("it", c.getLocal("pCoefs")),
            c.setLocal(
                "last",
                c.i32_add(
                    c.getLocal("pCoefs"),
                    c.i32_mul(
                        c.getLocal("nCoefs"),
                        c.i32_const(n8+12)
                    )
                )
            ),
            c.block(c.loop(
                c.br_if(
                    1,
                    c.i32_eq(
                        c.getLocal("it"),
                        c.getLocal("last")
                    )
                ),
                c.setLocal(
                    "s",
                    c.i32_load(c.getLocal("it"), 8)
                ),
                c.if(
                    c.i32_or(
                        c.i32_lt_u(
                            c.getLocal("s"),
                            c.getLocal("offsetWitness"),
                        ),
                        c.i32_ge_u(
                            c.getLocal("s"),
                            c.i32_add(
                                c.getLocal("offsetWitness"),
                                c.getLocal("nWitness"),
                            )
                        )
                    ),
                    [
                        ...c.setLocal("it", c.i32_add(c.getLocal("it"), c.i32_const(n8+12))),
                        ...c.br(1)
                    ]
                ),

                c.setLocal(
                    "m",
                    c.i32_load(c.getLocal("it"))
                ),
                c.if(
                    c.i32_eq(c.getLocal("m"), c.i32_const(0)),
                    c.setLocal("pOut", c.getLocal("pA")),
                    c.if(
                        c.i32_eq(c.getLocal("m"), c.i32_const(1)),
                        c.setLocal("pOut", c.getLocal("pB")),
                        [
                            ...c.setLocal("it", c.i32_add(c.getLocal("it"), c.i32_const(n8+12))),
                            ...c.br(1)
                        ]
                    )
                ),
                c.setLocal(
                    "c",
                    c.i32_load(c.getLocal("it"), 4)
                ),
                c.if(
                    c.i32_or(
                        c.i32_lt_u(
                            c.getLocal("c"),
                            c.getLocal("offsetOut"),
                        ),
                        c.i32_ge_u(
                            c.getLocal("c"),
                            c.i32_add(
                                c.getLocal("offsetOut"),
                                c.getLocal("nOut"),
                            )
                        )
                    ),
                    [
                        ...c.setLocal("it", c.i32_add(c.getLocal("it"), c.i32_const(n8+12))),
                        ...c.br(1)
                    ]
                ),
                c.setLocal(
                    "pOut",
                    c.i32_add(
                        c.getLocal("pOut"),
                        c.i32_mul(
                            c.i32_sub(
                                c.getLocal("c"),
                                c.getLocal("offsetOut")
                            ),
                            c.i32_const(n8)
                        )
                    )
                ),
                c.call(
                    prefixField + "_mul",
                    c.i32_add(
                        c.getLocal("pWitness"),
                        c.i32_mul(
                            c.i32_sub(c.getLocal("s"), c.getLocal("offsetWitness")),
                            c.i32_const(n8)
                        )
                    ),
                    c.i32_add( c.getLocal("it"), c.i32_const(12)),
                    aux
                ),
                c.call(
                    prefixField + "_add",
                    c.getLocal("pOut"),
                    aux,
                    c.getLocal("pOut"),
                ),
                c.setLocal("it", c.i32_add(c.getLocal("it"), c.i32_const(n8+12))),
                c.br(0)
            )),

            c.setLocal("ita", c.getLocal("pA")),
            c.setLocal("itb", c.getLocal("pB")),
            c.setLocal("it", c.getLocal("pC")),
            c.setLocal(
                "last",
                c.i32_add(
                    c.getLocal("pA"),
                    c.i32_mul(
                        c.getLocal("nOut"),
                        c.i32_const(n8)
                    )
                )
            ),
            c.block(c.loop(
                c.br_if(
                    1,
                    c.i32_eq(
                        c.getLocal("ita"),
                        c.getLocal("last")
                    )
                ),
                c.call(
                    prefixField + "_mul",
                    c.getLocal("ita"),
                    c.getLocal("itb"),
                    c.getLocal("it")
                ),
                c.setLocal("ita", c.i32_add(c.getLocal("ita"), c.i32_const(n8))),
                c.setLocal("itb", c.i32_add(c.getLocal("itb"), c.i32_const(n8))),
                c.setLocal("it", c.i32_add(c.getLocal("it"), c.i32_const(n8))),
                c.br(0)
            )),

        );
    }

    function buildJoinABC() {
        const f = module.addFunction(prefix+"_joinABC");
        f.addParam("pA", "i32");
        f.addParam("pB", "i32");
        f.addParam("pC", "i32");
        f.addParam("n", "i32");
        f.addParam("pP", "i32");
        f.addLocal("ita", "i32");
        f.addLocal("itb", "i32");
        f.addLocal("itc", "i32");
        f.addLocal("itp", "i32");
        f.addLocal("last", "i32");

        const c = f.getCodeBuilder();

        const aux = c.i32_const(module.alloc(n8));

        f.addCode(
            c.setLocal("ita", c.getLocal("pA")),
            c.setLocal("itb", c.getLocal("pB")),
            c.setLocal("itc", c.getLocal("pC")),
            c.setLocal("itp", c.getLocal("pP")),
            c.setLocal(
                "last",
                c.i32_add(
                    c.getLocal("pA"),
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
                        c.getLocal("ita"),
                        c.getLocal("last")
                    )
                ),
                c.call(
                    prefixField + "_mul",
                    c.getLocal("ita"),
                    c.getLocal("itb"),
                    aux
                ),
                c.call(
                    prefixField + "_sub",
                    aux,
                    c.getLocal("itc"),
                    c.getLocal("itp"),
                ),
                c.setLocal("ita", c.i32_add(c.getLocal("ita"), c.i32_const(n8))),
                c.setLocal("itb", c.i32_add(c.getLocal("itb"), c.i32_const(n8))),
                c.setLocal("itc", c.i32_add(c.getLocal("itc"), c.i32_const(n8))),
                c.setLocal("itp", c.i32_add(c.getLocal("itp"), c.i32_const(n8))),
                c.br(0)
            ))
        );
    }

    function buildBatchAdd() {
        const f = module.addFunction(prefix+"_batchAdd");
        f.addParam("pa", "i32");
        f.addParam("pb", "i32");
        f.addParam("n", "i32");
        f.addParam("pr", "i32");
        f.addLocal("ita", "i32");
        f.addLocal("itb", "i32");
        f.addLocal("itr", "i32");
        f.addLocal("last", "i32");

        const c = f.getCodeBuilder();

        f.addCode(
            c.setLocal("ita", c.getLocal("pa")),
            c.setLocal("itb", c.getLocal("pb")),
            c.setLocal("itr", c.getLocal("pr")),
            c.setLocal(
                "last",
                c.i32_add(
                    c.getLocal("pa"),
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
                        c.getLocal("ita"),
                        c.getLocal("last")
                    )
                ),
                c.call(
                    prefixField + "_add",
                    c.getLocal("ita"),
                    c.getLocal("itb"),
                    c.getLocal("itr"),
                ),
                c.setLocal("ita", c.i32_add(c.getLocal("ita"), c.i32_const(n8))),
                c.setLocal("itb", c.i32_add(c.getLocal("itb"), c.i32_const(n8))),
                c.setLocal("itr", c.i32_add(c.getLocal("itr"), c.i32_const(n8))),
                c.br(0)
            ))
        );
    }

    buildBuildABC();
    buildJoinABC();
    buildBatchAdd();

    module.exportFunction(prefix + "_buildABC");
    module.exportFunction(prefix + "_joinABC");
    module.exportFunction(prefix + "_batchAdd");

    return prefix;

};


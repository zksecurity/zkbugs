const assert = require("assert");

module.exports = function buildTomCook(module, _prefix) {

    const prefix = _prefix || "tomcook";
    const definedFunctions = {};

    const CHUNK_BITS = 29;
    const CHUNK_BASE = 1 << CHUNK_BITS;
    const CHUNK_BASE_MAX = "9223372036317904896";

    function load(size, c, localVar, pos) {
        if (size == "l") {
            return c.i64_load(c.getLocal(localVar), pos*8);
        } else if (size=="s") {
            return c.i64_load32_s(c.getLocal(localVar), pos*4);
        } else {
            assert(false, "invalid size: "+size);
        }
    }

    function store(size, c, localVar, pos, value) {
        if (size == "l") {
            return c.i64_store(c.getLocal(localVar), pos*8, value);
        } else if (size == "s") {
            return c.i64_store32(c.getLocal(localVar), pos*4, value);
        } else {
            assert(false, "invalid size: "+size);
        }
    }

    function storeAdjusting(size, c, carryVar, dstVar, auxVar, pos) {
        return c.if(
            c.i64_lt_s(
                c.getLocal(carryVar),
                c.i64_const(0)
            ),
            [
                ...c.setLocal(auxVar,
                    c.i64_rem_s(
                        c.i64_add(
                            c.i64_const(CHUNK_BASE_MAX),
                            c.getLocal(carryVar)
                        ),
                        c.i64_const(CHUNK_BASE)
                    )
                ),
                ...store(size, c, dstVar, pos, c.getLocal(auxVar)),
                ...c.setLocal(carryVar,
                    c.i64_sub(
                        c.getLocal(carryVar),
                        c.getLocal(auxVar)
                    )
                )
            ]
            ,  // elsif
            [
                ...store(size, c, dstVar, pos,
                    c.i64_rem_s(
                        c.getLocal(carryVar),
                        c.i64_const(CHUNK_BASE)
                    )
                ),
            ]
        );
    }

    function buildMul3(sizes) {
        const fnName = prefix+"_mul3"+sizes;
        if (definedFunctions[fnName]) return;
        definedFunctions[fnName] = true;

        const f = module.addFunction(fnName);
        f.addParam("x", "i32");
        f.addParam("y", "i32");
        f.addParam("r", "i32");

        f.addLocal("a0", "i64");
        f.addLocal("a1", "i64");
        f.addLocal("a2", "i64");
        f.addLocal("b0", "i64");
        f.addLocal("b1", "i64");
        f.addLocal("b2", "i64");

        f.addLocal("c", "i64");

        const c = f.getCodeBuilder();

        f.addCode(
            // calculate p

            c.setLocal("a0", load(sizes[0], c, "x", 0)),
            c.setLocal("b0", load(sizes[1], c, "y", 0)),

            c.setLocal("c", c.i64_mul( c.getLocal("a0"), c.getLocal("b0") )),

            store(sizes[2], c, "r", 0,
                c.i64_rem_s( c.getLocal("c"), c.i64_const(CHUNK_BASE))
            ),

            c.setLocal("a1", load(sizes[0], c, "x", 1)),
            c.setLocal("b1", load(sizes[1], c, "y", 1)),

            c.setLocal("c", c.i64_add(
                c.i64_div_s( c.getLocal("c"), c.i64_const(CHUNK_BASE)),
                c.i64_add(
                    c.i64_mul( c.getLocal("a0"), c.getLocal("b1") ),
                    c.i64_mul( c.getLocal("a1"), c.getLocal("b0") )
                )
            )),
            store(sizes[2], c, "r", 1,
                c.i64_rem_s( c.getLocal("c"), c.i64_const(CHUNK_BASE))
            ),

            c.setLocal("a2", load(sizes[0], c, "x", 2)),
            c.setLocal("b2", load(sizes[1], c, "y", 2)),

            c.setLocal("c", c.i64_add(
                c.i64_add(
                    c.i64_mul( c.getLocal("a0"), c.getLocal("b2") ),
                    c.i64_mul( c.getLocal("a2"), c.getLocal("b0") )
                ),
                c.i64_add(
                    c.i64_div_s( c.getLocal("c"), c.i64_const(CHUNK_BASE)),
                    c.i64_mul( c.getLocal("a1"), c.getLocal("b1") ),
                )
            )),
            store(sizes[2], c, "r", 2,
                c.i64_rem_s( c.getLocal("c"), c.i64_const(CHUNK_BASE))
            ),

            c.setLocal("c", c.i64_add(
                c.i64_add(
                    c.i64_div_s( c.getLocal("c"), c.i64_const(CHUNK_BASE)),
                    c.i64_mul( c.getLocal("a1"), c.getLocal("b2"))
                ),
                c.i64_mul( c.getLocal("a2"), c.getLocal("b1") ),
            )),
            store(sizes[2], c, "r", 3,
                c.i64_rem_s( c.getLocal("c"), c.i64_const(CHUNK_BASE))
            ),

            c.setLocal("c", c.i64_add(
                c.i64_mul( c.getLocal("a2"), c.getLocal("b2") ),
                c.i64_div_s( c.getLocal("c"), c.i64_const(CHUNK_BASE)),
            )),
            store(sizes[2], c, "r", 4,
                c.i64_rem_s( c.getLocal("c"), c.i64_const(CHUNK_BASE))
            ),

            store(sizes[2], c, "r", 5,
                c.i64_div_s( c.getLocal("c"), c.i64_const(CHUNK_BASE)),
            ),
        );
    }

    function buildAdd(n, sizes) {

        const fnName = prefix+"_add"+n+sizes;
        if (definedFunctions[fnName]) return;
        definedFunctions[fnName] = true;


        const f = module.addFunction(fnName);
        f.addParam("x", "i32");
        f.addParam("y", "i32");
        f.addParam("r", "i32");

        const c = f.getCodeBuilder();

        for (let i=0; i<n; i++) {
            f.addCode(
                store(sizes[2], c, "r", i,
                    c.i64_add(
                        load(sizes[0], c, "x", i),
                        load(sizes[1], c, "y", i)
                    )
                )
            );
        }
    }


    function buildSub(n, sizes) {
        const fnName = prefix+"_sub"+n+sizes;
        if (definedFunctions[fnName]) return;
        definedFunctions[fnName] = true;

        const f = module.addFunction(fnName);
        f.addParam("x", "i32");
        f.addParam("y", "i32");
        f.addParam("r", "i32");

        const c = f.getCodeBuilder();

        for (let i=0; i<n; i++) {
            f.addCode(
                store(sizes[2], c, "r", i,
                    c.i64_sub(
                        load(sizes[0], c, "x", i),
                        load(sizes[1], c, "y", i)
                    )
                )
            );
        }
    }


    function buildMulShort(n, sizes) {
        const fnName = prefix+"_mulshort"+n+sizes;
        if (definedFunctions[fnName]) return;
        definedFunctions[fnName] = true;


        const f = module.addFunction(fnName);
        f.addParam("x", "i32");
        f.addParam("s", "i32");
        f.addParam("r", "i32");

        f.addLocal("s64", "i64");

        const c = f.getCodeBuilder();

        f.addCode(c.setLocal("s64", c.i64_extend_i32_s(c.getLocal("s"))));
        for (let i=0; i<n; i++) {
            f.addCode(
                store(sizes[1], c, "r", i,
                    c.i64_mul(
                        load(sizes[0], c, "x", i),
                        c.getLocal("s64")
                    )
                )
            );
        }
    }

    function buildDivShort(n, sizes) {
        const fnName = prefix+"_divshort"+n+sizes;
        if (definedFunctions[fnName]) return;
        definedFunctions[fnName] = true;

        const f = module.addFunction(fnName);
        f.addParam("x", "i32");
        f.addParam("s", "i32");
        f.addParam("r", "i32");

        f.addLocal("c", "i64");
        f.addLocal("s64", "i64");

        const c = f.getCodeBuilder();

        f.addCode(
            c.setLocal("s64", c.i64_extend_i32_s(c.getLocal("s"))),
            c.setLocal("c", load(sizes[0], c, "x", n-1)),
            store(sizes[1], c, "r", n-1,
                c.i64_div_s(
                    c.getLocal("c"),
                    c.getLocal("s64")
                )
            )
        );

        for (let i=n-2; i>=0; i--) {
            f.addCode(
                c.setLocal("c",
                    c.i64_add(
                        c.i64_mul(
                            c.i64_rem_s(
                                c.getLocal("c"),
                                c.getLocal("s64")
                            ),
                            c.i64_const(CHUNK_BASE)
                        ),
                        load(sizes[0], c, "x", i)
                    )
                ),

                store(sizes[1], c, "r", i,
                    c.i64_div_s(
                        c.getLocal("c"),
                        c.getLocal("s64")
                    )
                )
            );
        }
    }


    function buildRecompose(n, sizes) {

        const fnName = prefix+"_recompose"+n+sizes;
        if (definedFunctions[fnName]) return;
        definedFunctions[fnName] = true;

        const sn = n/3;
        const f = module.addFunction(fnName);
        f.addParam("s", "i32");
        f.addParam("r", "i32");

        f.addLocal("c", "i64");
        f.addLocal("aux", "i64");

        const c = f.getCodeBuilder();

        /*
            0     sn        sn*2   sn*3   sn*4   sn*5
            0     sn
                  sn*2      sn*3
                            sn*4   sn*5
                                   sn+6   sn*7
                                          sn*8   sn*9


            b= Math.floor(i/sn)

            b*2*sn  + (i-b*sn)
            b*2*sn  + (i-b*sn) - sn
        */

        f.addCode(c.setLocal("c", c.i64_const(0)));

        for (let i=0; i<sn; i++) {
            f.addCode(
                c.setLocal(
                    "c",
                    c.i64_add(
                        c.i64_div_s(c.getLocal("c"), c.i64_const(CHUNK_BASE)),
                        load("l", c, "s", i)
                    )
                ),

                storeAdjusting(sizes[0], c, "c", "r", "aux", i)
            );
        }


        for (let i=sn; i<sn*5; i++) {

            const b= Math.floor(i/sn);
            const i1 = b*2*sn  + (i-b*sn);
            const i2 = i1 - sn;

            f.addCode(
                c.setLocal(
                    "c",
                    c.i64_add(
                        c.i64_div_s(c.getLocal("c"), c.i64_const(CHUNK_BASE)),
                        c.i64_add(
                            load("l", c, "s", i1),
                            load("l", c, "s", i2)
                        )
                    )
                )
            );

            f.addCode(
                storeAdjusting(sizes[0], c, "c", "r", "aux", i)
            );
        }


        for (let i=sn*5; i<n*2; i++) {

            const b= Math.floor(i/sn);
            const i1 = b*2*sn  + (i-b*sn);
            const i2 = i1 - sn;

            f.addCode(
                c.setLocal(
                    "c",
                    c.i64_add(
                        c.i64_div_s(c.getLocal("c"), c.i64_const(CHUNK_BASE)),
                        load("l", c, "s", i2)
                    )
                ),

                storeAdjusting(sizes[0], c, "c", "r", "aux", i)
            );
        }
    }

    function buildMul(n, sizes) {

        if (n==3) {
            return buildMul3(sizes);
        }

        const fnName = prefix+"_mul"+n+sizes;
        if (definedFunctions[fnName]) return;
        definedFunctions[fnName] = true;

        const sn = n/3;
        const sn2 = sn*2;

        buildAdd(sn, sizes[0]+sizes[0]+"l");
        buildAdd(sn, "l"+sizes[0]+"l");
        buildSub(sn, "l"+sizes[0]+"l");
        buildAdd(sn, sizes[1]+sizes[1]+"l");
        buildAdd(sn, "l"+sizes[1]+"l");
        buildSub(sn, "l"+sizes[1]+"l");
        buildMulShort(sn, "ll");
        buildMul(sn, "lll");
        buildMul(sn, sizes[0]+sizes[1]+"l");

        buildMulShort(sn2, "ll");
        buildDivShort(sn2, "ll");
        buildAdd(sn2, "lll");
        buildSub(sn2, "lll");
        buildRecompose(n, sizes[2]);


        const f = module.addFunction(fnName);
        f.addParam("x", "i32");
        f.addParam("y", "i32");
        f.addParam("r", "i32");

        f.addLocal("m1", "i32");
        f.addLocal("m2", "i32");

        f.addLocal("n1", "i32");
        f.addLocal("n2", "i32");


        const c = f.getCodeBuilder();

        const ws0 = sizes[0] == "s" ? 4 : 8;
        const ws1 = sizes[1] == "s" ? 4 : 8;
        const wsi = 8;

        const m0 = c.getLocal("x");
        f.addCode(c.setLocal("m1", c.i32_add( c.getLocal("x"), c.i32_const(sn*ws0) )));
        const m1 = c.getLocal("m1");
        f.addCode(c.setLocal("m2", c.i32_add( c.getLocal("x"), c.i32_const((sn*2)*ws0 ))));
        const m2 = c.getLocal("m2");

        const n0 = c.getLocal("y");
        f.addCode(c.setLocal("n1", c.i32_add( c.getLocal("y"), c.i32_const(sn*ws1) )));
        const n1 = c.getLocal("n1");
        f.addCode(c.setLocal("n2", c.i32_add( c.getLocal("y"), c.i32_const((sn*2)*ws1 ))));
        const n2 = c.getLocal("n2");

        const po = c.i32_const(module.alloc(sn*wsi));
        f.addCode(c.call(prefix + "_add" + sn + sizes[0]+sizes[0]+"l", m0, m2, po));
        const p0 = m0;
        const p1 = c.i32_const(module.alloc(sn*wsi));
        f.addCode(c.call(prefix + "_add" + sn + "l"+sizes[0]+"l", po, m1, p1));
        const pn1 = c.i32_const(module.alloc(sn*wsi));
        f.addCode(c.call(prefix + "_sub" + sn + "l"+sizes[0]+"l", po, m1, pn1));
        const pn2 = c.i32_const(module.alloc(sn*wsi));
        f.addCode(
            c.call(prefix + "_add" + sn + "l"+sizes[0]+"l", pn1, m2, pn2),
            c.call(prefix + "_mulshort" + sn + "ll", pn2, c.i32_const(2), pn2),
            c.call(prefix + "_sub" + sn + "l"+sizes[0]+"l", pn2, m0, pn2)
        );
        const pi = m2;

        const qo = c.i32_const(module.alloc(sn*wsi));
        f.addCode(c.call(prefix + "_add" + sn + sizes[1]+sizes[1]+"l", n0, n2, qo));
        const q0 = n0;
        const q1 = c.i32_const(module.alloc(sn*wsi));
        f.addCode(c.call(prefix + "_add" + sn + "l"+sizes[1]+"l", qo, n1, q1));
        const qn1 = c.i32_const(module.alloc(sn*wsi));
        f.addCode(c.call(prefix + "_sub" + sn + "l"+sizes[1]+"l", qo, n1, qn1));
        const qn2 = c.i32_const(module.alloc(sn*wsi));
        f.addCode(
            c.call(prefix + "_add" + sn + "l"+sizes[1]+"l", qn1, n2, qn2),
            c.call(prefix + "_mulshort" + sn +"ll", qn2, c.i32_const(2), qn2),
            c.call(prefix + "_sub" + sn + "l"+sizes[1]+"l", qn2, n0, qn2)
        );
        const qi = n2;

        const ps0 = module.alloc(sn*2*5*wsi);
        const s0 = c.i32_const(ps0);
        const s1 = c.i32_const(ps0 + (2*sn)*wsi);
        const s2 = c.i32_const(ps0 + (4*sn)*wsi);
        const s3 = c.i32_const(ps0 + (6*sn)*wsi);
        const s4 = c.i32_const(ps0 + (8*sn)*wsi);

        const r0 = s0;
        const r1 = c.i32_const(module.alloc(sn*2*wsi));
        const rn1 = c.i32_const(module.alloc(sn*2*wsi));
        const rn2 = c.i32_const(module.alloc(sn*2*wsi));
        const ri = s4;

        f.addCode(c.call(prefix + "_mul" + sn + sizes[0]+sizes[1]+"l", p0, q0, r0));
        f.addCode(c.call(prefix + "_mul" + sn + "lll" , p1, q1, r1));
        f.addCode(c.call(prefix + "_mul" + sn + "lll" , pn1, qn1, rn1));
        f.addCode(c.call(prefix + "_mul" + sn + "lll" , pn2, qn2, rn2));
        f.addCode(c.call(prefix + "_mul" + sn + sizes[0]+sizes[1]+"l", pi, qi, ri));

        const aux = c.i32_const(module.alloc(sn*wsi));

        f.addCode(

            // s3 = (r(-2) - r(1))/3
            c.call(prefix + "_sub" + sn2 + "lll", rn2, r1, s3),
            c.call(prefix + "_divshort" + sn2 + "ll", s3, c.i32_const(3), s3),

            // s1 = (r(1) - r(-1))/2
            c.call(prefix + "_sub" + sn2 + "lll", r1, rn1, s1),
            c.call(prefix + "_divshort" + sn2 + "ll", s1, c.i32_const(2), s1),

            // s2 = r(-1) - r(0)
            c.call(prefix + "_sub" + sn2 + "lll", rn1, r0, s2),

            // s3 = (s2-s3)/2 + r(inf)*2
            c.call(prefix + "_sub" + sn2 + "lll", s2, s3, s3),
            c.call(prefix + "_divshort" + sn2 + "ll", s3, c.i32_const(2), s3),
            c.call(prefix + "_mulshort" + sn2 + "ll", ri, c.i32_const(2), aux),
            c.call(prefix + "_add" + sn2 + "lll", s3, aux, s3),

            // s2 = s2 + s1 - s4
            c.call(prefix + "_add" + sn2 + "lll", s2, s1, s2),
            c.call(prefix + "_sub" + sn2 + "lll", s2, s4, s2),

            // s1 = s1 - s3
            c.call(prefix + "_sub" + sn2 + "lll", s1, s3, s1),
        );

        f.addCode(c.call(prefix + "_recompose"+ n + sizes[2], s0, c.getLocal("r")));

    }


    buildMul(9, "sss");
    module.exportFunction(prefix+"_mul9sss", prefix+"_mul9");

    buildDivShort(6, "ss");
    module.exportFunction(prefix+"_divshort6ss", prefix+"_divshort6");

    buildMulShort(6, "ss");
    module.exportFunction(prefix+"_mulshort6ss", prefix+"_mulshort6");

    buildMul(3, "sss");
    module.exportFunction(prefix+"_mul3sss", prefix+"_mul3");

};

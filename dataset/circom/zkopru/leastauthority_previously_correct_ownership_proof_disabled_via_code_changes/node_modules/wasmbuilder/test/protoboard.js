import assert from "assert";

import { buildProtoboard } from "../main.js";

describe("Basic protoboard test", () => {
    it("Should generate a basic protoboard", async () => {
        const pb = await buildProtoboard(function(module) {

            buildTest1();
            buildTest2();
            buildTest3();

            function buildTest1() {
                const f = module.addFunction("test1");

                const c = f.getCodeBuilder();
                f.addCode(c.call("log32", c.i32_const(44)));


                module.exportFunction("test1");

            }

            function buildTest2() {
                const f = module.addFunction("test2");

                const c = f.getCodeBuilder();
                f.addCode(c.call("log64", c.i64_const(66)));


                module.exportFunction("test2");

            }

            // Regression test for PR#20
            function buildTest3() {
                const f = module.addFunction("test3");

                const c = f.getCodeBuilder();
                f.addCode(c.call("log32", c.i32_const(-66)));

                module.exportFunction("test3");
            }
        });

        const logs = [];
        pb.log = function(S) {
            logs.push(S);
        };

        pb.test1();
        pb.test2();
        pb.test3();

        assert.equal(logs[0], "0000002c: 44");
        assert.equal(logs[1], "0000000000000042: 66");
        // Regression test for PR#20
        assert.equal(logs[2], "ffffffbe: 4294967230");
    });

    it("Can `alloc`, `set`, and `get` data", async() => {
        const n8q=48;

        const pb = await buildProtoboard(function() {}, n8q);

        const e1 = pb.alloc(n8q*2);
        const pos = pb.set(e1, 1n);

        assert.equal(pb.get(pos), 1n);
    });
});

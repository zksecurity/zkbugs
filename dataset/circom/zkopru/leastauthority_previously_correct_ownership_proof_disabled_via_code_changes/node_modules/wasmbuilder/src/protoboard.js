/*
    Copyright 2019 0KIMS association.

    This file is part of websnark (Web Assembly zkSnark Prover).

    websnark is a free software: you can redistribute it and/or modify it
    under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    websnark is distributed in the hope that it will be useful, but WITHOUT
    ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
    or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public
    License for more details.

    You should have received a copy of the GNU General Public License
    along with websnark. If not, see <https://www.gnu.org/licenses/>.
*/

import { ModuleBuilder } from "./modulebuilder.js";

export async function buildProtoboard(builder, defBytes, bitsPerBytes) {
    const protoboard = new Protoboard();

    protoboard.defBytes = defBytes;
    protoboard.bitsPerBytes = bitsPerBytes || 32;

    protoboard.memory = new WebAssembly.Memory({initial:20000});
    protoboard.i32 = new Uint32Array(protoboard.memory.buffer);
    protoboard.i8 = new Uint8Array(protoboard.memory.buffer);

    const moduleBuilder = new ModuleBuilder();

    const fLog32 = moduleBuilder.addIimportFunction("debug_log32", "debug", "log32");
    fLog32.addParam("x", "i32");
    const fLog64 = moduleBuilder.addIimportFunction("debug_log64", "debug", "log64");
    fLog64.addParam("x", "i32");
    fLog64.addParam("y", "i32");

    buildLog32(moduleBuilder);
    buildLog64(moduleBuilder);

    builder(moduleBuilder, protoboard);


    const code = moduleBuilder.build();

    const wasmModule = await WebAssembly.compile(code);

    protoboard.log = console.log;

    protoboard.instance = await WebAssembly.instantiate(wasmModule, {
        env: {
            "memory": protoboard.memory
        },
        debug: {
            log32: function (c1) {
                if (c1<0) c1 = 0x100000000+c1;
                let s=c1.toString(16);
                while (s.length<8) s = "0"+s;
                protoboard.log(s + ": " + c1.toString());
            },
            log64: function (c1, c2) {
                if (c1<0) c1 = 0x100000000+c1;
                if (c2<0) c2 = 0x100000000+c2;
                const n = BigInt(c1) + (BigInt(c2) << 32n);
                let s=n.toString(16);
                while (s.length<16) s = "0"+s;
                protoboard.log(s + ": " + n.toString());
            }
        }
    });

    Object.assign(protoboard, protoboard.instance.exports);
    Object.assign(protoboard, moduleBuilder.modules);

    return protoboard;

    function buildLog32(module) {

        const f = module.addFunction("log32");
        f.addParam("x", "i32");

        const c = f.getCodeBuilder();
        f.addCode(c.call("debug_log32", c.getLocal("x")));
    }

    function buildLog64(module) {

        const f = module.addFunction("log64");
        f.addParam("x", "i64");

        const c = f.getCodeBuilder();
        f.addCode(c.call(
            "debug_log64",
            c.i32_wrap_i64(c.getLocal("x")),
            c.i32_wrap_i64(
                c.i64_shr_u(
                    c.getLocal("x"),
                    c.i64_const(32)
                )
            )
        ));
    }

}

class Protoboard {

    constructor() {

    }

    alloc(length) {
        if (typeof length === "undefined") {
            length = this.defBytes;
        }
        length = (((length-1)>>3) +1)<<3;       // Align to 64 bits.

        const res = this.i32[0];
        this.i32[0] += length;
        return res;
    }

    set(pos, nums, nBytes) {
        if (!Array.isArray(nums)) {
            nums = [nums];
        }
        if (typeof nBytes === "undefined") {
            nBytes = this.defBytes;
        }

        const words = Math.floor((nBytes -1)/4)+1;
        let p = pos;

        const CHUNK = 1n << BigInt(this.bitsPerBytes);

        for (let i=0; i<nums.length; i++) {
            let v = BigInt(nums[i]);
            for (let j=0; j<words; j++) {
                const quotient = v / CHUNK;
                const remainder = v % CHUNK;
                this.i32[p>>2] = Number(remainder);
                v = quotient;
                p += 4;
            }
            if (v !== 0n) {
                throw new Error("Expected v to be 0");
            }
        }

        return pos;
    }

    get(pos, nElements, nBytes) {
        if (typeof nBytes == "undefined") {
            if (typeof nElements == "undefined") {
                nElements = 1;
                nBytes = this.defBytes;
            } else {
                nElements = nBytes;
                nBytes = this.defBytes;
            }
        }

        const words = Math.floor((nBytes -1)/4)+1;

        const CHUNK = 1n << BigInt(this.bitsPerBytes);


        const nums = [];
        for (let i=0; i<nElements; i++) {
            let acc = 0n;
            for (let j=words-1; j>=0; j--) {
                acc = acc * CHUNK;
                let v = this.i32[(pos>>2)+j];
                if (this.bitsPerBytes <32) {
                    if (v&0x80000000) v = v-0x100000000;
                }
                acc = acc + BigInt(v);
            }
            nums.push(acc);
            pos += words*4;
        }

        if (nums.length == 1) return nums[0];
        return nums;
    }
}

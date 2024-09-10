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

const ModuleBuilder = require("wasmbuilder").ModuleBuilder;
const buildF1 = require("./build_f1.js");
const buildTestF1 = require("./build_testf1.js");
const { bitLength } = require("./bigint.js");

async function build(q) {
    const f1 = new F1(q);

    f1.q = BigInt(q);
    f1.n64 = Math.floor((bitLength(f1.q - 1n) - 1)/64) +1;
    f1.n32 = f1.n64*2;
    f1.n8 = f1.n64*8;

    f1.memory = new WebAssembly.Memory({initial:1});
    f1.i32 = new Uint32Array(f1.memory.buffer);

    const moduleBuilder = new ModuleBuilder();
    buildF1(moduleBuilder, f1.q);
    buildTestF1(moduleBuilder);

    const code = moduleBuilder.build();

    const wasmModule = await WebAssembly.compile(code);

    f1.instance = await WebAssembly.instantiate(wasmModule, {
        env: {
            "memory": f1.memory
        }
    });

    Object.assign(f1, f1.instance.exports);

    return f1;
}

class F1 {

    constructor() {

    }

    alloc(length) {
        const res = this.i32[0];
        this.i32[0] += length;
        return res;
    }

    putInt(pos, _a) {
        const a = BigInt(_a);
        if (pos & 0x7) throw new Error("Pointer must be aligned");
        if (bitLength(a) > this.n64*64) {
            return this.putInt(a % this.q);
        }
        for (let i=0; i<this.n32; i++) {
            this.i32[(pos>>2)+i] = Number(a >> BigInt(i*32) & 0xFFFFFFFFn);
        }
    }

    allocInt(_a) {
        const p = this.alloc(this.n8);
        if (_a) this.putInt(p, _a);
        return p;
    }

    putInt2(pos, _a) {
        const a = BigInt(_a);
        if (pos & 0x7) throw new Error("Pointer must be aligned");
        if (bitLength(a) > this.n64*64*2) {
            return this.putInt(a % this.q);
        }
        for (let i=0; i<this.n32*2; i++) {
            this.i32[(pos>>2)+i] = Number(a >> BigInt(i*32) & 0xFFFFFFFFn);
        }
    }

    getInt(pos) {
        if (pos & 0x7) throw new Error("Pointer must be aligned");
        let acc = BigInt(this.i32[(pos>>2)+this.n32-1]);
        for (let i=this.n32-2; i>=0; i--) {
            acc = acc << 32n;
            acc = acc + BigInt(this.i32[(pos>>2)+i]);
        }
        return acc;
    }

    getInt2(pos) {
        if (pos & 0x7) throw new Error("Pointer must be aligned");
        const last = this.n32*2-1;
        let acc = BigInt(this.i32[(pos>>2)+last]);
        for (let i=last; i>=0; i--) {
            acc = acc << 32n;
            acc = acc + BigInt(this.i32[(pos>>2)+i]);
        }
        return acc;
    }

    allocInt2(_a) {
        const p = this.alloc(this.n8*2);
        if (_a) this.putInt2(p, _a);
        return p;
    }

    test_F1(n) {
        const start = new Date().getTime();

        this.instance.exports.testF1(n);

        const end = new Date().getTime();
        const time = end - start;

        return time;
    }
/*
    function test(n) {

        const q = 21888242871839275222246405745257275088696311157297823662689037894645226208583n;
        let a = (1n << 512n)%q ;
        let b = a >> 128n;

        let c;

        const start = new Date().getTime();
        for (let i=0; i<n; i++) c = a+b;

        const end = new Date().getTime();
        const time = end - start;

        console.log(time);
    }
*/
}

module.exports = build;

'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

/*
    Copyright 2019 0KIMS association.

    This file is part of wasmbuilder

    wasmbuilder is a free software: you can redistribute it and/or modify it
    under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    wasmbuilder is distributed in the hope that it will be useful, but WITHOUT
    ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
    or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public
    License for more details.

    You should have received a copy of the GNU General Public License
    along with wasmbuilder. If not, see <https://www.gnu.org/licenses/>.
*/

function toNumber(n) {
    return BigInt(n);
}

function isNegative(n) {
    return n < 0n;
}

function isZero(n) {
    return n === 0n;
}

function bitLength(n) {
    if (isNegative(n)) {
        return n.toString(2).length - 1; // discard the - sign
    } else {
        return n.toString(2).length;
    }
}

function u32(n) {
    const b = [];
    const v = toNumber(n);
    b.push(Number(v & 0xFFn));
    b.push(Number(v >> 8n & 0xFFn));
    b.push(Number(v >> 16n & 0xFFn));
    b.push(Number(v >> 24n & 0xFFn));
    return b;
}

function toUTF8Array(str) {
    var utf8 = [];
    for (var i=0; i < str.length; i++) {
        var charcode = str.charCodeAt(i);
        if (charcode < 0x80) utf8.push(charcode);
        else if (charcode < 0x800) {
            utf8.push(0xc0 | (charcode >> 6),
                0x80 | (charcode & 0x3f));
        }
        else if (charcode < 0xd800 || charcode >= 0xe000) {
            utf8.push(0xe0 | (charcode >> 12),
                0x80 | ((charcode>>6) & 0x3f),
                0x80 | (charcode & 0x3f));
        }
        // surrogate pair
        else {
            i++;
            // UTF-16 encodes 0x10000-0x10FFFF by
            // subtracting 0x10000 and splitting the
            // 20 bits of 0x0-0xFFFFF into two halves
            charcode = 0x10000 + (((charcode & 0x3ff)<<10)
                      | (str.charCodeAt(i) & 0x3ff));
            utf8.push(0xf0 | (charcode >>18),
                0x80 | ((charcode>>12) & 0x3f),
                0x80 | ((charcode>>6) & 0x3f),
                0x80 | (charcode & 0x3f));
        }
    }
    return utf8;
}

function string(str) {
    const bytes = toUTF8Array(str);
    return [ ...varuint32(bytes.length), ...bytes ];
}

function varuint(n) {
    const code = [];
    let v = toNumber(n);
    if (isNegative(v)) throw new Error("Number cannot be negative");
    while (!isZero(v)) {
        code.push(Number(v & 0x7Fn));
        v = v >> 7n;
    }
    if (code.length==0) code.push(0);
    for (let i=0; i<code.length-1; i++) {
        code[i] = code[i] | 0x80;
    }
    return code;
}

function varint(_n) {
    let n, sign;
    const bits = bitLength(_n);
    if (_n<0) {
        sign = true;
        n = (1n << BigInt(bits)) + _n;
    } else {
        sign = false;
        n = toNumber(_n);
    }
    const paddingBits = 7 - (bits % 7);

    const padding = ((1n << BigInt(paddingBits)) - 1n) << BigInt(bits);
    const paddingMask = ((1 << (7 - paddingBits))-1) | 0x80;

    const code = varuint(n + padding);

    if (!sign) {
        code[code.length-1] = code[code.length-1] & paddingMask;
    }

    return code;
}

function varint32(n) {
    let v = toNumber(n);
    if (v > 0xFFFFFFFFn) throw new Error("Number too big");
    if (v > 0x7FFFFFFFn) v = v - 0x100000000n;
    // bigInt("-80000000", 16) as base10
    if (v < -2147483648n) throw new Error("Number too small");
    return varint(v);
}

function varint64(n) {
    let v = toNumber(n);
    if (v > 0xFFFFFFFFFFFFFFFFn) throw new Error("Number too big");
    if (v > 0x7FFFFFFFFFFFFFFFn) v = v - 0x10000000000000000n;
    // bigInt("-8000000000000000", 16) as base10
    if (v < -9223372036854775808n) throw new Error("Number too small");
    return varint(v);
}

function varuint32(n) {
    let v = toNumber(n);
    if (v > 0xFFFFFFFFn) throw new Error("Number too big");
    return varuint(v);
}

function toHexString(byteArray) {
    return Array.from(byteArray, function(byte) {
        return ("0" + (byte & 0xFF).toString(16)).slice(-2);
    }).join("");
}

function ident(text) {
    if (typeof text === "string") {
        let lines = text.split("\n");
        for (let i=0; i<lines.length; i++) {
            if (lines[i]) lines[i] = "    "+lines[i];
        }
        return lines.join("\n");
    } else if (Array.isArray(text)) {
        for (let i=0; i<text.length; i++ ) {
            text[i] = ident(text[i]);
        }
        return text;
    }
}

/*
    Copyright 2019 0KIMS association.

    This file is part of wasmbuilder

    wasmbuilder is a free software: you can redistribute it and/or modify it
    under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    wasmbuilder is distributed in the hope that it will be useful, but WITHOUT
    ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
    or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public
    License for more details.

    You should have received a copy of the GNU General Public License
    along with wasmbuilder. If not, see <https://www.gnu.org/licenses/>.
*/

class CodeBuilder {
    constructor(func) {
        this.func = func;
        this.functionName = func.functionName;
        this.module = func.module;
    }

    setLocal(localName, valCode) {
        const idx = this.func.localIdxByName[localName];
        if (idx === undefined)
            throw new Error(`Local Variable not defined: Function: ${this.functionName} local: ${localName} `);
        return [...valCode, 0x21, ...varuint32( idx )];
    }

    teeLocal(localName, valCode) {
        const idx = this.func.localIdxByName[localName];
        if (idx === undefined)
            throw new Error(`Local Variable not defined: Function: ${this.functionName} local: ${localName} `);
        return [...valCode, 0x22, ...varuint32( idx )];
    }

    getLocal(localName) {
        const idx = this.func.localIdxByName[localName];
        if (idx === undefined)
            throw new Error(`Local Variable not defined: Function: ${this.functionName} local: ${localName} `);
        return [0x20, ...varuint32( idx )];
    }

    i64_load8_s(idxCode, _offset, _align) {
        const offset = _offset || 0;
        const align = (_align === undefined) ? 0 : _align;  // 8 bits alignment by default
        return [...idxCode, 0x30, align, ...varuint32(offset)];
    }

    i64_load8_u(idxCode, _offset, _align) {
        const offset = _offset || 0;
        const align = (_align === undefined) ? 0 : _align;  // 8 bits alignment by default
        return [...idxCode, 0x31, align, ...varuint32(offset)];
    }

    i64_load16_s(idxCode, _offset, _align) {
        const offset = _offset || 0;
        const align = (_align === undefined) ? 1 : _align;  // 16 bits alignment by default
        return [...idxCode, 0x32, align, ...varuint32(offset)];
    }

    i64_load16_u(idxCode, _offset, _align) {
        const offset = _offset || 0;
        const align = (_align === undefined) ? 1 : _align;  // 16 bits alignment by default
        return [...idxCode, 0x33, align, ...varuint32(offset)];
    }

    i64_load32_s(idxCode, _offset, _align) {
        const offset = _offset || 0;
        const align = (_align === undefined) ? 2 : _align;  // 32 bits alignment by default
        return [...idxCode, 0x34, align, ...varuint32(offset)];
    }

    i64_load32_u(idxCode, _offset, _align) {
        const offset = _offset || 0;
        const align = (_align === undefined) ? 2 : _align;  // 32 bits alignment by default
        return [...idxCode, 0x35, align, ...varuint32(offset)];
    }

    i64_load(idxCode, _offset, _align) {
        const offset = _offset || 0;
        const align = (_align === undefined) ? 3 : _align;  // 64 bits alignment by default
        return [...idxCode, 0x29, align, ...varuint32(offset)];
    }


    i64_store(idxCode, _offset, _align, _codeVal) {
        let offset, align, codeVal;
        if (Array.isArray(_offset)) {
            offset = 0;
            align = 3;
            codeVal = _offset;
        } else if (Array.isArray(_align)) {
            offset = _offset;
            align = 3;
            codeVal = _align;
        } else if (Array.isArray(_codeVal)) {
            offset = _offset;
            align = _align;
            codeVal = _codeVal;
        }
        return [...idxCode, ...codeVal, 0x37, align, ...varuint32(offset)];
    }

    i64_store32(idxCode, _offset, _align, _codeVal) {
        let offset, align, codeVal;
        if (Array.isArray(_offset)) {
            offset = 0;
            align = 2;
            codeVal = _offset;
        } else if (Array.isArray(_align)) {
            offset = _offset;
            align = 2;
            codeVal = _align;
        } else if (Array.isArray(_codeVal)) {
            offset = _offset;
            align = _align;
            codeVal = _codeVal;
        }
        return [...idxCode, ...codeVal, 0x3e, align, ...varuint32(offset)];
    }


    i64_store16(idxCode, _offset, _align, _codeVal) {
        let offset, align, codeVal;
        if (Array.isArray(_offset)) {
            offset = 0;
            align = 1;
            codeVal = _offset;
        } else if (Array.isArray(_align)) {
            offset = _offset;
            align = 1;
            codeVal = _align;
        } else if (Array.isArray(_codeVal)) {
            offset = _offset;
            align = _align;
            codeVal = _codeVal;
        }
        return [...idxCode, ...codeVal, 0x3d, align, ...varuint32(offset)];
    }


    i64_store8(idxCode, _offset, _align, _codeVal) {
        let offset, align, codeVal;
        if (Array.isArray(_offset)) {
            offset = 0;
            align = 0;
            codeVal = _offset;
        } else if (Array.isArray(_align)) {
            offset = _offset;
            align = 0;
            codeVal = _align;
        } else if (Array.isArray(_codeVal)) {
            offset = _offset;
            align = _align;
            codeVal = _codeVal;
        }
        return [...idxCode, ...codeVal, 0x3c, align, ...varuint32(offset)];
    }

    i32_load8_s(idxCode, _offset, _align) {
        const offset = _offset || 0;
        const align = (_align === undefined) ? 0 : _align;  // 32 bits alignment by default
        return [...idxCode, 0x2c, align, ...varuint32(offset)];
    }

    i32_load8_u(idxCode, _offset, _align) {
        const offset = _offset || 0;
        const align = (_align === undefined) ? 0 : _align;  // 32 bits alignment by default
        return [...idxCode, 0x2d, align, ...varuint32(offset)];
    }

    i32_load16_s(idxCode, _offset, _align) {
        const offset = _offset || 0;
        const align = (_align === undefined) ? 1 : _align;  // 32 bits alignment by default
        return [...idxCode, 0x2e, align, ...varuint32(offset)];
    }

    i32_load16_u(idxCode, _offset, _align) {
        const offset = _offset || 0;
        const align = (_align === undefined) ? 1 : _align;  // 32 bits alignment by default
        return [...idxCode, 0x2f, align, ...varuint32(offset)];
    }

    i32_load(idxCode, _offset, _align) {
        const offset = _offset || 0;
        const align = (_align === undefined) ? 2 : _align;  // 32 bits alignment by default
        return [...idxCode, 0x28, align, ...varuint32(offset)];
    }

    i32_store(idxCode, _offset, _align, _codeVal) {
        let offset, align, codeVal;
        if (Array.isArray(_offset)) {
            offset = 0;
            align = 2;
            codeVal = _offset;
        } else if (Array.isArray(_align)) {
            offset = _offset;
            align = 2;
            codeVal = _align;
        } else if (Array.isArray(_codeVal)) {
            offset = _offset;
            align = _align;
            codeVal = _codeVal;
        }
        return [...idxCode, ...codeVal, 0x36, align, ...varuint32(offset)];
    }


    i32_store16(idxCode, _offset, _align, _codeVal) {
        let offset, align, codeVal;
        if (Array.isArray(_offset)) {
            offset = 0;
            align = 1;
            codeVal = _offset;
        } else if (Array.isArray(_align)) {
            offset = _offset;
            align = 1;
            codeVal = _align;
        } else if (Array.isArray(_codeVal)) {
            offset = _offset;
            align = _align;
            codeVal = _codeVal;
        }
        return [...idxCode, ...codeVal, 0x3b, align, ...varuint32(offset)];
    }

    i32_store8(idxCode, _offset, _align, _codeVal) {
        let offset, align, codeVal;
        if (Array.isArray(_offset)) {
            offset = 0;
            align = 0;
            codeVal = _offset;
        } else if (Array.isArray(_align)) {
            offset = _offset;
            align = 0;
            codeVal = _align;
        } else if (Array.isArray(_codeVal)) {
            offset = _offset;
            align = _align;
            codeVal = _codeVal;
        }
        return [...idxCode, ...codeVal, 0x3a, align, ...varuint32(offset)];
    }

    call(fnName, ...args) {
        const idx = this.module.functionIdxByName[fnName];
        if (idx === undefined)
            throw new Error(`Function not defined: Function: ${fnName}`);
        return [...[].concat(...args), 0x10, ...varuint32(idx)];
    }

    call_indirect(fnIdx, ...args) {
        return [...[].concat(...args), ...fnIdx, 0x11, 0, 0];
    }

    if(condCode, thenCode, elseCode) {
        if (elseCode) {
            return [...condCode, 0x04, 0x40, ...thenCode, 0x05, ...elseCode, 0x0b];
        } else {
            return [...condCode, 0x04, 0x40, ...thenCode, 0x0b];
        }
    }

    block(bCode) { return [0x02, 0x40, ...bCode, 0x0b]; }
    loop(...args) {
        return [0x03, 0x40, ...[].concat(...[...args]), 0x0b];
    }
    br_if(relPath, condCode) { return [...condCode, 0x0d, ...varuint32(relPath)]; }
    br(relPath) { return [0x0c, ...varuint32(relPath)]; }
    ret(rCode) { return [...rCode, 0x0f]; }
    drop(dCode) { return [...dCode,  0x1a]; }

    i64_const(num) { return [0x42, ...varint64(num)]; }
    i32_const(num) { return [0x41, ...varint32(num)]; }


    i64_eqz(opcode) { return [...opcode, 0x50]; }
    i64_eq(op1code, op2code) { return [...op1code, ...op2code, 0x51]; }
    i64_ne(op1code, op2code) { return [...op1code, ...op2code, 0x52]; }
    i64_lt_s(op1code, op2code) { return [...op1code, ...op2code, 0x53]; }
    i64_lt_u(op1code, op2code) { return [...op1code, ...op2code, 0x54]; }
    i64_gt_s(op1code, op2code) { return [...op1code, ...op2code, 0x55]; }
    i64_gt_u(op1code, op2code) { return [...op1code, ...op2code, 0x56]; }
    i64_le_s(op1code, op2code) { return [...op1code, ...op2code, 0x57]; }
    i64_le_u(op1code, op2code) { return [...op1code, ...op2code, 0x58]; }
    i64_ge_s(op1code, op2code) { return [...op1code, ...op2code, 0x59]; }
    i64_ge_u(op1code, op2code) { return [...op1code, ...op2code, 0x5a]; }
    i64_add(op1code, op2code) { return [...op1code, ...op2code, 0x7c]; }
    i64_sub(op1code, op2code) { return [...op1code, ...op2code, 0x7d]; }
    i64_mul(op1code, op2code) { return [...op1code, ...op2code, 0x7e]; }
    i64_div_s(op1code, op2code) { return [...op1code, ...op2code, 0x7f]; }
    i64_div_u(op1code, op2code) { return [...op1code, ...op2code, 0x80]; }
    i64_rem_s(op1code, op2code) { return [...op1code, ...op2code, 0x81]; }
    i64_rem_u(op1code, op2code) { return [...op1code, ...op2code, 0x82]; }
    i64_and(op1code, op2code) { return [...op1code, ...op2code, 0x83]; }
    i64_or(op1code, op2code) { return [...op1code, ...op2code, 0x84]; }
    i64_xor(op1code, op2code) { return [...op1code, ...op2code, 0x85]; }
    i64_shl(op1code, op2code) { return [...op1code, ...op2code, 0x86]; }
    i64_shr_s(op1code, op2code) { return [...op1code, ...op2code, 0x87]; }
    i64_shr_u(op1code, op2code) { return [...op1code, ...op2code, 0x88]; }
    i64_extend_i32_s(op1code) { return [...op1code, 0xac]; }
    i64_extend_i32_u(op1code) { return [...op1code, 0xad]; }
    i64_clz(op1code) { return [...op1code, 0x79]; }
    i64_ctz(op1code) { return [...op1code, 0x7a]; }

    i32_eqz(op1code) { return [...op1code, 0x45]; }
    i32_eq(op1code, op2code) { return [...op1code, ...op2code, 0x46]; }
    i32_ne(op1code, op2code) { return [...op1code, ...op2code, 0x47]; }
    i32_lt_s(op1code, op2code) { return [...op1code, ...op2code, 0x48]; }
    i32_lt_u(op1code, op2code) { return [...op1code, ...op2code, 0x49]; }
    i32_gt_s(op1code, op2code) { return [...op1code, ...op2code, 0x4a]; }
    i32_gt_u(op1code, op2code) { return [...op1code, ...op2code, 0x4b]; }
    i32_le_s(op1code, op2code) { return [...op1code, ...op2code, 0x4c]; }
    i32_le_u(op1code, op2code) { return [...op1code, ...op2code, 0x4d]; }
    i32_ge_s(op1code, op2code) { return [...op1code, ...op2code, 0x4e]; }
    i32_ge_u(op1code, op2code) { return [...op1code, ...op2code, 0x4f]; }
    i32_add(op1code, op2code) { return [...op1code, ...op2code, 0x6a]; }
    i32_sub(op1code, op2code) { return [...op1code, ...op2code, 0x6b]; }
    i32_mul(op1code, op2code) { return [...op1code, ...op2code, 0x6c]; }
    i32_div_s(op1code, op2code) { return [...op1code, ...op2code, 0x6d]; }
    i32_div_u(op1code, op2code) { return [...op1code, ...op2code, 0x6e]; }
    i32_rem_s(op1code, op2code) { return [...op1code, ...op2code, 0x6f]; }
    i32_rem_u(op1code, op2code) { return [...op1code, ...op2code, 0x70]; }
    i32_and(op1code, op2code) { return [...op1code, ...op2code, 0x71]; }
    i32_or(op1code, op2code) { return [...op1code, ...op2code, 0x72]; }
    i32_xor(op1code, op2code) { return [...op1code, ...op2code, 0x73]; }
    i32_shl(op1code, op2code) { return [...op1code, ...op2code, 0x74]; }
    i32_shr_s(op1code, op2code) { return [...op1code, ...op2code, 0x75]; }
    i32_shr_u(op1code, op2code) { return [...op1code, ...op2code, 0x76]; }
    i32_rotl(op1code, op2code) { return [...op1code, ...op2code, 0x77]; }
    i32_rotr(op1code, op2code) { return [...op1code, ...op2code, 0x78]; }
    i32_wrap_i64(op1code) { return [...op1code, 0xa7]; }
    i32_clz(op1code) { return [...op1code, 0x67]; }
    i32_ctz(op1code) { return [...op1code, 0x68]; }

    unreachable() { return [ 0x0 ]; }

    current_memory() { return [ 0x3f, 0]; }

    comment() { return []; }
}

/*
    Copyright 2019 0KIMS association.

    This file is part of wasmbuilder

    wasmbuilder is a free software: you can redistribute it and/or modify it
    under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    wasmbuilder is distributed in the hope that it will be useful, but WITHOUT
    ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
    or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public
    License for more details.

    You should have received a copy of the GNU General Public License
    along with wasmbuilder. If not, see <https://www.gnu.org/licenses/>.
*/

const typeCodes = {
    "i32": 0x7f,
    "i64": 0x7e,
    "f32": 0x7d,
    "f64": 0x7c,
    "anyfunc": 0x70,
    "func": 0x60,
    "emptyblock": 0x40
};


class FunctionBuilder {

    constructor (module, fnName, fnType, moduleName, fieldName) {
        if (fnType == "import") {
            this.fnType = "import";
            this.moduleName = moduleName;
            this.fieldName = fieldName;
        } else if (fnType == "internal") {
            this.fnType = "internal";
        } else {
            throw new Error("Invalid function fnType: " + fnType);
        }
        this.module = module;
        this.fnName = fnName;
        this.params = [];
        this.locals = [];
        this.localIdxByName = {};
        this.code = [];
        this.returnType = null;
        this.nextLocal =0;
    }

    addParam(paramName, paramType) {
        if (this.localIdxByName[paramName])
            throw new Error(`param already exists. Function: ${this.fnName}, Param: ${paramName} `);
        const idx = this.nextLocal++;
        this.localIdxByName[paramName] = idx;
        this.params.push({
            type: paramType
        });
    }

    addLocal(localName, localType, _length) {
        const length = _length || 1;
        if (this.localIdxByName[localName])
            throw new Error(`local already exists. Function: ${this.fnName}, Param: ${localName} `);
        const idx = this.nextLocal++;
        this.localIdxByName[localName] = idx;
        this.locals.push({
            type: localType,
            length: length
        });
    }

    setReturnType(returnType) {
        if (this.returnType)
            throw new Error(`returnType already defined. Function: ${this.fnName}`);
        this.returnType = returnType;
    }

    getSignature() {
        const params = [...varuint32(this.params.length), ...this.params.map((p) => typeCodes[p.type])];
        const returns = this.returnType ? [0x01, typeCodes[this.returnType]] : [0];
        return [0x60, ...params, ...returns];
    }

    getBody() {
        const locals = this.locals.map((l) => [
            ...varuint32(l.length),
            typeCodes[l.type]
        ]);

        const body = [
            ...varuint32(this.locals.length),
            ...[].concat(...locals),
            ...this.code,
            0x0b
        ];
        return [
            ...varuint32(body.length),
            ...body
        ];
    }

    addCode(...code) {
        this.code.push(...[].concat(...[...code]));
    }

    getCodeBuilder() {
        return new CodeBuilder(this);
    }
}

/*
    Copyright 2019 0KIMS association.

    This file is part of wasmbuilder

    wasmbuilder is a free software: you can redistribute it and/or modify it
    under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    wasmbuilder is distributed in the hope that it will be useful, but WITHOUT
    ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
    or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public
    License for more details.

    You should have received a copy of the GNU General Public License
    along with wasmbuilder. If not, see <https://www.gnu.org/licenses/>.
*/

class ModuleBuilder {

    constructor() {
        this.functions = [];
        this.functionIdxByName = {};
        this.nImportFunctions = 0;
        this.nInternalFunctions =0;
        this.memory = {
            pagesSize: 1,
            moduleName: "env",
            fieldName: "memory"
        };
        this.free = 8;
        this.datas = [];
        this.modules = {};
        this.exports = [];
        this.functionsTable = [];
    }

    build() {
        this._setSignatures();
        return new Uint8Array([
            ...u32(0x6d736100),
            ...u32(1),
            ...this._buildType(),
            ...this._buildImport(),
            ...this._buildFunctionDeclarations(),
            ...this._buildFunctionsTable(),
            ...this._buildExports(),
            ...this._buildElements(),
            ...this._buildCode(),
            ...this._buildData()
        ]);
    }

    addFunction(fnName) {
        if (typeof(this.functionIdxByName[fnName]) !== "undefined")
            throw new Error(`Function already defined: ${fnName}`);

        const idx = this.functions.length;
        this.functionIdxByName[fnName] = idx;

        this.functions.push(new FunctionBuilder(this, fnName, "internal"));

        this.nInternalFunctions++;
        return this.functions[idx];
    }

    addIimportFunction(fnName, moduleName, _fieldName) {
        if (typeof(this.functionIdxByName[fnName]) !== "undefined")
            throw new Error(`Function already defined: ${fnName}`);

        if (  (this.functions.length>0)
            &&(this.functions[this.functions.length-1].type == "internal"))
            throw new Error(`Import functions must be declared before internal: ${fnName}`);

        let fieldName = _fieldName || fnName;

        const idx = this.functions.length;
        this.functionIdxByName[fnName] = idx;

        this.functions.push(new FunctionBuilder(this, fnName, "import", moduleName, fieldName));

        this.nImportFunctions ++;
        return this.functions[idx];
    }

    setMemory(pagesSize, moduleName, fieldName) {
        this.memory = {
            pagesSize: pagesSize,
            moduleName: moduleName || "env",
            fieldName: fieldName || "memory"
        };
    }

    exportFunction(fnName, _exportName) {
        const exportName = _exportName || fnName;
        if (typeof(this.functionIdxByName[fnName]) === "undefined")
            throw new Error(`Function not defined: ${fnName}`);
        const idx = this.functionIdxByName[fnName];
        if (exportName != fnName) {
            this.functionIdxByName[exportName] = idx;
        }
        this.exports.push({
            exportName: exportName,
            idx: idx
        });
    }

    addFunctionToTable(fnName) {
        const idx = this.functionIdxByName[fnName];
        this.functionsTable.push(idx);
    }

    addData(offset, bytes) {
        this.datas.push({
            offset: offset,
            bytes: bytes
        });
    }

    alloc(a, b) {
        let size;
        let bytes;
        if ((Array.isArray(a) || ArrayBuffer.isView(a)) && (typeof(b) === "undefined")) {
            size = a.length;
            bytes = a;
        } else {
            size = a;
            bytes = b;
        }
        size = (((size-1)>>3) +1)<<3;       // Align to 64 bits.
        const p = this.free;
        this.free += size;
        if (bytes) {
            this.addData(p, bytes);
        }
        return p;
    }

    allocString(s) {
        const encoder = new globalThis.TextEncoder();
        const uint8array = encoder.encode(s);
        return this.alloc([...uint8array, 0]);
    }

    _setSignatures() {
        this.signatures = [];
        const signatureIdxByName = {};
        if (this.functionsTable.length>0) {
            const signature = this.functions[this.functionsTable[0]].getSignature();
            const signatureName = "s_"+toHexString(signature);
            signatureIdxByName[signatureName] = 0;
            this.signatures.push(signature);
        }
        for (let i=0; i<this.functions.length; i++) {
            const signature = this.functions[i].getSignature();
            const signatureName = "s_"+toHexString(signature);
            if (typeof(signatureIdxByName[signatureName]) === "undefined") {
                signatureIdxByName[signatureName] = this.signatures.length;
                this.signatures.push(signature);
            }

            this.functions[i].signatureIdx = signatureIdxByName[signatureName];
        }

    }

    _buildSection(sectionType, section) {
        return [sectionType, ...varuint32(section.length), ...section];
    }

    _buildType() {
        return this._buildSection(
            0x01,
            [
                ...varuint32(this.signatures.length),
                ...[].concat(...this.signatures)
            ]
        );
    }

    _buildImport() {
        const entries = [];
        entries.push([
            ...string(this.memory.moduleName),
            ...string(this.memory.fieldName),
            0x02,
            0x00,   //Flags no init valua
            ...varuint32(this.memory.pagesSize)
        ]);
        for (let i=0; i< this.nImportFunctions; i++) {
            entries.push([
                ...string(this.functions[i].moduleName),
                ...string(this.functions[i].fieldName),
                0x00,
                ...varuint32(this.functions[i].signatureIdx)
            ]);
        }
        return this._buildSection(
            0x02,
            varuint32(entries.length).concat(...entries)
        );
    }

    _buildFunctionDeclarations() {
        const entries = [];
        for (let i=this.nImportFunctions; i< this.nImportFunctions + this.nInternalFunctions; i++) {
            entries.push(...varuint32(this.functions[i].signatureIdx));
        }
        return this._buildSection(
            0x03,
            [
                ...varuint32(entries.length),
                ...[...entries]
            ]
        );
    }

    _buildFunctionsTable() {
        if (this.functionsTable.length == 0) return [];
        return this._buildSection(
            0x04,
            [
                ...varuint32(1),
                0x70, 0, ...varuint32(this.functionsTable.length)
            ]
        );
    }

    _buildElements() {
        if (this.functionsTable.length == 0) return [];
        const entries = [];
        for (let i=0; i<this.functionsTable.length; i++) {
            entries.push(...varuint32(this.functionsTable[i]));
        }
        return this._buildSection(
            0x09,
            [
                ...varuint32(1),      // 1 entry
                ...varuint32(0),      // Table (0 in MVP)
                0x41,                       // offset 0
                ...varint32(0),
                0x0b,
                ...varuint32(this.functionsTable.length), // Number of elements
                ...[...entries]
            ]
        );
    }

    _buildExports() {
        const entries = [];
        for (let i=0; i< this.exports.length; i++) {
            entries.push([
                ...string(this.exports[i].exportName),
                0x00,
                ...varuint32(this.exports[i].idx)
            ]);
        }
        return this._buildSection(
            0x07,
            varuint32(entries.length).concat(...entries)
        );
    }

    _buildCode() {
        const entries = [];
        for (let i=this.nImportFunctions; i< this.nImportFunctions + this.nInternalFunctions; i++) {
            entries.push(this.functions[i].getBody());
        }
        return this._buildSection(
            0x0a,
            varuint32(entries.length).concat(...entries)
        );
    }

    _buildData() {
        const entries = [];
        entries.push([
            0x00,
            0x41,
            0x00,
            0x0b,
            0x04,
            ...u32(this.free)
        ]);
        for (let i=0; i< this.datas.length; i++) {
            entries.push([
                0x00,
                0x41,
                ...varint32(this.datas[i].offset),
                0x0b,
                ...varuint32(this.datas[i].bytes.length),
                ...this.datas[i].bytes,
            ]);
        }
        return this._buildSection(
            0x0b,
            varuint32(entries.length).concat(...entries)
        );
    }

}

/*
    Copyright 2019 0KIMS association.

    This file is part of wasmbuilder

    wasmbuilder is a free software: you can redistribute it and/or modify it
    under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    wasmbuilder is distributed in the hope that it will be useful, but WITHOUT
    ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
    or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public
    License for more details.

    You should have received a copy of the GNU General Public License
    along with wasmbuilder. If not, see <https://www.gnu.org/licenses/>.
*/

class CodeBuilderWat {
    constructor(func) {
        this.func = func;
        this.functionName = func.functionName;
        this.module = func.module;
    }

    setLocal(localName, valCode) {
        const idx = this.func.localIdxByName[localName];
        if (idx === undefined)
            throw new Error(`Local Variable not defined: Function: ${this.functionName} local: ${localName} `);
        return [valCode, `set_local $${localName}`];
    }

    teeLocal(localName, valCode) {
        const idx = this.func.localIdxByName[localName];
        if (idx === undefined)
            throw new Error(`Local Variable not defined: Function: ${this.functionName} local: ${localName} `);
        return [valCode, `tee_local $${localName}`];
    }

    getLocal(localName) {
        const idx = this.func.localIdxByName[localName];
        if (idx === undefined)
            throw new Error(`Local Variable not defined: Function: ${this.functionName} local: ${localName} `);
        return `get_local $${localName}`;
    }

    genLoad(inst, def_align, idxCode, _offset, _align) {
        let S = inst;
        const offset = _offset || 0;
        if (offset>0) S += ` offset=${offset}`;
        const align = (_align === undefined) ? def_align : _align;  // 8 bits alignment by default
        if (align!=def_align) S += ` align=${1 << align}`;
        return [idxCode, S];
    }


    genStore(inst, def_align, idxCode, _offset, _align, _codeVal) {
        let offset, align, codeVal;
        if (typeof _align === "undefined") {
            offset = 0;
            align = def_align;
            codeVal = _offset;
        } else if (typeof _codeVal === "undefined") {
            offset = _offset;
            align = def_align;
            codeVal = _align;
        } else {
            offset = _offset;
            align = _align;
            codeVal = _codeVal;
        }
        let S = inst;
        if (offset>0) S += ` offset=${offset}`;
        if (align!=def_align) S += ` align=${1 << align}`;
        return [idxCode, codeVal, S];
    }

    i64_load8_s(idxCode, _offset, _align) {
        return this.genLoad("i64.load8_s", 0, idxCode, _offset, _align);
    }

    i64_load8_u(idxCode, _offset, _align) {
        return this.genLoad("i64.load8_u", 0, idxCode, _offset, _align);
    }

    i64_load16_s(idxCode, _offset, _align) {
        return this.genLoad("i64.load16_s", 1,idxCode, _offset, _align);
    }

    i64_load16_u(idxCode, _offset, _align) {
        return this.genLoad("i64.load16_u", 1, idxCode, _offset, _align);
    }

    i64_load32_s(idxCode, _offset, _align) {
        return this.genLoad("i64.load32_s", 2, idxCode, _offset, _align);
    }

    i64_load32_u(idxCode, _offset, _align) {
        return this.genLoad("i64.load32_u", 2, idxCode, _offset, _align);
    }

    i64_load(idxCode, _offset, _align) {
        return this.genLoad("i64.load", 3, idxCode, _offset, _align);
    }


    i64_store(idxCode, _offset, _align, _codeVal) {
        return this.genStore("i64.store", 3, idxCode, _offset, _align, _codeVal);
    }

    i64_store32(idxCode, _offset, _align, _codeVal) {
        return this.genStore("i64.store32", 2, idxCode, _offset, _align, _codeVal);
    }

    i64_store16(idxCode, _offset, _align, _codeVal) {
        return this.genStore("i64.store16", 1, idxCode, _offset, _align, _codeVal);
    }

    i64_store8(idxCode, _offset, _align, _codeVal) {
        return this.genStore("i64.store8", 0, idxCode, _offset, _align, _codeVal);
    }

    i32_load8_s(idxCode, _offset, _align) {
        return this.genLoad("i32.load8_s", 0, idxCode, _offset, _align);
    }

    i32_load8_u(idxCode, _offset, _align) {
        return this.genLoad("i32.load8_u", 0, idxCode, _offset, _align);
    }

    i32_load16_s(idxCode, _offset, _align) {
        return this.genLoad("i32.load16_s", 1, idxCode, _offset, _align);
    }

    i32_load16_u(idxCode, _offset, _align) {
        return this.genLoad("i32.load16_u", 1, idxCode, _offset, _align);
    }

    i32_load(idxCode, _offset, _align) {
        return this.genLoad("i32.load", 2, idxCode, _offset, _align);
    }

    i32_store(idxCode, _offset, _align, _codeVal) {
        return this.genStore("i32.store", 2, idxCode, _offset, _align, _codeVal);
    }

    i32_store16(idxCode, _offset, _align, _codeVal) {
        return this.genStore("i32.store16", 1, idxCode, _offset, _align, _codeVal);
    }

    i32_store8(idxCode, _offset, _align, _codeVal) {
        return this.genStore("i32.store8", 0, idxCode, _offset, _align, _codeVal);
    }

    call(fnName, ...args) {
        const idx = this.module.functionIdxByName[fnName];
        if (idx === undefined)
            throw new Error(`Function not defined: Function: ${fnName}`);
        return [args, `call $${fnName}`];
    }

    call_indirect(fnIdx, ...args) {
        return [args, fnIdx, "call_indirect (type 0)"];
    }

    if(condCode, thenCode, elseCode) {
        if (elseCode) {
            return [condCode, "if", ident(thenCode), "else", ident(elseCode), "end"];
        } else {
            return [condCode, "if", ident(thenCode), "end"];
        }
    }

    block(bCode) { return ["block", ident(bCode), "end"]; }
    loop(...args) { return ["loop", ident(args), "end"]; }
    br_if(relPath, condCode) { return [condCode, `br_if ${relPath}`]; }
    br(relPath) { return `br ${relPath}`; }
    ret(rCode) { return [rCode, "return"]; }
    drop(dCode) { return [dCode,  "drop"]; }

    i64_const(num) { return `i64.const ${num}`; }
    i32_const(num) { return `i32.const ${num}`; }

    i64_eqz(opcode) { return [opcode, "i64.eqz"]; }
    i64_eq(op1code, op2code) { return [op1code, op2code, "i64.eq"]; }
    i64_ne(op1code, op2code) { return [op1code, op2code, "i64.ne"]; }
    i64_lt_s(op1code, op2code) { return [op1code, op2code, "i64.lt_s"]; }
    i64_lt_u(op1code, op2code) { return [op1code, op2code, "i64.lt_u"]; }
    i64_gt_s(op1code, op2code) { return [op1code, op2code, "i64.gt_s"]; }
    i64_gt_u(op1code, op2code) { return [op1code, op2code, "i64.gt_u"]; }
    i64_le_s(op1code, op2code) { return [op1code, op2code, "i64.le_s"]; }
    i64_le_u(op1code, op2code) { return [op1code, op2code, "i64.le_u"]; }
    i64_ge_s(op1code, op2code) { return [op1code, op2code, "i64.ge_s"]; }
    i64_ge_u(op1code, op2code) { return [op1code, op2code, "i64.ge_u"]; }
    i64_add(op1code, op2code) { return [op1code, op2code, "i64.add"]; }
    i64_sub(op1code, op2code) { return [op1code, op2code, "i64.sub"]; }
    i64_mul(op1code, op2code) { return [op1code, op2code, "i64.mul"]; }
    i64_div_s(op1code, op2code) { return [op1code, op2code, "i64.div_s"]; }
    i64_div_u(op1code, op2code) { return [op1code, op2code, "i64.div_u"]; }
    i64_rem_s(op1code, op2code) { return [op1code, op2code, "i64.rem_s"]; }
    i64_rem_u(op1code, op2code) { return [op1code, op2code, "i64.rem_u"]; }
    i64_and(op1code, op2code) { return [op1code, op2code, "i64.and"]; }
    i64_or(op1code, op2code) { return [op1code, op2code, "i64.or"]; }
    i64_xor(op1code, op2code) { return [op1code, op2code, "i64.xor"]; }
    i64_shl(op1code, op2code) { return [op1code, op2code, "i64.shl"]; }
    i64_shr_s(op1code, op2code) { return [op1code, op2code, "i64.shr_s"]; }
    i64_shr_u(op1code, op2code) { return [op1code, op2code, "i64.shr_u"]; }
    i64_extend_i32_s(op1code) { return [op1code, "i64.extend_s/i32"]; }
    i64_extend_i32_u(op1code) { return [op1code, "i64.extend_u/i32"]; }


    i32_eqz(op1code) { return [op1code, "i32.eqz"]; }
    i32_eq(op1code, op2code) { return [op1code, op2code, "i32.eq"]; }
    i32_ne(op1code, op2code) { return [op1code, op2code, "i32.ne"]; }
    i32_lt_s(op1code, op2code) { return [op1code, op2code, "i32.lt_s"]; }
    i32_lt_u(op1code, op2code) { return [op1code, op2code, "i32.lt_u"]; }
    i32_gt_s(op1code, op2code) { return [op1code, op2code, "i32.gt_s"]; }
    i32_gt_u(op1code, op2code) { return [op1code, op2code, "i32.gt_u"]; }
    i32_le_s(op1code, op2code) { return [op1code, op2code, "i32.le_s"]; }
    i32_le_u(op1code, op2code) { return [op1code, op2code, "i32.le_u"]; }
    i32_ge_s(op1code, op2code) { return [op1code, op2code, "i32.ge_s"]; }
    i32_ge_u(op1code, op2code) { return [op1code, op2code, "i32.ge_u"]; }
    i32_add(op1code, op2code) { return [op1code, op2code, "i32.add"]; }
    i32_sub(op1code, op2code) { return [op1code, op2code, "i32.sub"]; }
    i32_mul(op1code, op2code) { return [op1code, op2code, "i32.mul"]; }
    i32_div_s(op1code, op2code) { return [op1code, op2code, "i32.div_s"]; }
    i32_div_u(op1code, op2code) { return [op1code, op2code, "i32.div_u"]; }
    i32_rem_s(op1code, op2code) { return [op1code, op2code, "i32.rem_s"]; }
    i32_rem_u(op1code, op2code) { return [op1code, op2code, "i32.rem_u"]; }
    i32_and(op1code, op2code) { return [op1code, op2code, "i32.and"]; }
    i32_or(op1code, op2code) { return [op1code, op2code, "i32.or"]; }
    i32_xor(op1code, op2code) { return [op1code, op2code, "i32.xor"]; }
    i32_shl(op1code, op2code) { return [op1code, op2code, "i32.shl"]; }
    i32_shr_s(op1code, op2code) { return [op1code, op2code, "i32.shr_s"]; }
    i32_shr_u(op1code, op2code) { return [op1code, op2code, "i32.shr_u"]; }
    i32_rotl(op1code, op2code) { return [op1code, op2code, "i32.rotl"]; }
    i32_rotr(op1code, op2code) { return [op1code, op2code, "i32.rotr"]; }
    i32_wrap_i64(op1code) { return [op1code, "i32.wrap/i64"]; }

    ureachable() { return "unreachable"; }

    current_memory() { return "current_memory"; }

    comment(c) { return ";; " + c; }

}

/*
    Copyright 2019 0KIMS association.

    This file is part of wasmbuilder

    wasmbuilder is a free software: you can redistribute it and/or modify it
    under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    wasmbuilder is distributed in the hope that it will be useful, but WITHOUT
    ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
    or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public
    License for more details.

    You should have received a copy of the GNU General Public License
    along with wasmbuilder. If not, see <https://www.gnu.org/licenses/>.
*/

class FunctionBuilderWat {

    constructor (module, fnName, fnType, moduleName, fieldName) {
        if (fnType == "import") {
            this.fnType = "import";
            this.moduleName = moduleName;
            this.fieldName = fieldName;
        } else if (fnType == "internal") {
            this.fnType = "internal";
            this.comment = moduleName;
        } else {
            throw new Error("Invalid function fnType: " + fnType);
        }
        this.module = module;
        this.fnName = fnName;
        this.params = [];
        this.locals = [];
        this.localIdxByName = {};
        this.code = [];
        this.returnType = null;
        this.nextLocal =0;
    }

    addParam(paramName, paramType) {
        if (this.localIdxByName[paramName])
            throw new Error(`param already exists. Function: ${this.fnName}, Param: ${paramName} `);
        const idx = this.nextLocal++;
        this.localIdxByName[paramName] = idx;
        this.params.push({
            type: paramType,
            name: paramName
        });
    }

    addLocal(localName, localType, _length) {
        if ((typeof _length != "undefined") && (_length != 1)) {
            throw new Error("Locals greater than 1 not implemented");
        }
        if (this.localIdxByName[localName])
            throw new Error(`local already exists. Function: ${this.fnName}, Param: ${localName} `);
        const idx = this.nextLocal++;
        this.localIdxByName[localName] = idx;
        this.locals.push({
            type: localType,
            name: localName,
        });
    }

    setReturnType(returnType) {
        if (this.returnType)
            throw new Error(`returnType already defined. Function: ${this.fnName}`);
        this.returnType = returnType;
    }

    getSignature() {
        let p = "";
        for (let i=0; i<this.params.length; i++) {
            if (i==0) p += " (param";
            p += " " + this.params[i].type;
        }
        if (p!="") p+= ")";
        let r = "";
        if (this.returnType) {
            r += ` (result ${this.returnType})`;
        }
        return `(type $${this.getSignatureName()} (func ${p}${r}))`;
    }

    getSignatureName() {
        let s = "_sig_";
        for (let i=0; i<this.params.length; i++) {
            s += this.params[i].type;
        }
        if (this.returnType) {
            s+="r"+this.returnType;
        }
        return s;
    }

    getBody() {
        const src = [];

        for (let i=0; i<this.params.length; i++) {
            src.push(` (param $${this.params[i].name} ${this.params[i].type})`);
        }
        if (this.returnType) {
            src.push(`(result ${this.returnType})`);
        }
        for (let i=0; i<this.locals.length; i++) {
            src.push(` (local $${this.locals[i].name} ${this.locals[i].type})`);
        }
        src.push(this.code);

        let Ss;
        if (this.comment) {
            Ss = this.comment.split("\n");
            for (let i=0; i<Ss.length; i++) {
                Ss[i] = ";; " + Ss[i];
            }
        } else {
            Ss = [];
        }

        return [
            ...Ss,
            `(func $${this.fnName} (type $${this.getSignatureName()})`,
            ident(src),
            ")"
        ];

    }

    addCode(...code) {
        this.code.push(code);
    }

    getCodeBuilder() {
        return new CodeBuilderWat(this);
    }
}

/*
    Copyright 2019 0KIMS association.

    This file is part of wasmbuilder

    wasmbuilder is a free software: you can redistribute it and/or modify it
    under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    wasmbuilder is distributed in the hope that it will be useful, but WITHOUT
    ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
    or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public
    License for more details.

    You should have received a copy of the GNU General Public License
    along with wasmbuilder. If not, see <https://www.gnu.org/licenses/>.
*/

class ModuleBuilderWat {

    constructor() {
        this.functions = [];
        this.functionIdxByName = {};
        this.nImportFunctions = 0;
        this.nInternalFunctions =0;
        this.memory = {
            pagesSize: 1,
            moduleName: "env",
            fieldName: "memory"
        };
        this.free = 8;
        this.datas = [];
        this.modules = {};
        this.exports = [];
        this.functionsTable = [];
    }

    build() {
        const src = [];
        this._setSignatures();
        src.push(this._buildType());
        src.push(this._buildImport());
        if (this.functionsTable.length>0) {
            src.push(this._buildFunctionsTable());
        }
        if (this.exports.length > 0) {
            src.push(this._buildExports());
        }
        if (this.functionsTable.length>0) {
            src.push(this._buildElements());
        }
        if (this.nInternalFunctions>0) {
            src.push(this._buildFunctions());
        }
        src.push(this._buildData());
        return [
            "(module",
            ident(src),
            ")"
        ];
    }

    addFunction(fnName, comment) {
        if (typeof(this.functionIdxByName[fnName]) !== "undefined")
            throw new Error(`Function already defined: ${fnName}`);

        const idx = this.functions.length;
        this.functionIdxByName[fnName] = idx;

        this.functions.push(new FunctionBuilderWat(this, fnName, "internal", comment));

        this.nInternalFunctions++;
        return this.functions[idx];
    }

    addIimportFunction(fnName, moduleName, _fieldName) {
        if (typeof(this.functionIdxByName[fnName]) !== "undefined")
            throw new Error(`Function already defined: ${fnName}`);

        if (  (this.functions.length>0)
            &&(this.functions[this.functions.length-1].type == "internal"))
            throw new Error(`Import functions must be declared before internal: ${fnName}`);

        let fieldName = _fieldName || fnName;

        const idx = this.functions.length;
        this.functionIdxByName[fnName] = idx;

        this.functions.push(new FunctionBuilderWat(this, fnName, "import", moduleName, fieldName));

        this.nImportFunctions ++;
        return this.functions[idx];
    }

    setMemory(pagesSize, moduleName, fieldName) {
        this.memory = {
            pagesSize: pagesSize,
            moduleName: moduleName || "env",
            fieldName: fieldName || "memory"
        };
    }

    exportFunction(fnName, _exportName) {
        const exportName = _exportName || fnName;
        if (typeof(this.functionIdxByName[fnName]) === "undefined")
            throw new Error(`Function not defined: ${fnName}`);
        const idx = this.functionIdxByName[fnName];
        if (exportName != fnName) {
            this.functionIdxByName[exportName] = idx;
        }
        this.exports.push({
            exportName: exportName,
            idx: idx
        });
    }

    addFunctionToTable(fnName) {
        const idx = this.functionIdxByName[fnName];
        this.functionsTable.push(idx);
    }

    addData(offset, bytes) {
        this.datas.push({
            offset: offset,
            bytes: bytes
        });
    }

    alloc(a, b) {
        let size;
        let bytes;
        if ((Array.isArray(a) || ArrayBuffer.isView(a)) && (typeof(b) === "undefined")) {
            size = a.length;
            bytes = a;
        } else {
            size = a;
            bytes = b;
        }
        size = (((size-1)>>3) +1)<<3;       // Align to 64 bits.
        const p = this.free;
        this.free += size;
        if (bytes) {
            this.addData(p, bytes);
        }
        return p;
    }

    allocString(s) {
        const encoder = new TextEncoder();
        const uint8array = encoder.encode(s);
        return this.alloc([...uint8array, 0]);
    }

    _setSignatures() {
        this.signatures = [];
        const signatureIdxByName = {};
        if (this.functionsTable.length>0) {
            const signature = this.functions[this.functionsTable[0]].getSignature();
            const signatureName = this.functions[this.functionsTable[0]].getSignatureName();
            signatureIdxByName[signatureName] = 0;
            this.signatures.push(signature);
        }
        for (let i=0; i<this.functions.length; i++) {
            const signature = this.functions[i].getSignature();
            const signatureName = this.functions[i].getSignatureName();
            if (typeof(signatureIdxByName[signatureName]) === "undefined") {
                signatureIdxByName[signatureName] = this.signatures.length;
                this.signatures.push(signature);
            }

            this.functions[i].signatureIdx = signatureIdxByName[signatureName];
            this.functions[i].signatureName = signatureName;
        }

    }

    _buildType() {
        return this.signatures;
    }

    _buildImport() {
        const src = [];
        src.push(`(import "${this.memory.moduleName}" "${this.memory.fieldName}" (memory ${this.memory.pagesSize}))`);
        for (let i=0; i< this.nImportFunctions; i++) {
            src.push(`(import "${this.functions[i].moduleName}" "${this.functions[i].fieldName}" (func $${this.functions[i].fnName} (type $${this.functions[i].getSignatureName()})))`);
        }
        return src;
    }

    _buildFunctionsTable() {
        return `(table ${this.functionsTable.length} anyfunc)`;
    }

    _buildElements() {
        let funcs="";
        for (let i=0; i<this.functionsTable.length; i++) {
            funcs += " $"+this.functions[this.functionsTable[i]].fnName;
        }
        return `(elem (i32.const 0) ${funcs})`;
    }

    _buildExports() {
        const src = [];
        for (let i=0; i< this.exports.length; i++) {
            src.push(`(export "${this.exports[i].exportName}" (func $${this.functions[this.exports[i].idx].fnName}))`);
        }
        return src;
    }

    _buildFunctions() {
        const src = [];
        for (let i=this.nImportFunctions; i< this.nImportFunctions + this.nInternalFunctions; i++) {
            src.push(this.functions[i].getBody());
        }
        return src;
    }

    _buildData() {
        const src = [];
        const buf = Buffer.alloc(4);
        buf.writeUInt32LE(this.free, 0);
        src.push(`(data (i32.const 0) ${bytes2string(buf)})`);
        for (let i=0; i< this.datas.length; i++) {
            src.push(`(data (i32.const ${this.datas[i].offset}) ${bytes2string(this.datas[i].bytes)})`);
        }
        return src;

        function bytes2string(b) {
            let S = "\"";
            for (let i=0; i<b.length; i++) {
                if (b[i]<32 || b[i] >126 || b[i] == 34 || b[i]==92) {
                    let h=b[i].toString(16);
                    while (h.length<2) h = "0"+h;
                    S += "\\" + h;
                } else {
                    S += String.fromCharCode(b[i]);
                }
            }
            S +=  "\"";
            return S;
        }
    }

}

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

async function buildProtoboard(builder, defBytes, bitsPerBytes) {
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

exports.ModuleBuilder = ModuleBuilder;
exports.ModuleBuilderWat = ModuleBuilderWat;
exports.buildProtoboard = buildProtoboard;

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

import * as utils from "./utils.js";

export class CodeBuilderWat {
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
            return [condCode, "if", utils.ident(thenCode), "else", utils.ident(elseCode), "end"];
        } else {
            return [condCode, "if", utils.ident(thenCode), "end"];
        }
    }

    block(bCode) { return ["block", utils.ident(bCode), "end"]; }
    loop(...args) { return ["loop", utils.ident(args), "end"]; }
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

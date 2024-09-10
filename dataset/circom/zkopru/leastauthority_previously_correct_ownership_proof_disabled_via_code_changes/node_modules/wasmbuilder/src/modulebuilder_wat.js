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


import { FunctionBuilderWat } from "./functionbuilder_wat.js";
import * as utils from "./utils.js";

export class ModuleBuilderWat {

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
            utils.ident(src),
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

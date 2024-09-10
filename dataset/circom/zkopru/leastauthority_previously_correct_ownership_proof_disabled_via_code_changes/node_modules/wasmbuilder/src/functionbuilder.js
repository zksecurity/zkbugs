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

import { CodeBuilder } from "./codebuilder.js";
import * as utils from "./utils.js";

const typeCodes = {
    "i32": 0x7f,
    "i64": 0x7e,
    "f32": 0x7d,
    "f64": 0x7c,
    "anyfunc": 0x70,
    "func": 0x60,
    "emptyblock": 0x40
};


export class FunctionBuilder {

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
        const params = [...utils.varuint32(this.params.length), ...this.params.map((p) => typeCodes[p.type])];
        const returns = this.returnType ? [0x01, typeCodes[this.returnType]] : [0];
        return [0x60, ...params, ...returns];
    }

    getBody() {
        const locals = this.locals.map((l) => [
            ...utils.varuint32(l.length),
            typeCodes[l.type]
        ]);

        const body = [
            ...utils.varuint32(this.locals.length),
            ...[].concat(...locals),
            ...this.code,
            0x0b
        ];
        return [
            ...utils.varuint32(body.length),
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

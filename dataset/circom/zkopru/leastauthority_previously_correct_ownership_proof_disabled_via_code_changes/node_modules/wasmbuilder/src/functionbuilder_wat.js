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

import { CodeBuilderWat } from "./codebuilder_wat.js";
import * as utils from "./utils.js";

export class FunctionBuilderWat {

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
            utils.ident(src),
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

const ModuleBuilder = require("wasmbuilder").ModuleBuilder;
const buildBn128 = require("../src/bn128/build_bn128.js");
const fs = require("fs");
const path = require("path");

function buildWasm() {
    const moduleBuilder = new ModuleBuilder();
    moduleBuilder.setMemory(25);
    buildBn128(moduleBuilder);

    const code = moduleBuilder.build();

    fs.writeFileSync(
        path.join( __dirname, "..", "build", "bn128_wasm.js"),
        `
            exports.code = "${Buffer.from(code).toString("base64")}";
            exports.pq = ${moduleBuilder.modules.f1m.pq};
            exports.pr = ${moduleBuilder.modules.frm.pq};
            exports.pG1gen = ${moduleBuilder.modules.bn128.pG1gen};
            exports.pG1zero = ${moduleBuilder.modules.bn128.pG1zero};
            exports.pG1b = ${moduleBuilder.modules.bn128.pG1b};
            exports.pG2gen = ${moduleBuilder.modules.bn128.pG2gen};
            exports.pG2zero = ${moduleBuilder.modules.bn128.pG2zero};
            exports.pG2b = ${moduleBuilder.modules.bn128.pG2b};
            exports.pOneT = ${moduleBuilder.modules.bn128.pOneT};
            exports.prePSize = ${moduleBuilder.modules.bn128.prePSize};
            exports.preQSize = ${moduleBuilder.modules.bn128.preQSize};
            exports.n8q = 32;
            exports.n8r = 32;
            exports.q = "${moduleBuilder.modules.bn128.q}";
            exports.r = "${moduleBuilder.modules.bn128.r}";
        `
    );

    fs.writeFileSync(
        path.join( __dirname, "..", "build", "bn128.wasm"),
        Buffer.from(code)
    );
}

buildWasm();

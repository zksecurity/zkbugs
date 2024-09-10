const ModuleBuilder = require("wasmbuilder").ModuleBuilder;
const buildMNT6753 = require("../src/mnt6753/build_mnt6753.js");
const buildPedersenHash = require("../src/build_pedersenhash.js");
const baseTables = require("../build/pedersenparams_mnt6753.js");
const fs = require("fs");
const path = require("path");

function buildWasm() {

    const moduleBuilder = new ModuleBuilder();
    moduleBuilder.setMemory(1000);

    buildMNT6753(moduleBuilder);
    buildPedersenHash(moduleBuilder, "g1m", "g1m", "f1m", 188, baseTables);

    const code = moduleBuilder.build();

    fs.writeFileSync(
        path.join( __dirname, "..", "build", "mnt6753_wasm.js"),
        `
            exports.code = "${Buffer.from(code).toString("base64")}";
            exports.pq = ${moduleBuilder.modules.mnt6753.pq};
            exports.pr = ${moduleBuilder.modules.mnt6753.pq};
            exports.pG1gen = ${moduleBuilder.modules.mnt6753.pG1gen};
            exports.pG1zero = ${moduleBuilder.modules.mnt6753.pG1zero};
            exports.pG2gen = ${moduleBuilder.modules.mnt6753.pG2gen};
            exports.pG2zero = ${moduleBuilder.modules.mnt6753.pG2zero};
            exports.pOneT = ${moduleBuilder.modules.mnt6753.pOneT};
            exports.prePSize = ${moduleBuilder.modules.mnt6753.prePSize};
            exports.preQSize = ${moduleBuilder.modules.mnt6753.preQSize};
        `
    );
}

buildWasm();

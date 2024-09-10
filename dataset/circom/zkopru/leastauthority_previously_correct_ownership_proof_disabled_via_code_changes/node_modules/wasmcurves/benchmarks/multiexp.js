const bn128 = require("ffjavascript").bn128;
const ChaCha = require("ffjavascript").ChaCha;
const buildBn128 = require("../src/bn128/build_bn128.js");
const buildProtoboard = require("wasmbuilder").buildProtoboard;
const { performance } = require("perf_hooks");

async function run() {
    const n8 = 32;
    const pb = await buildProtoboard((module) => {
        buildBn128(module);
    }, n8);

    const pG1 = pb.bn128.pG1gen;
    const N = 1<<17;
    const sG = bn128.G1.F.n8*3;

    const pBases = pb.alloc(N*sG);
    pb.g1m_copy(pG1, pBases);
    for (let i=1; i<N; i++) {
        pb.g1m_addMixed(pBases + (i-1)*sG, pG1, pBases + i*sG);
    }
    pb.g1m_batchToAffine(pBases, N, pBases);

    const pScalars = pb.alloc(N*n8);

    const rng = new ChaCha();
    for (let i=0; i< N*n8/4; i++) {
        pb.i32[pScalars/4 + i] = rng.nextU32();
    }

    const pRes= pb.alloc(sG);

    console.log("Start multiexp...");

    const t1 = performance.now();

    pb.g1m_multiexpAffine(pBases, pScalars, n8, N, pRes);

    const t2 = performance.now();

    console.log("Performance type: " + (t2 - t1)/1000 + " seconds.");
}

run().then( () => {
    process.exit(0);
});

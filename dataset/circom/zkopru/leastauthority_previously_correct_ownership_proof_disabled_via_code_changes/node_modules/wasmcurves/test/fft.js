const assert = require("assert");
const buildBn128 = require("../src/bn128/build_bn128.js");
const buildProtoboard = require("wasmbuilder").buildProtoboard;

describe("FFT tests", function () {
    this.timeout(100000);
    let pb;
    const n8=32;
    before(async () => {
        pb = await buildProtoboard((module) => {
            buildBn128(module);
        }, n8);
    });
    it("create a basic FFT in Fr", async () => {
        const N=2048;

        const p = pb.alloc(n8*N);
        for (let i=0; i<N; i++) {
            pb.set(p+i*n8, i);
            pb.frm_toMontgomery(p+i*n8, p+i*n8);
        }

        pb.frm_fft(p, N);

        pb.frm_ifft(p, N);
        for (let i=0; i<N; i++) {
            pb.frm_fromMontgomery(p+i*n8, p+i*n8);
            const a = pb.get(p+i*n8);
            assert.equal(a,i);
        }

    });

    it("Encrypt + FFT == FFT + Encrypt ", async () => {
        const N=32;
        const pG1 = pb.bn128.pG1gen;

        const pxA = pb.alloc(n8*N);
        for (let i=0; i<N; i++) {
            pb.set(pxA+i*n8, i+1);
            pb.frm_toMontgomery(pxA+i*n8, pxA+i*n8);
        }

        const pGxA = pb.alloc(n8*3*N);
        for (let i=0; i<N; i++) {
            pb.frm_fromMontgomery(pxA+i*n8, pxA+i*n8);
            pb.g1m_timesScalarAffine(pG1, pxA+i*n8, n8, pGxA + (n8*3)*i);
        }

        pb.g1m_fft(pGxA, N);


        const pxB = pb.alloc(n8*N);
        for (let i=0; i<N; i++) {
            pb.set(pxB+i*n8, i+1);
            pb.frm_toMontgomery(pxB+i*n8, pxB+i*n8);
        }

        pb.frm_fft(pxB, N);

        const pGxB = pb.alloc(n8*3*N);
        for (let i=0; i<N; i++) {
            pb.frm_fromMontgomery(pxB+i*n8, pxB+i*n8);
            pb.g1m_timesScalar(pG1, pxB+i*n8, n8, pGxB + (n8*3)*i);
        }

        for (let i=0; i<N; i++) {
            assert(pb.g1m_eq(pGxA + (n8*3)*i, pGxB + (n8*3)*i));
        }

    });


    it("Encrypt + iFFT == iFFT + Encrypt ", async () => {
        const N=1024;
        const pG1 = pb.bn128.pG1gen;

        const pxA = pb.alloc(n8*N);
        for (let i=0; i<N; i++) {
            pb.set(pxA+i*n8, i+1);
            pb.frm_toMontgomery(pxA+i*n8, pxA+i*n8);
        }

        const pGxA = pb.alloc(n8*3*N);
        for (let i=0; i<N; i++) {
            pb.frm_fromMontgomery(pxA+i*n8, pxA+i*n8);
            pb.g1m_timesScalarAffine(pG1, pxA+i*n8, n8, pGxA + (n8*3)*i);
        }

        pb.g1m_ifft(pGxA, N);


        const pxB = pb.alloc(n8*N);
        for (let i=0; i<N; i++) {
            pb.set(pxB+i*n8, i+1);
            pb.frm_toMontgomery(pxB+i*n8, pxB+i*n8);
        }

        pb.frm_ifft(pxB, N);

        const pGxB = pb.alloc(n8*3*N);
        for (let i=0; i<N; i++) {
            pb.frm_fromMontgomery(pxB+i*n8, pxB+i*n8);
            pb.g1m_timesScalar(pG1, pxB+i*n8, n8, pGxB + (n8*3)*i);
        }

        for (let i=0; i<N; i++) {
            assert(pb.g1m_eq(pGxA + (n8*3)*i, pGxB + (n8*3)*i));
        }

    });



    it("Basic group iFFT", async () => {
        const N=8;
        const pG1 = pb.bn128.pG1gen;

        const pxA = pb.alloc(n8*N);
        for (let i=0; i<N; i++) {
            pb.set(pxA+i*n8, i+1);
            pb.frm_toMontgomery(pxA+i*n8, pxA+i*n8);
        }

        pb.frm_fft(pxA, N);

        const pGxA = pb.alloc(n8*3*N);
        for (let i=0; i<N; i++) {
            pb.frm_fromMontgomery(pxA+i*n8, pxA+i*n8);
            pb.g1m_timesScalarAffine(pG1, pxA+i*n8, n8, pGxA + (n8*3)*i);
        }

        pb.g1m_ifft(pGxA, N);


        const pxB = pb.alloc(n8*N);
        for (let i=0; i<N; i++) {
            pb.set(pxB+i*n8, i+1);
            pb.frm_toMontgomery(pxB+i*n8, pxB+i*n8);
        }

        const pGxB = pb.alloc(n8*3*N);
        for (let i=0; i<N; i++) {
            pb.frm_fromMontgomery(pxB+i*n8, pxB+i*n8);
            pb.g1m_timesScalar(pG1, pxB+i*n8, n8, pGxB + (n8*3)*i);
        }

        for (let i=0; i<N; i++) {
            assert(pb.g1m_eq(pGxA + (n8*3)*i, pGxB + (n8*3)*i));
        }

    });

/*
    it("create a do it reverselly FFT", async () => {
        const N=1024;

        const p = pb.alloc(n8*N);
        for (let i=0; i<N; i++) {
            pb.set(p+i*n8, i);
        }

        pb.fft_toMontgomeryN(p, p, N);
        pb.fft_ifft(p, N, 0);
        pb.fft_fft(p, N, 0);
        pb.fft_fromMontgomeryN(p, p, N);

        for (let i=0; i<N; i++) {
            const a = pb.get(p+i*n8);
            assert.equal(a,i);
        }
    });
    it("test with zeros", async () => {
        const N=1024;

        const p = pb.alloc(n8*N);
        for (let i=0; i<N; i++) {
            pb.set(p+i*n8, (i%2 == 0)? 0 : 1);
        }

        pb.fft_toMontgomeryN(p, p, N);
        pb.fft_ifft(p, N, 0);
        pb.fft_fft(p, N, 0);
        pb.fft_fromMontgomeryN(p, p, N);

        for (let i=0; i<N; i++) {
            const a = pb.get(p+i*n8);
            assert.equal(a,(i%2 == 0)? 0 : 1);
        }
    });
    it("test interleaved", async () => {
        const N=1024;

        const p = pb.alloc(n8*N);
        const pr1 = pb.alloc(n8*N*2);
        const pr2 = pb.alloc(n8*N*2);
        for (let i=0; i<N; i++) {
            pb.set(p+i*n8, i);
        }
        pb.fft_toMontgomeryN(p, p, N);
        pb.fft_fft(p, N, 0);
        pb.fft_copyNInterleaved(p, pr1, N);

        for (let i=0; i<N; i++) {
            pb.set(p+i*n8, i);
        }
        pb.fft_toMontgomeryN(p, p, N);
        pb.fft_fft(p, N, 1);
        pb.fft_copyNInterleaved(p, pr1+n8, N);

        pb.fft_fromMontgomeryN(pr1, pr1, N*2);

        for (let i=0; i<N; i++) {
            pb.set(pr2+i*n8, i);
        }
        for (let i=N; i<N*2; i++) {
            pb.set(pr2+i*n8, 0);
        }
        pb.fft_toMontgomeryN(pr2, pr2, N*2);
        pb.fft_fft(pr2, N*2, 0);
        pb.fft_fromMontgomeryN(pr2, pr2, N*2);

        for (let i=0; i<N*2; i++) {
            const a = pb.get(pr1+i*n8);
            const b = pb.get(pr2+i*n8);
            assert(a.equals(b));
        }

        pb.fft_toMontgomeryN(pr1, pr1, N*2);
        pb.fft_ifft(pr1, N*2, 0);
        pb.fft_fromMontgomeryN(pr1, pr1, N*2);
        for (let i=0; i<N; i++) {
            const a = pb.get(pr1+i*n8);
            assert.equal(a,i);
        }
        for (let i=N; i<N*2; i++) {
            const a = pb.get(pr1+i*n8);
            assert.equal(a,0);
        }

    });

*/
});

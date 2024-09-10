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


// module.exports.bn128_wasm = require("./build/bn128_wasm.js");
// module.exports.bls12381_wasm = require("./build/bls12381_wasm.js");
// module.exports.mnt6753_wasm = require("./build/mnt6753_wasm.js");

module.exports.buildBn128 = require("./src/bn128/build_bn128.js");
module.exports.buildBls12381 = require("./src/bls12381/build_bls12381.js");
// module.exports.buildMnt6753 = require("./src/mnt6753/build_mnt7.js");

module.exports.buildF1m = require("./src/build_f1m");

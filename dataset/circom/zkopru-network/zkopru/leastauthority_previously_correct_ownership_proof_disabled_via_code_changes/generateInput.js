const circomlibjs = require("circomlibjs");
const crypto = require("crypto");

// Trick from https://github.com/GoogleChromeLabs/jsbi/issues/30#issuecomment-953187833
BigInt.prototype.toJSON = function() { return this.toString() }

async function generateEdDSAPoseidonInput() {
    const eddsa = await circomlibjs.buildEddsa();
    const poseidon = await circomlibjs.buildPoseidon();

    // Generate a private key
    const privateKey = crypto.randomBytes(32);

    // Derive the public key
    const publicKey = eddsa.prv2pub(privateKey);

    // Create a message (in this case, a random 32-byte value)
    const msg = crypto.randomBytes(32);

    // Hash the message using Poseidon
    const msgHash = poseidon.F.toObject(poseidon(msg));

    // Sign the hashed message
    const signature = eddsa.signPoseidon(privateKey, msg);

    // Prepare the input for the EdDSAPoseidonVerifier template
    const input = {
        Ax: eddsa.F.toObject(publicKey[0]),
        Ay: eddsa.F.toObject(publicKey[1]),
        R8x: eddsa.F.toObject(signature.R8[0]),
        R8y: eddsa.F.toObject(signature.R8[1]),
        S: 13371337,
        M: msgHash
    };

    return input;
}

// Usage
generateEdDSAPoseidonInput().then(input => {
    console.log("EdDSAPoseidonVerifier Input:");
    console.log(JSON.stringify(input, null, 2));
    console.log("S is intended to be a dummy signature value.")
    console.log("mapping:")
    console.log("M = note")
    console.log("Ax = pub_key[0]")
    console.log("Ay = pub_key[1]")
    console.log("R8x = sig[0]")
    console.log("R8y = sig[1]")
    console.log("S = sig[2]")
}).catch(console.error);
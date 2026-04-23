pragma circom 2.1.6;

// In JwtVerify (utils/jwt-verify.circom line 93) the base64url-encoded JWT payload is
// fed directly into zkemail's Base64Decode without first calling Base64UrlToBase64.
// Base64Decode only accepts the base64 alphabet, so any input byte equal to '-' (45)
// or '_' (95) produces an unsatisfiable constraint system, breaking completeness for
// otherwise-valid Google OIDC JWTs.
//
// This direct wrapper isolates the vulnerable decode step: feeding it valid base64 (no
// '-' or '_') succeeds, but feeding it base64url characters would fail at witness time.
include "@zk-email/circuits/lib/base64.circom";

component main = Base64Decode(3);

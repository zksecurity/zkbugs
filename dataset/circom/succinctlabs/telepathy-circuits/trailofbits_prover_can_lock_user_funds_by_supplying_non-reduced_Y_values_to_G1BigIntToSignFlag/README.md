# Prover can lock user funds by supplying non-reduced Y values to G1BigIntToSignFlag

* Id: succinctlabs/telepathy-circuits/trailofbits-succinct-2
* Project: https://github.com/succinctlabs/telepathy-circuits
* Commit: b0c839cef30c3c25ef41d1ad3000081784766934
* Fix Commit: 1a88e657932edc59b51e35095618f1e1a46ceef6
* DSL: Circom
* Vulnerability: Under-Constrained
* Impact: Completeness
* Root Cause: Unsafe Reuse of Circuit
* Reproduced: True
* Location
  - Path: circuits/bls.circom
  - Function: G1BigIntToSignFlag
  - Line: 198-227
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/trailofbits-telepathy.pdf
  - Bug ID: 2. Prover can lock user funds by supplying non-reduced Y values to G1BigIntToSignFlag
* Commands
  - Setup Environment: `./zkbugs_setup.sh`
  - Reproduce: `./zkbugs_exploit.sh`
  - Compile and Preprocess: `./zkbugs_compile_setup.sh`
  - Positive Test: `./zkbugs_positive_test.sh`
  - Find Exploit: `./zkbugs_find_exploit.sh`
  - Clean: `./zkbugs_clean.sh`

## Short Description of the Vulnerability

`G1BigIntToSignFlag` fails to check if the y-coordinate is properly reduced mod p. This missing of range check allows malicious prover to lock user funds by supplying a non-reduced y-coordinate, which can be manipulated to have a positive sign when it should be negative. This manipulation can prevent future provers from generating valid proofs, effectively halting the LightClient and trapping user funds in the bridge.

## Short Description of the Exploit

In detect.sage, we grab a 'positive' y-coordinate from a public key and turn it into 'negative' by negating it and mod p. We call this new value `y` and it has negative sign. Now we compute `2*p - y` and use it as input. This value is congruent to `-y mod p` so it is positive, but the circuit still considers it as negative. This fact can be observed in exploitable_witness.json: the second entry is 0, which represents negative sign.

## Proposed Mitigation

Constrain the `pubkeysBigIntY` values to be less than `p` using `BigLessThan` template.


# Incorrect handling of point doubling can allow signature forgery

* Id: succinctlabs/telepathy-contracts
* Project: https://github.com/succinctlabs/telepathy-circuits
* Commit: b0c839cef30c3c25ef41d1ad3000081784766934
* Fix Commit: 
* DSL: Circom
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Unsafe Reuse of Circuit
* Reproduced: True
* Location
  - Path: circuits/curve.circom
  - Function: EllipticCurveAddUnequal
  - Line: 155-227
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/trailofbits-telepathy.pdf
  - Bug ID: 3. Incorrect handling of point doubling can allow signature forgery
* Commands
  - Setup Environment: `./zkbugs_setup.sh`
  - Reproduce: `./zkbugs_exploit.sh`
  - Compile and Preprocess: `./zkbugs_compile_setup.sh`
  - Positive Test: `./zkbugs_positive_test.sh`
  - Find Exploit: `./zkbugs_find_exploit.sh`
  - Clean: `./zkbugs_clean.sh`

## Short Description of the Vulnerability

`G1Add` calls `EllipticCurveAddUnequal`. The template `EllipticCurveAddUnequal` assumes input `a` and `b` are two unequal public keys but this is not checked. Attacker can use two same public keys to do sophisticated attacks. In such scenario, the constraint on output in `EllipticCurveAddUnequal` reduces to 0 = 0 so it is always true. In other words, attacker can do point doubling at a place where it is supposed to do point addition of two unequal EC points.

## Short Description of the Exploit

We generate `A = aG`, `B = bG` and `C = (a+b)G`. We use `(a+b)G` for both inputs.

## Proposed Mitigation

Change `G1Add` to use `EllipticCurveAdd`, which correctly handles equal inputs by checking and managing point doubling.


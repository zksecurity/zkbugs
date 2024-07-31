# Under-Constrained

* Id: reclaimprotocol/circom-chacha20-zksecurity-1
* Project: https://github.com/reclaimprotocol/circom-chacha20
* Commit: ef9f5a5ad899d852740a26b30eabe5765673c71f
* Fix Commit: e5e756375fc1fc8dc48667b00cdf38c79a0fdf50
* DSL: Circom
* Vulnerability: Under-Constrained
* Location
  - Path: circuits/generics.circom
  - Function: RotateLeft32Bits
  - Line: 39-45
* Source: Audit Report
  - Source Link: https://www.zksecurity.xyz/blog/2023-reclaim-chacha20.pdf
  - Bug ID: #1 Unsound Left Rotation Gadget
* Commands
  - Setup Environment: `./zkbugs_setup.sh`
  - Reproduce: `./zkbugs_exploit.sh`
  - Compile and Preprocess: `./zkbugs_compile_setup.sh`
  - Positive Test: `./zkbugs_positive_test.sh`
  - Find Exploit: `./zkbugs_find_exploit.sh`
  - Clean: `./zkbugs_clean.sh`

## Short Description of the Vulnerability

The `part1` and `part2` signals are not sufficiently constrained. One can arbitrarily set a value to `part1` or `part2` and find a value for the other signal to satisfy the constraint on line 45. This way you can get another `out` value for a given `in`.

## Short Description of the Exploit

To exploit the vulnerability, one has to simply find a witness that produces a different value for `out` rather than the one produced by the witness generator. The sage script demonstrates how to find another witness that satisfies the constraints. Then, you simply need to produce a new proof.

## Proposed Mitigation

The recommendation to fix this issue was to constrain `part1` (resp. `part2`) to be (resp. ) bit-sized values. For the concrete mitigation applied, check the commit of the fix.

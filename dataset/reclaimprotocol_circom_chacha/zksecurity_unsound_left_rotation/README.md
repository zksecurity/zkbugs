# Unsound Left Rotation

* Project: <https://github.com/reclaimprotocol/circom-chacha20>
* Commit: ef9f5a5ad899d852740a26b30eabe5765673c71f
* DSL: Circom
* Vulnerability: Under-Constrained
* Location
  - Path: circuits/generics.circom
  - Function: RotateLeft32Bits
  - Line: 39-45
* Source: Audit Report
  - Source Link: <https://www.zksecurity.xyz/blog/2023-reclaim-chacha20.pdf>
  - Bug ID: #1 Unsound Left Rotation Gadget
* Reproduce: `reproduce.sh`
* Find Exploit: `detect.sh`

## Short Description of the Vulnerability

`part1` and `part2` signals are not sufficiently constrained. One can arbitrarily set a value to `part1` or `part2` and find a value for the other signal to satisfy the constraint on line 

## Short Description of the Exploit

## Proposed Mitigation

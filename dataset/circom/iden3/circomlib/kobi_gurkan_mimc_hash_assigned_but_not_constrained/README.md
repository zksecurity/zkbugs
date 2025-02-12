# MiMC Hash: Assigned but not Constrained

* Id: iden3/circomlib/Kobi-Gurkan-MiMC-Hash-Assigned-but-not-Constrained
* Project: https://github.com/iden3/circomlib
* Commit: 324b8bf8cc4a80357354752deb6c2ae5be22e5f5
* Fix Commit: 109cdf40567fce284dca1d535819ce28922653e0
* DSL: Circom
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Assigned but Unconstrained
* Reproduced: True
* Location
  - Path: circuits/mimcsponge.circom
  - Function: MiMCSponge
  - Line: 28
* Source: Bug Tracker
  - Source Link: https://github.com/0xPARC/zk-bug-tracker?tab=readme-ov-file#14-mimc-hash-assigned-but-not-constrained
  - Bug ID: MiMC Hash: Assigned but not Constrained
* Commands
  - Setup Environment: `./zkbugs_setup.sh`
  - Reproduce: `./zkbugs_exploit.sh`
  - Compile and Preprocess: `./zkbugs_compile_setup.sh`
  - Positive Test: `./zkbugs_positive_test.sh`
  - Find Exploit: `./zkbugs_find_exploit.sh`
  - Clean: `./zkbugs_clean.sh`

## Short Description of the Vulnerability

In `MiMCSponge` template, `outs[0]` is assigned but not constrained, so it can be any value. Note that the circuit code is modified from a newer version since the original buggy code couldn't be reproduced in Circom version 2. The bug idea is still the same.

## Short Description of the Exploit

Set `ins[0]` and `k` to any random field element. Generate a correct witness first then modify the 2nd entry to a number as you wish. You can see that `outs[0]` can be any number.

## Proposed Mitigation

Use `<==` instead of `<--` to add a constraint to `outs[0]`.

## Similar Bugs

* reclaimprotocol/circom-chacha20/zksecurity_unsound_left_rotation
* personaelabs/spartan-ecdsa/yacademy_input_signal_s_is_not_constrained_in_eff_ecdsa_circom

# The registration and disclosure circuits lack range checks for the input indices

* Id: selfxyz/self/zksecurity_the_registration_and_disclosure_circuits_lack_range_checks_for_the_input_indices
* Project: https://github.com/selfxyz/self
* Commit: 4f18c75041bb47c1862169eef82c22067642a83a
* Fix Commit: 49de54966e40709ac59d4070fd4bd0279b2a10c0
* DSL: Circom
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Wrong translation of logic into constraints
* Reproduced: True
* Location
  - Path: circuits/circuits/register_id/register_id.circom
  - Function: REGISTER_ID
  - Line: 101-105
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/zksecurity-celo-self-audit-2.pdf
  - Bug ID: #03 - The registration and disclosure circuits lack range checks for the input indices
* Commands
  - Setup Environment: `./zkbugs_setup.sh`
  - Reproduce: `./zkbugs_exploit.sh`
  - Compile and Preprocess: `./zkbugs_compile_setup.sh`
  - Positive Test: `./zkbugs_positive_test.sh`
  - Find Exploit: `./zkbugs_find_exploit.sh`
  - Clean: `./zkbugs_clean.sh`

## Short Description of the Vulnerability

There are actually two separate issues with this code. 
- The computation `dsc_pubKey_offset + dsc_pubKey_actual_size` could overflow or underflow the field, leading to a wrong check semantics.
- The `LessEqThan` template checks that the first input is less than or equal to the second input, but it assumes that both of the inputs are between 0 and 2^{12} - 1. If this is not the case, the circuit will produce some unexpected behaviour, as for example `LessEqThan(12)` with input values p - 1 and 0 will return 1 instead of 0. In this context, the intended range of the indices is to be between 0 and 2^{12} - 1, so this check could pass even if the indices are outside this range, leading to unexpected behaviour in the circuit.

## Short Description of the Exploit

An attacker can provide incorrect indices to the circuit, for example negative indices, which pass the range checks. We could not find any concrete exploit, as incorrect indices make the proof fail in subsequent checks. However, they can lead to unexpected behaviour in the circuits, if for example some other circuits rely on the fact that indices are in the correct range.

## Proposed Mitigation

We recommend to ensure that every computation done with indices does not overflow or underflow the field, by adding additional range checks. Additionally, we recommend to add range checks to the input signals of the `LessEqThan` template, to ensure that there is no unexpected behaviour when the inputs are outside the intended range.


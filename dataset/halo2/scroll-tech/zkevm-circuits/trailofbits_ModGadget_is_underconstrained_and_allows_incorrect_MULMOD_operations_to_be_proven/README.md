# ModGadget is underconstrained and allows incorrect MULMOD operations to be proven (Not Reproduce)

* Id: scroll-tech/zkevm-circuits/trailofbits_ModGadget_is_underconstrained_and_allows_incorrect_MULMOD_operations_to_be_proven
* Project: https://github.com/scroll-tech/zkevm-circuits
* Commit: 0xe8bcb23e1f303bd6e0dc52924b0ed85710b8a016
* Fix Commit: 069477d3efd1b4fb19640ff1d9dcd4fb3e3c9e5f3adc646e1bfc7ad0f07a0162
* DSL: Halo2
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Wrong translation of logic into constraints
* Reproduced: False
* Location
  - Path: zkevm-circuits/src/evm_circuit/util/math_gadget/modulo.rs
  - Function: construct
  - Line: 10-44
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/trailofbits-scroll.pdf
  - Bug ID: ModGadget is underconstrained and allows incorrect MULMOD operations to be proven
* Commands
  - Setup Environment: ``
  - Reproduce: ``
  - Compile and Preprocess: ``
  - Positive Test: ``
  - Find Exploit: ``
  - Clean: ``

## Short Description of the Vulnerability

The bug report indicates that the ModGadget circuit is underconstrained, allowing incorrect MULMOD operations to be proven. Specifically, when dividing by zero, it incorrectly permits a proof that a * b mod 0 equals a * b, contrary to the EVM specifications which dictate that the result should be zero. This vulnerability could be exploited to achieve state divergence and potentially result in financial loss.

## Short Description of the Exploit



## Proposed Mitigation

To fix the issue with 'ModGadget being underconstrained and allowing incorrect MULMOD operations,' update the constraint for the variable `a_or_zero` to be correctly conditioned on the value of `n`. The revised constraint should ensure that `a_or_zero` is only set to `a` when `n` is not zero, and must equal zero when `n` is zero.


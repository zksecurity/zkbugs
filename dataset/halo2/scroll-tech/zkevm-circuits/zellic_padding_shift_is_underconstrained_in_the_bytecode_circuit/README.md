# padding_shift is underconstrained in the bytecode circuit (Not Reproduce)

* Id: scroll-tech/zkevm-circuits/zellic_padding_shift_is_underconstrained_in_the_bytecode_circuit
* Project: https://github.com/scroll-tech/zkevm-circuits
* Commit: 0xf3ebc6af0e5049d2f45259ef79741f9c7d7794e1
* Fix Commit: e8aecb68ccd87759dc4ea46e2cec9649a0803f5b
* DSL: Halo2
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Wrong translation of logic into constraints
* Reproduced: False
* Location
  - Path: zkevm-circuits/src/bytecode_circuit/to_poseidon_hash.rs
  - Function: 
  - Line: 13
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/zellic-scroll.pdf
  - Bug ID: padding_shift is underconstrained in the bytecode circuit
* Commands
  - Setup Environment: ``
  - Reproduce: ``
  - Compile and Preprocess: ``
  - Positive Test: ``
  - Find Exploit: ``
  - Clean: ``

## Short Description of the Vulnerability

The bug "padding_shift is underconstrained in the bytecode circuit" indicates that the constraints related to the padding_shift variable are insufficient for the last byte of the bytecode. This can lead to incorrect field element generation in the Poseidon hash computation, allowing two different bytecodes to hash to the same field element. It is critical due to the potential for this under-constrained state to be exploited, and a recommendation was made to enhance the constraints for the last chunk of bytecode.

## Short Description of the Exploit



## Proposed Mitigation

Add a constraint to the padding_shift for the last chunk of the bytecode to ensure it is set correctly, especially for cases where the bytecode length is not a multiple of 31. This will prevent different bytecodes from hashing to the same field element.


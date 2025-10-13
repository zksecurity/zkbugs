# Generic Fuzzing Framework for Zero-Knowledge Virtual Machine Security

**M.Sc. thesis proposal**  
**Dr. Martín Ochoa, Dr. Stefanos Chaliasos, zkSecurity, 2025**  
**Duration:** 6 months

---

## Abstract

Zero-Knowledge Virtual Machines (zkVMs) are critical infrastructure components in the Ethereum ecosystem, enabling privacy-preserving computation and scalable blockchain solutions. Despite their importance, zkVMs remain vulnerable to both soundness bugs (incorrect proof acceptance) and completeness bugs (valid proof rejection). This thesis proposes developing a generic fuzzing framework for RISC-V zkVMs that addresses the fundamental challenges of zkVM testing: the oracle problem, effective input generation, and performance optimization.

## Problem Statement

Current zkVM security approaches rely heavily on manual audits and partial formal verification, leaving security gaps. While comprehensive vulnerability taxonomies exist for ZKP systems [1] and documented security issues are available [2], existing fuzzing techniques are not zkVM-specific and fail to address the unique challenges of: (1) the test oracle problem in distinguishing valid from invalid executions, (2) generating effective inputs that expose zkVM vulnerabilities, and (3) performance bottlenecks due to expensive proof generation. Although the broader fuzzing community has demonstrated effectiveness through projects like OSS-Fuzz [4] that discovered thousands of bugs in critical software, and processor fuzzing frameworks like MorFuzz [3] and Cascade [5] provide foundational techniques, they require significant adaptation for zkVM-specific constraints.

## Research Objectives

1. **Vulnerability Analysis:** Review known zkVM bugs and security issues to understand common vulnerability patterns and inform fuzzing strategy.  
2. **Oracle Design:** Develop practical solutions to the oracle problem for detecting both soundness bugs (invalid proofs accepted) and completeness bugs (valid proofs rejected).  
3. **Input Generation:** Implement effective input generation strategies, including program synthesis and trace mutation techniques for comprehensive coverage.  
4. **Generic Fuzzer Implementation:** Build a zkVM-agnostic fuzzing framework that can target any RISC-V zkVM with minimal adaptation.  
5. **Validation Campaign:** Evaluate the fuzzer through systematic testing on at least one, and possible multiple open-source zkVMs and performance analysis.

## Methodology

**Phase 1 (Month 1–2): Background research and oracle design**
- Literature review of zkVM security vulnerabilities [1] and existing fuzzing approaches including processor fuzzing [3,5] and continuous fuzzing methodologies [4]
- Analysis of known soundness and completeness bugs [2] to inform testing strategy
- Design oracle mechanisms for automated bug detection

**Phase 2 (Month 2–4): Core implementation**
- Implement input generation strategies (program synthesis, mutation techniques)
- Develop generic fuzzing harness integrating proven techniques from processor fuzzers [3,5] and established fuzzing infrastructure [4]
- Build zkVM-agnostic interface supporting multiple RISC-V zkVMs
- Implement performance optimizations (mock prover modes, selective verification)

**Phase 3 (Month 4–5): Validation and testing**
- Systematic testing against known vulnerabilities to validate detection capabilities
- Focused fuzzing campaign on at least one and up to 3 open-source RISC-V zkVMs (RISC0, SP1, Jolt)
- Performance benchmarking and coverage analysis

**Phase 4 (Month 5–6): Analysis and documentation**
- Results analysis and bug classification
- Evaluation of fuzzer effectiveness and performance
- Thesis writing and documentation

## Expected Contributions

- **Generic zkVM Fuzzing Framework:** Comprehensive fuzzing tool capable of testing any RISC-V zkVM with minimal adaptation  
- **Oracle Solutions:** Practical approaches to solving the oracle problem for both soundness and completeness bug detection  
- **Performance Optimizations:** Engineering solutions to make zkVM fuzzing feasible despite expensive proof generation  
- **Empirical Security Analysis:** Systematic evaluation of at least one and possibly multiple zkVM implementations and their vulnerability patterns

## Evaluation Criteria

- Effectiveness of oracle mechanisms in detecting both soundness and completeness bugs  
- Coverage achieved across different zkVM implementations and instruction types  
- Performance metrics (fuzzing throughput, proof generation optimization)  
- Ability to reproduce known vulnerabilities and discover new issues  
- Generic applicability across multiple RISC-V zkVM implementations

## Timeline

| Month | Milestone                                           |
|------:|------------------------------------------------------|
|   1–2 | Literature review and oracle design                  |
|   2–3 | Input generation and zkVM interface implementation   |
|   3–4 | Core fuzzing framework and performance optimizations |
|   4–5 | Multi-zkVM testing campaign and validation           |
|   5–6 | Results analysis, thesis writing, and defense preparation |

## References

[1] Chaliasos, S., et al. “SoK: What don’t we know? Understanding Security Vulnerabilities in SNARKs.” USENIX Security 2024.  
[2] “Awesome ZK-Rollup Security.” Available: https://bugs.zksecurity.xyz/  
[3] Chen, S., et al. “MorFuzz: Fuzzing Processor via Runtime Instruction Morphing enhanced Synchronizable Co-simulation.” USENIX Security 2023.  
[4] “OSS-Fuzz: Continuous Fuzzing for Open Source Software.” Available: https://google.github.io/oss-fuzz/  
[5] Goth, M., et al. “Cascade: CPU Fuzzing via Intricate Program Generation.” ISCA 2021.

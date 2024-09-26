# Circomspect Analysis Report

This report summarizes how circomspect works internally andevaluates circomspect's performance in identifying vulnerabilities in all bug directories in this repo. We compare the actual vulnerabilities described in the "Short Description of the Vulnerability" sections with the issues detected by circomspect.

## Intro to circomspect internal

[circomspect](https://github.com/trailofbits/circomspect) is a static analysis tool for circom DSL developed by Trail of Bits.

The parser component of circomspect transforms circom code into an **AST (Abstract Syntax Tree)**. This is done by the [LALRPOP](https://github.com/lalrpop/lalrpop) parser generator. The parser does lexical and syntax analysis. It handles Circom-specific syntax, including templates, signals, and constraints.

After successfully generating the AST, circomspect converts it into a **CFG (Control Flow Graph)**. The CFG represents the flow of execution within the circuit, outlining the relationships between different components, signals, and constraints. The CFG is then transformed into **SSA (Static Single Assignment)** form, where each variable is assigned exactly once. SSA simplifies the analysis by making data dependencies explicit, facilitating more straightforward detection of issues like unused variables or shadowed signals.

Circomspect employs a series of [analysis passes](https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md), each designed to detect specific types of bugs or inefficiencies within circom circuits. These passes traverse the CFG in SSA form to identify patterns or anomalies indicative of potential issues.

- **Unconstrained Signals**
  - Detect signals that are declared but never properly constrained within the circuit.
  - Detection Mechanism:
    - Analyzes the CFG to identify signals that do not influence any constraints or outputs.
    - Flags such signals as potentially unused or indicative of incomplete logic.

- **Shadowing Variables**
  - Identify instances where variables are redefined in a scope, potentially leading to logical errors.
  - Detection Mechanism:
     - Traverses the CFG to detect variable declarations that overshadow previous ones within nested scopes.
     - Alerts the developer to prevent unintended overwriting of variables.

- **Cyclomatic Complexity**
  - Measure the complexity of templates and functions to ensure maintainability and readability.
  - Detection Mechanism:
    - Calculates cyclomatic complexity using the formula `M = E - N + 2P` (where `E` is the number of edges, `N` is the number of nodes, and `P` is the number of connected components).
    - Generates warnings for templates or functions exceeding predefined complexity thresholds, suggesting refactoring.

- **Field Element Arithmetic**
   - Ensure that arithmetic operations on field elements do not introduce overflows or unintended behaviors.
   - Detection Mechanism:
      - Analyzes arithmetic expressions to detect potential overflows or underflows.
      - Checks that operations are performed within the valid range of the underlying field.

- **Deferred or Unused Output Signals**
  - Identify output signals that are declared but not utilized within constraints or further logic.
  - Detection Mechanism:
    - Scans the CFG for output signals that do not contribute to any constraints or external outputs.
    - Flags such signals to prevent clutter and potential logical errors.

- **BN254 Specific Circuit Usage**
  - Detect the use of templates that are hard-coded for the BN254 curve but used with alternative curves.
  - Detection Mechanism:
     - Maintains a list of templates known to have BN254-specific implementations.
     - Analyzes template instantiations to ensure compatibility with the specified curve, issuing warnings when mismatches are detected.

- **Non-Strict Binary Conversion**
  - Ensure that binary conversions using `Num2Bits` and `Bits2Num` are performed safely to prevent multiple valid representations.
  - Detection Mechanism:
     - Validates that input sizes for binary conversions are within safe limits relative to the field size.
     - Issues warnings when potential ambiguities in representations are detected.

- **Constant Branching Conditions**
  - Detect branching statements in Circom that have constant conditions, which may lead to redundant or dead code.
  - Detection Mechanism:
    - Analyzes conditional statements to identify those with conditions that are always `true` or `false`.
    - Alerts developers to eliminate or correct such statements to maintain circuit integrity.

## Evaluation

### circom/circomlib_mimc/kobi_gurkan_mimc_hash_assigned_but_not_constrained

Actual vulnerability: `outs[0]` is assigned but not constrained, allowing it to be any value.

Circomspect finding: Circomspect identified an unnecessary use of the signal assignment operator `<--` where a constraint assignment `<==` should be used.

Evaluation: Circomspect partially identified the issue. While it didn't explicitly state that `outs[0]` is unconstrained, it did point out a problem with the assignment, which is related to the actual vulnerability. This can be considered a moderate success.

### circom/reclaimprotocol_circom_chacha/zksecurity_unsound_left_rotation

Actual vulnerability: `part1` and `part2` signals are not sufficiently constrained, allowing arbitrary values to satisfy the constraint.

Circomspect finding: Circomspect correctly identified that both `part1` and `part2` are assigned using `<--` but not properly constrained.

Evaluation: Circomspect performed well in this case. It directly pointed out the core issue of the vulnerability, which is the lack of proper constraints on `part1` and `part2`. This can be considered a significant success.

### circom/spartan_ecdsa/yacademy_input_signal_s_is_not_constrained_in_eff_ecdsa_circom

Actual vulnerability: The input signal `s` is not constrained, allowing potential manipulation of the ECDSA computation.

Circomspect finding: Circomspect only identified an unused variable `bits`.

Evaluation: Circomspect failed to identify the main vulnerability in this case. It missed the critical issue of the unconstrained `s` input, which is the core of the vulnerability. This can be considered a failure.

### circom/darkforest_circuits/daira_hopwood_darkforest_v0_3_missing_bit_length_check

Actual vulnerability: Inputs to `LessThan(bits)` are assumed to be bounded but not actually constrained, allowing unexpected values.

Circomspect finding: Circomspect reported "No issues found."

Evaluation: Circomspect failed to identify the vulnerability. It didn't detect the missing bit length check, which is a critical issue. This can be considered a significant failure.

### circom/uniRep_protocol/veridise_missing_range_checks_on_comparison_circuits

Actual vulnerability: Inputs to `LessThan(8)` are assumed to have ≤8 bits but not constrained, allowing large values to trigger overflow.

Circomspect finding: Circomspect encountered an error parsing the circuit file.

Evaluation: Due to the parsing error, Circomspect was unable to analyze the circuit properly. This prevents a fair evaluation of its performance for this specific vulnerability.

### circom/uniRep_protocol/veridise_underconstrained_circuit_allows_invalid_comparison

Actual vulnerability: Use of `Num2Bits(254)` allows inputs larger than the scalar field modulus, leading to invalid comparisons due to overflow.

Circomspect finding: Circomspect identified several issues, including unconstrained inputs to `LessThan` and potential aliasing issues with `Num2Bits` and `Bits2Num`.

Evaluation: Circomspect performed well in this case. While it didn't explicitly mention the overflow issue, it did identify the use of non-strict binary conversion, which is directly related to the actual vulnerability. This can be considered a success.

### circom/circom-bigint_circomlib/veridise_underconstrained_points_in_montgomeryAdd

Actual vulnerability: Lambda calculation involves division without constraining the divisor to be non-zero, allowing `out[1]` to be set to any value.

Circomspect finding: Circomspect correctly identified the unconstrained division and the use of signal assignment without proper constraints.

Evaluation: Circomspect performed excellently in this case. It directly pointed out both aspects of the vulnerability: the unconstrained division and the lack of proper constraints. This can be considered a significant success.

### circom/circom-bigint_circomlib/veridise_decoder_accepting_bogus_output_signal

Actual vulnerability: The circuit doesn't properly constrain `out`, allowing a malicious prover to set a bogus `out` and `success` to 0 without error.

Circomspect finding: Circomspect identified that the `out[i]` signal is assigned but not properly constrained.

Evaluation: Circomspect performed well in this case. It correctly identified the core issue of the vulnerability, which is the lack of proper constraints on the `out` signal. This can be considered a success.

### circom/circom-bigint_circomlib/veridise_underconstrained_points_in_edwards2Montgomery

Actual vulnerability: The circuit doesn't constrain against division by zero, allowing `out[1]` to be set to any value when the divisor is 0.

Circomspect finding: Circomspect correctly identified multiple instances of unconstrained division and signal assignments without proper constraints.

Evaluation: Circomspect performed excellently in this case. It directly pointed out both the unconstrained divisions and the lack of proper constraints, which are the core issues of the vulnerability. This can be considered a significant success.

### circom/circom-bigint_circomlib/veridise_underconstrained_points_in_montgomeryDouble

Actual vulnerability: Lambda calculation involves division without constraining the divisor to be non-zero, allowing lambda to be set to any value.

Circomspect finding: Circomspect correctly identified the unconstrained division and the use of signal assignment without proper constraints for lambda.

Evaluation: Circomspect performed excellently in this case. It directly pointed out both aspects of the vulnerability: the unconstrained division and the lack of proper constraints on lambda. This can be considered a significant success.

## Conclusion

circomspect demonstrated varying levels of effectiveness across different vulnerabilities:

1. Significant Successes: 5 cases
   - circom/reclaimprotocol_circom_chacha/zksecurity_unsound_left_rotation
   - circom/circom-bigint_circomlib/veridise_underconstrained_points_in_montgomeryAdd
   - circom/circom-bigint_circomlib/veridise_underconstrained_points_in_edwards2Montgomery
   - circom/circom-bigint_circomlib/veridise_underconstrained_points_in_montgomeryDouble
   - circom/uniRep_protocol/veridise_underconstrained_circuit_allows_invalid_comparison

2. Moderate Successes: 2 cases
   - circom/circomlib_mimc/kobi_gurkan_mimc_hash_assigned_but_not_constrained
   - circom/circom-bigint_circomlib/veridise_decoder_accepting_bogus_output_signal

3. Failures: 2 cases
   - circom/spartan_ecdsa/yacademy_input_signal_s_is_not_constrained_in_eff_ecdsa_circom
   - circom/darkforest_circuits/daira_hopwood_darkforest_v0_3_missing_bit_length_check

circomspect showed strength in identifying issues related to:

- Unconstrained divisions
- Improper use of signal assignments without constraints
- Potential aliasing issues in binary conversions

However, it struggled with:

- Identifying missing range checks
- Detecting unconstrained input signals that don't directly involve assignments or divisions

Despite some limitations, circomspect proved to be a valuable tool for identifying several critical vulnerabilities in circom circuits, particularly those related to unconstrained calculations and improper signal assignments. It successfully identified or partially identified the core issues in 7 out of 9 analyzed cases, demonstrating its effectiveness as a static analysis tool for circom circuits.

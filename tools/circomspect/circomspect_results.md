# Circomspect Analysis Results

## circom/circomlib_mimc/kobi_gurkan_mimc_hash_assigned_but_not_constrained

### Short Description of the Vulnerability

In `MiMCSponge` template, `outs[0]` is assigned but not constrained, so it can be any value. Note that the circuit code is modified from a newer version since the original buggy code couldn't be reproduced in Circom version 2. The bug idea is still the same.

### Circomspect Output for mimcsponge.circom

```
circomspect: analyzing template 'MiMCFeistel'
circomspect: analyzing template 'MiMCSponge'
warning: Using the signal assignment operator `<--` is not necessary here.
   ┌─ /home/ret2basic/zkbugs/dataset/circom/circomlib_mimc/kobi_gurkan_mimc_hash_assigned_but_not_constrained/circuits/mimcsponge.circom:28:3
   │
28 │   outs[0] <-- S[nInputs - 1].xL_out;
   │   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ The expression assigned to `outs[0]` is quadratic.
   │
   = Consider rewriting the statement using the constraint assignment operator `<==`.
   = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unnecessary-signal-assignment.

circomspect: 1 issue found.
```

## circom/reclaimprotocol_circom_chacha/zksecurity_unsound_left_rotation

### Short Description of the Vulnerability

The `part1` and `part2` signals are not sufficiently constrained. One can arbitrarily set a value to `part1` or `part2` and find a value for the other signal to satisfy the constraint on line 45. This way you can get another `out` value for a given `in`.

### Circomspect Output for generics.circom

```
circomspect: analyzing template 'RotateLeft32Bits'
warning: Using the signal assignment operator `<--` does not constrain the assigned signal.
   ┌─ /home/ret2basic/zkbugs/dataset/circom/reclaimprotocol_circom_chacha/zksecurity_unsound_left_rotation/circuits/generics.circom:12:2
   │
12 │     signal part2 <-- in >> (32 - L);
   │     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ The assigned signal `part2` is not constrained here.
13 │     out <== part1 + part2;
   │     --------------------- The signal `part2` is constrained here.
14 │     (part1 / 2**L) + (part2 * 2**(32-L)) === in;
   │     -------------------------------------------- The signal `part2` is constrained here.
   │
   = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#signal-assignment.

warning: Using the signal assignment operator `<--` does not constrain the assigned signal.
   ┌─ /home/ret2basic/zkbugs/dataset/circom/reclaimprotocol_circom_chacha/zksecurity_unsound_left_rotation/circuits/generics.circom:11:2
   │
11 │     signal part1 <-- (in << L) & 0xFFFFFFFF;
   │     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ The assigned signal `part1` is not constrained here.
12 │     signal part2 <-- in >> (32 - L);
13 │     out <== part1 + part2;
   │     --------------------- The signal `part1` is constrained here.
14 │     (part1 / 2**L) + (part2 * 2**(32-L)) === in;
   │     -------------------------------------------- The signal `part1` is constrained here.
   │
   = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#signal-assignment.

circomspect: 2 issues found.
```

## circom/spartan_ecdsa/yacademy_input_signal_s_is_not_constrained_in_eff_ecdsa_circom

### Short Description of the Vulnerability

The circuit computes `pubKey = s * T + U` but `s` isn't constrained. If we set `s = 0` and `(Ux, Uy) = pubKey`, then `(Tx, Ty)` can be any pair of values.

### Circomspect Output for eff_ecdsa.circom

```
circomspect: analyzing template 'EfficientECDSA'
warning: The variable `bits` is assigned a value, but this value is never read.
   ┌─ /home/ret2basic/zkbugs/dataset/circom/spartan_ecdsa/yacademy_input_signal_s_is_not_constrained_in_eff_ecdsa_circom/circuits/eff_ecdsa.circom:14:5
   │
14 │     var bits = 256;
   │     ^^^^^^^^^^^^^^ The value assigned to `bits` here is never read.
   │
   = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unused-variable-or-parameter.

circomspect: 1 issue found.
```

## circom/darkforest_circuits/daira_hopwood_darkforest_v0_3_missing_bit_length_check

### Short Description of the Vulnerability

Input of `LessThan(bits)` is assumed to take inputs bounded by `2**(bits-1)`, but there is no constraint for it in `LessThan` template. Attacker can use unexpected values outside the range and pass all the constraints, rendering this RangeProof useless. Note: The original circuit does not contain the output `out`, it was added to prevent snarkJS 'Scalar size does not match' error.

### Circomspect Output for circuit.circom

```
circomspect: No issues found.
```

## circom/uniRep_protocol/veridise_missing_range_checks_on_comparison_circuits

### Short Description of the Vulnerability

Input of `LessThan(8)` is assumed to have <=8 bits, but there is no constraint for it in `LessThan` template. Attacker can use large values such as `p - 1` to trigger overflow and make something like `p - 1 < EPOCH_KEY_NONCE_PER_EPOCH` return true.

### Circomspect Output for epochKeyLite.circom

```
error: Unrecognized EOF found at 507
Expected one of "!", "(", "-", "[", "_", "assert", "component", "for", "if", "log", "parallel", "return", "signal", "var", "while", "{", "}", "~", r#"0x[0-9A-Fa-f]*"#, r#"[$_]*[a-zA-Z][a-zA-Z$_0-9]*"# or r#"[0-9]+"#
  ┌─ /home/ret2basic/zkbugs/dataset/circom/uniRep_protocol/veridise_missing_range_checks_on_comparison_circuits/circuits/epochKeyLite.circom:1:1
  │
1 │ pragma circom 2.0.0;
  │ ^ This token is invalid or unexpected here.

circomspect: 1 issue found.
```

## circom/uniRep_protocol/veridise_underconstrained_circuit_allows_invalid_comparison

### Short Description of the Vulnerability

`Num2Bits(254)` is used so malicious prover can provide input that is larger than scalar field modulus `p` but smaller than `2**254`, exploiting the overflow. That makes some comparison opertions invalid, for example, `1 < p` evaluates to true but in the circuit it is treated as `1 < 0`.

### Circomspect Output for bigComparators.circom

```
circomspect: analyzing template 'BigLessThan'
warning: Inputs to `LessThan` need to be constrained to ensure that they are non-negative
   ┌─ /home/ret2basic/zkbugs/dataset/circom/uniRep_protocol/veridise_underconstrained_circuit_allows_invalid_comparison/circuits/bigComparators.circom:62:23
   │
62 │     high_lt.in[1] <== high[1].out;
   │                       ^^^^^^^^^^^ `high[1].out` needs to be constrained to ensure that it is <= p/2.
   │
   = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unconstrained-less-than.

warning: Inputs to `LessThan` need to be constrained to ensure that they are non-negative
   ┌─ /home/ret2basic/zkbugs/dataset/circom/uniRep_protocol/veridise_underconstrained_circuit_allows_invalid_comparison/circuits/bigComparators.circom:61:23
   │
61 │     high_lt.in[0] <== high[0].out;
   │                       ^^^^^^^^^^^ `high[0].out` needs to be constrained to ensure that it is <= p/2.
   │
   = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unconstrained-less-than.

warning: Inputs to `LessThan` need to be constrained to ensure that they are non-negative
   ┌─ /home/ret2basic/zkbugs/dataset/circom/uniRep_protocol/veridise_underconstrained_circuit_allows_invalid_comparison/circuits/bigComparators.circom:65:22
   │
65 │     low_lt.in[0] <== low[0].out;
   │                      ^^^^^^^^^^ `low[0].out` needs to be constrained to ensure that it is <= p/2.
   │
   = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unconstrained-less-than.

warning: Inputs to `LessThan` need to be constrained to ensure that they are non-negative
   ┌─ /home/ret2basic/zkbugs/dataset/circom/uniRep_protocol/veridise_underconstrained_circuit_allows_invalid_comparison/circuits/bigComparators.circom:66:22
   │
66 │     low_lt.in[1] <== low[1].out;
   │                      ^^^^^^^^^^ `low[1].out` needs to be constrained to ensure that it is <= p/2.
   │
   = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unconstrained-less-than.

warning: Using `Num2Bits` to convert field elements to bits may lead to aliasing issues.
   ┌─ /home/ret2basic/zkbugs/dataset/circom/uniRep_protocol/veridise_underconstrained_circuit_allows_invalid_comparison/circuits/bigComparators.circom:45:19
   │
45 │         bits[x] = Num2Bits(254);
   │                   ^^^^^^^^^^^^^ Circomlib template `Num2Bits` instantiated here.
   │
   = Consider using `Num2Bits_strict` if the input size may be >= than the prime size.
   = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#non-strict-binary-conversion.

circomspect: analyzing template 'UpperLessThan'
warning: Inputs to `LessThan` need to be constrained to ensure that they are non-negative
   ┌─ /home/ret2basic/zkbugs/dataset/circom/uniRep_protocol/veridise_underconstrained_circuit_allows_invalid_comparison/circuits/bigComparators.circom:30:18
   │
30 │     lt.in[0] <== upper_bits[0].out;
   │                  ^^^^^^^^^^^^^^^^^ `upper_bits[0].out` needs to be constrained to ensure that it is <= p/2.
   │
   = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unconstrained-less-than.

warning: Inputs to `LessThan` need to be constrained to ensure that they are non-negative
   ┌─ /home/ret2basic/zkbugs/dataset/circom/uniRep_protocol/veridise_underconstrained_circuit_allows_invalid_comparison/circuits/bigComparators.circom:31:18
   │
31 │     lt.in[1] <== upper_bits[1].out;
   │                  ^^^^^^^^^^^^^^^^^ `upper_bits[1].out` needs to be constrained to ensure that it is <= p/2.
   │
   = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unconstrained-less-than.

warning: Using `Num2Bits` to convert field elements to bits may lead to aliasing issues.
   ┌─ /home/ret2basic/zkbugs/dataset/circom/uniRep_protocol/veridise_underconstrained_circuit_allows_invalid_comparison/circuits/bigComparators.circom:16:19
   │
16 │         bits[x] = Num2Bits(254);
   │                   ^^^^^^^^^^^^^ Circomlib template `Num2Bits` instantiated here.
   │
   = Consider using `Num2Bits_strict` if the input size may be >= than the prime size.
   = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#non-strict-binary-conversion.

warning: Using `Bits2Num` to convert arrays to field elements may lead to aliasing issues.
   ┌─ /home/ret2basic/zkbugs/dataset/circom/uniRep_protocol/veridise_underconstrained_circuit_allows_invalid_comparison/circuits/bigComparators.circom:21:21
   │
21 │     upper_bits[0] = Bits2Num(n);
   │                     ^^^^^^^^^^^ Circomlib template `Bits2Num` instantiated here.
   │
   = Consider using `Bits2Num_strict` if the input size may be >= than the prime size.
   = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#non-strict-binary-conversion.

warning: Using `Bits2Num` to convert arrays to field elements may lead to aliasing issues.
   ┌─ /home/ret2basic/zkbugs/dataset/circom/uniRep_protocol/veridise_underconstrained_circuit_allows_invalid_comparison/circuits/bigComparators.circom:22:21
   │
22 │     upper_bits[1] = Bits2Num(n);
   │                     ^^^^^^^^^^^ Circomlib template `Bits2Num` instantiated here.
   │
   = Consider using `Bits2Num_strict` if the input size may be >= than the prime size.
   = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#non-strict-binary-conversion.

circomspect: analyzing template 'BigGreaterThan'
circomspect: 10 issues found.
```

## circom/circom-bigint_circomlib/veridise_underconstrained_outputs_in_bitElementMulAny

### Short Description of the Vulnerability

`BitElementMulAny` template itself is fine, but it uses `MontgomeryDouble` and `MontgomeryAdd`, which have underconstraint bugs. With the same `input.json`, malicious prover can manipulate lambda value in `MontgomeryDouble` to let the circuit produce different outputs, making it nondeterministic.

### Circomspect Output for escalarmulany.circom

```
circomspect: analyzing template 'BitElementMulAny'
circomspect: analyzing template 'Multiplexor2'
circomspect: No issues found.
```

## circom/circom-bigint_circomlib/veridise_underconstrained_points_in_montgomeryAdd

### Short Description of the Vulnerability

Lambda calculation involves a division but there is no constraint on the divisor to be non-zero. In this case `out[1]` is underconstrained and can be set to any value.

### Circomspect Output for montgomery.circom

```
circomspect: analyzing template 'MontgomeryAdd'
warning: Using the signal assignment operator `<--` does not constrain the assigned signal.
   ┌─ /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_underconstrained_points_in_montgomeryAdd/circuits/montgomery.circom:16:5
   │
16 │     lamda <-- (in2[1] - in1[1]) / (in2[0] - in1[0]);
   │     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ The assigned signal `lamda` is not constrained here.
17 │     lamda * (in2[0] - in1[0]) === (in2[1] - in1[1]);
   │     ------------------------------------------------ The signal `lamda` is constrained here.
18 │ 
19 │     out[0] <== B*lamda*lamda - A - in1[0] -in2[0];
   │     --------------------------------------------- The signal `lamda` is constrained here.
20 │     out[1] <== lamda * (in1[0] - out[0]) - in1[1];
   │     --------------------------------------------- The signal `lamda` is constrained here.
   │
   = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#signal-assignment.

warning: In signal assignments containing division, the divisor needs to be constrained to be non-zero
   ┌─ /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_underconstrained_points_in_montgomeryAdd/circuits/montgomery.circom:16:36
   │
16 │     lamda <-- (in2[1] - in1[1]) / (in2[0] - in1[0]);
   │                                    ^^^^^^^^^^^^^^^ The divisor `(in2[0] - in1[0])` must be constrained to be non-zero.
   │
   = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unconstrained-division.

circomspect: 2 issues found.
```

## circom/circom-bigint_circomlib/veridise_decoder_accepting_bogus_output_signal

### Short Description of the Vulnerability

The circuit does not constrain `out` properly, malicious prover can set a bogus `out` and set `success` to 0, the circuit won't throw error. This makes integration error-prone.

### Circomspect Output for multiplexer.circom

```
circomspect: analyzing template 'Decoder'
warning: Using the signal assignment operator `<--` does not constrain the assigned signal.
   ┌─ /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_decoder_accepting_bogus_output_signal/circuits/multiplexer.circom:10:9
   │
10 │         out[i] <-- (inp == i) ? 1 : 0;
   │         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ The assigned signal `out[i]` is not constrained here.
11 │         out[i] * (inp-i) === 0;
   │         ----------------------- The signal `out[i]` is constrained here.
   │
   = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#signal-assignment.

circomspect: 1 issue found.
```

## circom/circom-bigint_circomlib/veridise_underconstrained_points_in_edwards2Montgomery

### Short Description of the Vulnerability

The circuit does not implement constraint to avoid division by zero. When setting the divisor to 0, `out[1]` is underconstrained and can be set to any value.

### Circomspect Output for montgomery.circom

```
circomspect: analyzing template 'Edwards2Montgomery'
warning: Using the signal assignment operator `<--` does not constrain the assigned signal.
   ┌─ /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_underconstrained_points_in_edwards2Montgomery/circuits/montgomery.circom:7:5
   │
 7 │     out[0] <-- (1 + in[1]) / (1 - in[1]);
   │     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ The assigned signal `out[0]` is not constrained here.
   ·
11 │     out[0] * (1-in[1]) === (1 + in[1]);
   │     ----------------------------------- The signal `out[0]` is constrained here.
12 │     out[1] * in[0] === out[0];
   │     -------------------------- The signal `out[0]` is constrained here.
   │
   = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#signal-assignment.

warning: Using the signal assignment operator `<--` does not constrain the assigned signal.
   ┌─ /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_underconstrained_points_in_edwards2Montgomery/circuits/montgomery.circom:8:5
   │
 8 │     out[1] <-- out[0] / in[0];
   │     ^^^^^^^^^^^^^^^^^^^^^^^^^ The assigned signal `out[1]` is not constrained here.
   ·
12 │     out[1] * in[0] === out[0];
   │     -------------------------- The signal `out[1]` is constrained here.
   │
   = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#signal-assignment.

warning: In signal assignments containing division, the divisor needs to be constrained to be non-zero
  ┌─ /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_underconstrained_points_in_edwards2Montgomery/circuits/montgomery.circom:7:31
  │
7 │     out[0] <-- (1 + in[1]) / (1 - in[1]);
  │                               ^^^^^^^^^ The divisor `(1 - in[1])` must be constrained to be non-zero.
  │
  = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unconstrained-division.

warning: In signal assignments containing division, the divisor needs to be constrained to be non-zero
  ┌─ /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_underconstrained_points_in_edwards2Montgomery/circuits/montgomery.circom:8:25
  │
8 │     out[1] <-- out[0] / in[0];
  │                         ^^^^^ The divisor `in[0]` must be constrained to be non-zero.
  │
  = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unconstrained-division.

circomspect: 4 issues found.
```

## circom/circom-bigint_circomlib/veridise_underconstrained_points_in_montgomeryDouble

### Short Description of the Vulnerability

Lambda calculation involves a division but there is no constraint on the divisor to be non-zero. In this case `lamda` is underconstrained and can be set to any value.

### Circomspect Output for montgomery.circom

```
circomspect: analyzing template 'MontgomeryDouble'
warning: Using the signal assignment operator `<--` does not constrain the assigned signal.
   ┌─ /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_underconstrained_points_in_montgomeryDouble/circuits/montgomery.circom:18:5
   │
18 │     lamda <-- (3*x1_2 + 2*A*in[0] + 1) / (2*B*in[1]);
   │     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ The assigned signal `lamda` is not constrained here.
19 │     lamda * (2*B*in[1]) === (3*x1_2 + 2*A*in[0] + 1);
   │     ------------------------------------------------- The signal `lamda` is constrained here.
20 │ 
21 │     out[0] <== B*lamda*lamda - A - 2*in[0];
   │     -------------------------------------- The signal `lamda` is constrained here.
22 │     out[1] <== lamda * (in[0] - out[0]) - in[1];
   │     ------------------------------------------- The signal `lamda` is constrained here.
   │
   = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#signal-assignment.

warning: In signal assignments containing division, the divisor needs to be constrained to be non-zero
   ┌─ /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_underconstrained_points_in_montgomeryDouble/circuits/montgomery.circom:18:43
   │
18 │     lamda <-- (3*x1_2 + 2*A*in[0] + 1) / (2*B*in[1]);
   │                                           ^^^^^^^^^ The divisor `((2 * B) * in[1])` must be constrained to be non-zero.
   │
   = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unconstrained-division.

circomspect: 2 issues found.
```

## circom/circom-bigint_circomlib/veridise_underconstrained_points_in_montgomery2Edwards

### Short Description of the Vulnerability

The circuit does not implement constraint to avoid division by zero. When setting the divisor to 0, `out[0]` is underconstrained and can be set to any value.

### Circomspect Output for montgomery.circom

```
circomspect: analyzing template 'Montgomery2Edwards'
warning: Using the signal assignment operator `<--` does not constrain the assigned signal.
   ┌─ /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_underconstrained_points_in_montgomery2Edwards/circuits/montgomery.circom:7:5
   │
 7 │     out[0] <-- in[0] / in[1];
   │     ^^^^^^^^^^^^^^^^^^^^^^^^ The assigned signal `out[0]` is not constrained here.
   ·
10 │     out[0] * in[1] === in[0];
   │     ------------------------- The signal `out[0]` is constrained here.
   │
   = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#signal-assignment.

warning: Using the signal assignment operator `<--` does not constrain the assigned signal.
   ┌─ /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_underconstrained_points_in_montgomery2Edwards/circuits/montgomery.circom:8:5
   │
 8 │     out[1] <-- (in[0] - 1) / (in[0] + 1);
   │     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ The assigned signal `out[1]` is not constrained here.
   ·
11 │     out[1] * (in[0] + 1) === in[0] - 1;
   │     ----------------------------------- The signal `out[1]` is constrained here.
   │
   = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#signal-assignment.

warning: In signal assignments containing division, the divisor needs to be constrained to be non-zero
  ┌─ /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_underconstrained_points_in_montgomery2Edwards/circuits/montgomery.circom:7:24
  │
7 │     out[0] <-- in[0] / in[1];
  │                        ^^^^^ The divisor `in[1]` must be constrained to be non-zero.
  │
  = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unconstrained-division.

warning: In signal assignments containing division, the divisor needs to be constrained to be non-zero
  ┌─ /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_underconstrained_points_in_montgomery2Edwards/circuits/montgomery.circom:8:31
  │
8 │     out[1] <-- (in[0] - 1) / (in[0] + 1);
  │                               ^^^^^^^^^ The divisor `(in[0] + 1)` must be constrained to be non-zero.
  │
  = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unconstrained-division.

circomspect: 4 issues found.
```


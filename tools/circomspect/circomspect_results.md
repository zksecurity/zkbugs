# Circomspect Analysis Results

## circom/circomlib_mimc/kobi_gurkan_mimc_hash_assigned_but_not_constrained

### Short Description of the Vulnerability

In `MiMCSponge` template, `outs[0]` is assigned but not constrained, so it can be any value. Note that the circuit code is modified from a newer version since the original buggy code couldn't be reproduced in Circom version 2. The bug idea is still the same.

### Circomspect Output for mimcsponge.circom

```
circomspect: analyzing template 'MiMCSponge'
warning: Using the signal assignment operator `<--` is not necessary here.
   ┌─ /home/ret2basic/zkbugs/dataset/circom/circomlib_mimc/kobi_gurkan_mimc_hash_assigned_but_not_constrained/circuits/mimcsponge.circom:28:3
   │
28 │   outs[0] <-- S[nInputs - 1].xL_out;
   │   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ The expression assigned to `outs[0]` is quadratic.
   │
   = Consider rewriting the statement using the constraint assignment operator `<==`.
   = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unnecessary-signal-assignment.

circomspect: analyzing template 'MiMCFeistel'
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

## circom/spartan_ecdsa/yacademy_under_constrained_circuits_compromising_the_soundness_of_the_system

### Short Description of the Vulnerability

The signals `slo` and `shi` are assigned but not constrained

### Circomspect Output for mul.circom

```
circomspect: analyzing template 'K'
warning: Using the signal assignment operator `<--` does not constrain the assigned signal.
    ┌─ /home/ret2basic/zkbugs/dataset/circom/spartan_ecdsa/yacademy_under_constrained_circuits_compromising_the_soundness_of_the_system/circuits/mul.circom:123:5
    │
123 │     signal slo <-- s & (2 ** (128) - 1);
    │     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ The assigned signal `slo` is not constrained here.
    ·
129 │     inBits.in <== slo + tQlo;
    │     ------------------------ The signal `slo` is constrained here.
    ·
144 │     signal alo <== slo + tQlo - (carry * 2 ** 128);
    │     ---------------------------------------------- The signal `slo` is constrained here.
    ·
170 │     theta.in[1] <== slo + tQlo;
    │     -------------------------- The signal `slo` is constrained here.
    ·
177 │     signal klo <== (slo + tQlo + borrow.out * (2 ** 128)) - isQuotientOne.out * qlo;
    │     ------------------------------------------------------------------------------- The signal `slo` is constrained here.
    │
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#signal-assignment.

warning: Using the signal assignment operator `<--` does not constrain the assigned signal.
    ┌─ /home/ret2basic/zkbugs/dataset/circom/spartan_ecdsa/yacademy_under_constrained_circuits_compromising_the_soundness_of_the_system/circuits/mul.circom:124:5
    │
124 │     signal shi <-- s >> 128;
    │     ^^^^^^^^^^^^^^^^^^^^^^^ The assigned signal `shi` is not constrained here.
    ·
142 │     signal ahi <== shi + tQhi + carry;
    │     --------------------------------- The signal `shi` is constrained here.
    ·
178 │     signal khi <== (shi + tQhi - borrow.out * 1)  - isQuotientOne.out * qhi;
    │     ----------------------------------------------------------------------- The signal `shi` is constrained here.
    │
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#signal-assignment.

warning: Using `Num2Bits` to convert field elements to bits may lead to aliasing issues.
    ┌─ /home/ret2basic/zkbugs/dataset/circom/spartan_ecdsa/yacademy_under_constrained_circuits_compromising_the_soundness_of_the_system/circuits/mul.circom:180:25
    │
180 │     component kloBits = Num2Bits(256);
    │                         ^^^^^^^^^^^^^ Circomlib template `Num2Bits` instantiated here.
    │
    = Consider using `Num2Bits_strict` if the input size may be >= than the prime size.
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#non-strict-binary-conversion.

warning: Using `Num2Bits` to convert field elements to bits may lead to aliasing issues.
    ┌─ /home/ret2basic/zkbugs/dataset/circom/spartan_ecdsa/yacademy_under_constrained_circuits_compromising_the_soundness_of_the_system/circuits/mul.circom:183:25
    │
183 │     component khiBits = Num2Bits(256);
    │                         ^^^^^^^^^^^^^ Circomlib template `Num2Bits` instantiated here.
    │
    = Consider using `Num2Bits_strict` if the input size may be >= than the prime size.
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#non-strict-binary-conversion.

circomspect: analyzing template 'Secp256k1Mul'
circomspect: 4 issues found.
```

## circom/darkforest_circuits/daira_hopwood_darkforest_v0_3_missing_bit_length_check

### Short Description of the Vulnerability

Input of `LessThan(bits)` is assumed to take inputs bounded by `2**(bits-1)`, but there is no constraint for it in `LessThan` template. Attacker can use unexpected values outside the range and pass all the constraints, rendering this RangeProof useless. Note: The original circuit does not contain the output `out`, it was added to prevent snarkJS 'Scalar size does not match' error.

### Circomspect Output for circuit.circom

```
circomspect: No issues found.
```

## circom/semaphore-protocol_semaphore/veridise_no_zero_value_validation

### Short Description of the Vulnerability

The bug in the Semaphore protocol involves the use of a zeroValue in incremental Merkle trees, which acts as an implicit group member. This zeroValue cannot be removed, and its addition does not trigger a MemberAdded event, making it invisible in membership records. This allows the group creator guaranteed access, which can be problematic if the admin changes. Additionally, if common values like 0 are compromised, they could be used to gain unauthorized access to groups.

### Circomspect Output for semaphore.circom

```
circomspect: analyzing template 'CalculateNullifierHash'
circomspect: analyzing template 'CalculateIdentityCommitment'
circomspect: analyzing template 'Semaphore'
warning: Intermediate signals should typically occur in at least two separate constraints.
   ┌─ /home/ret2basic/zkbugs/dataset/circom/semaphore-protocol_semaphore/veridise_no_zero_value_validation/circuits/semaphore.circom:84:5
   │
84 │     signal signalHashSquared;
   │     ^^^^^^^^^^^^^^^^^^^^^^^^ The intermediate signal `signalHashSquared` is declared here.
85 │     signalHashSquared <== signalHash * signalHash;
   │     --------------------------------------------- The intermediate signal `signalHashSquared` is constrained here.
   │
   = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#under-constrained-signal.

circomspect: analyzing template 'CalculateSecret'
circomspect: 1 issue found.
```

## circom/succinctlabs_telepathy-circuits/veridise_arrayxor_is_under_constrained

### Short Description of the Vulnerability

out[i]` is assigned with `<--` but not constrained with `<==`, so it can be set to any value.

### Circomspect Output for hash_to_field.circom

```
circomspect: analyzing template 'ArrayXOR'
warning: Using the signal assignment operator `<--` does not constrain the assigned signal.
  ┌─ /home/ret2basic/zkbugs/dataset/circom/succinctlabs_telepathy-circuits/veridise_arrayxor_is_under_constrained/circuits/hash_to_field.circom:9:9
  │
9 │         out[i] <-- a[i] ^ b[i];
  │         ^^^^^^^^^^^^^^^^^^^^^^ The assigned signal `out[i]` is not constrained here.
  │
  = Consider if it is possible to rewrite the statement using `<==` instead.
  = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#signal-assignment.

warning: The signals `out[n]` are not constrained by the template.
  ┌─ /home/ret2basic/zkbugs/dataset/circom/succinctlabs_telepathy-circuits/veridise_arrayxor_is_under_constrained/circuits/hash_to_field.circom:6:5
  │
6 │     signal output out[n];
  │     ^^^^^^^^^^^^^^^^^^^^ These signals do not occur in a constraint.

warning: The signals `a[n]` are not constrained by the template.
  ┌─ /home/ret2basic/zkbugs/dataset/circom/succinctlabs_telepathy-circuits/veridise_arrayxor_is_under_constrained/circuits/hash_to_field.circom:4:5
  │
4 │     signal input a[n];
  │     ^^^^^^^^^^^^^^^^^ These signals do not occur in a constraint.

warning: The signals `b[n]` are not constrained by the template.
  ┌─ /home/ret2basic/zkbugs/dataset/circom/succinctlabs_telepathy-circuits/veridise_arrayxor_is_under_constrained/circuits/hash_to_field.circom:5:5
  │
5 │     signal input b[n];
  │     ^^^^^^^^^^^^^^^^^ These signals do not occur in a constraint.

circomspect: 4 issues found.
```

## circom/succinctlabs_telepathy-circuits/trailofbits_prover_can_lock_user_funds_by_including_ill-formed_bigints_in_public_key_commitment

### Short Description of the Vulnerability

The `Rotate()` template in rotate.circom fails to validate the format of BigInts in public keys. SubgroupCheckG1WithValidX assumes that its input is a properly formed BigInt, with all limbs less than 2**55. This property is not validated anywhere in the `Rotate()` template. It allows a malicious prover to manipulate public keys by inserting ill-formed BigInts, specifically by altering the y-coordinate of public keys. This manipulation can lock user funds by preventing future provers from generating valid proofs, as the circuit uses these malformed keys without proper validation. The exploit involves modifying the y coordinate in a public key to create an invalid commitment, which then updates the system's commitment state, potentially leading to incorrect or fraudulent operations.

### Circomspect Output for bls12_381_hash_to_G2.circom

```
circomspect: analyzing template 'ClearCofactorG2'
circomspect: analyzing template 'SubgroupCheckG1'
warning: The output signal `underflow` defined by the template `BigSub` is not constrained in `SubgroupCheckG1`.
    ┌─ /home/ret2basic/zkbugs/dataset/circom/succinctlabs_telepathy-circuits/trailofbits_prover_can_lock_user_funds_by_including_ill-formed_bigints_in_public_key_commitment/circuits/pairing/bls12_381_hash_to_G2.circom:696:27
    │
696 │     component phiPy_neg = BigSub(n, k);
    │                           ^^^^^^^^^^^^ The template `BigSub` is instantiated here.
    │
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unused-output-signal.

circomspect: analyzing template 'EndomorphismPsi2'
warning: The output signal `underflow` defined by the template `BigSub` is not constrained in `EndomorphismPsi2`.
    ┌─ /home/ret2basic/zkbugs/dataset/circom/succinctlabs_telepathy-circuits/trailofbits_prover_can_lock_user_funds_by_including_ill-formed_bigints_in_public_key_commitment/circuits/pairing/bls12_381_hash_to_G2.circom:458:17
    │
458 │         qy[i] = BigSub(n, k);
    │                 ^^^^^^^^^^^^ The template `BigSub` is instantiated here.
    │
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unused-output-signal.

circomspect: analyzing template 'OptSimpleSWU2'
warning: Using the signal assignment operator `<--` does not constrain the assigned signal.
    ┌─ /home/ret2basic/zkbugs/dataset/circom/succinctlabs_telepathy-circuits/trailofbits_prover_can_lock_user_funds_by_including_ill-formed_bigints_in_public_key_commitment/circuits/pairing/bls12_381_hash_to_G2.circom:212:9
    │
212 │         out[1][i][idx] <-- Y[i][idx];
    │         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^ The assigned signal `out[1][i][idx]` is not constrained here.
213 │         Y_sq.a[i][idx] <== out[1][i][idx];
    │         --------------------------------- The signal `out[1][i][idx]` is constrained here.
214 │         Y_sq.b[i][idx] <== out[1][i][idx];
    │         --------------------------------- The signal `out[1][i][idx]` is constrained here.
    │
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#signal-assignment.

warning: Using the signal assignment operator `<--` does not constrain the assigned signal.
    ┌─ /home/ret2basic/zkbugs/dataset/circom/succinctlabs_telepathy-circuits/trailofbits_prover_can_lock_user_funds_by_including_ill-formed_bigints_in_public_key_commitment/circuits/pairing/bls12_381_hash_to_G2.circom:168:5
    │
168 │     isSquare <-- is_square;
    │     ^^^^^^^^^^^^^^^^^^^^^^ The assigned signal `isSquare` is not constrained here.
169 │     isSquare * (1-isSquare) === 0; 
    │     ------------------------------ The signal `isSquare` is constrained here.
    ·
192 │         out[0][i][idx] <== isSquare * (X0.out[i][idx] - X1.out[i][idx]) + X1.out[i][idx];  
    │         -------------------------------------------------------------------------------- The signal `isSquare` is constrained here.
    ·
217 │         Y_sq.out[i][idx] === isSquare * (gX0.out[i][idx] - gX1.out[i][idx]) + gX1.out[i][idx]; 
    │         -------------------------------------------------------------------------------------- The signal `isSquare` is constrained here.
    │
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#signal-assignment.

warning: The output signal `X` defined by the template `SignedFp2CarryModP` is not constrained in `OptSimpleSWU2`.
   ┌─ /home/ret2basic/zkbugs/dataset/circom/succinctlabs_telepathy-circuits/trailofbits_prover_can_lock_user_funds_by_including_ill-formed_bigints_in_public_key_commitment/circuits/pairing/bls12_381_hash_to_G2.circom:51:25
   │
51 │     component xi_t_sq = SignedFp2CarryModP(n, k, 3*n + 2*LOGK + 3, p);
   │                         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ The template `SignedFp2CarryModP` is instantiated here.
   │
   = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unused-output-signal.

warning: The output signal `X` defined by the template `SignedFp2CarryModP` is not constrained in `OptSimpleSWU2`.
   ┌─ /home/ret2basic/zkbugs/dataset/circom/succinctlabs_telepathy-circuits/trailofbits_prover_can_lock_user_funds_by_including_ill-formed_bigints_in_public_key_commitment/circuits/pairing/bls12_381_hash_to_G2.circom:69:24
   │
69 │     component X0_den = SignedFp2CarryModP(n, k, 3*n + 2*LOGK + 2 + 9, p);
   │                        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ The template `SignedFp2CarryModP` is instantiated here.
   │
   = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unused-output-signal.

warning: The output signal `X` defined by the template `SignedFp2CarryModP` is not constrained in `OptSimpleSWU2`.
   ┌─ /home/ret2basic/zkbugs/dataset/circom/succinctlabs_telepathy-circuits/trailofbits_prover_can_lock_user_funds_by_including_ill-formed_bigints_in_public_key_commitment/circuits/pairing/bls12_381_hash_to_G2.circom:91:24
   │
91 │     component X0_num = SignedFp2CarryModP(n, k, 3*n + 2*LOGK + 2 + 11, p);
   │                        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ The template `SignedFp2CarryModP` is instantiated here.
   │
   = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unused-output-signal.

circomspect: analyzing template 'EndomorphismPsi'
circomspect: analyzing template 'Iso3Map'
circomspect: analyzing template 'SubgroupCheckG1WithValidX'
warning: The variable `x_abs` is assigned a value, but this value is never read.
    ┌─ /home/ret2basic/zkbugs/dataset/circom/succinctlabs_telepathy-circuits/trailofbits_prover_can_lock_user_funds_by_including_ill-formed_bigints_in_public_key_commitment/circuits/pairing/bls12_381_hash_to_G2.circom:726:5
    │
726 │     var x_abs = get_BLS12_381_parameter();
    │     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ The value assigned to `x_abs` here is never read.
    │
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unused-variable-or-parameter.

circomspect: analyzing template 'SubgroupCheckG2'
circomspect: analyzing template 'MapToG2'
circomspect: 8 issues found.
```

## circom/succinctlabs_telepathy-circuits/veridise_template_CoreVerifyPubkeyG1_does_not_perform_input_validation_simplified

### Short Description of the Vulnerability

This bug is in the circom-pairing BLS signature verification logic. pubkey, signature and hash are divided into 7-entry chunks of 55-bit data, and each entry is checked against according entry in `p`. When calling `BigLessThan()`, the output isn't verified therefore attacker can manipulate the input so that it overflows p.

### Circomspect Output for bls_signature.circom

```
circomspect: analyzing template 'CoreVerifyPubkeyG1ToyExample'
warning: The signal `out` is not used by the template.
   ┌─ /home/ret2basic/zkbugs/dataset/circom/succinctlabs_telepathy-circuits/veridise_template_CoreVerifyPubkeyG1_does_not_perform_input_validation_simplified/circuits/bls_signature.circom:73:5
   │
73 │     signal output out; // @reproduce a dummy output to suppress "snarkJS: Error: Scalar size does not match" bug
   │     ^^^^^^^^^^^^^^^^^ This signal is unused and could be removed.
   │
   = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unused-variable-or-parameter.

warning: The output signal `out` defined by the template `BigLessThan` is not constrained in `CoreVerifyPubkeyG1ToyExample`.
   ┌─ /home/ret2basic/zkbugs/dataset/circom/succinctlabs_telepathy-circuits/veridise_template_CoreVerifyPubkeyG1_does_not_perform_input_validation_simplified/circuits/bls_signature.circom:80:17
   │
80 │         lt[i] = BigLessThan(n, k);
   │                 ^^^^^^^^^^^^^^^^^ The template `BigLessThan` is instantiated here.
   │
   = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unused-output-signal.

circomspect: analyzing template 'CoreVerifyPubkeyG1NoCheck'
circomspect: 2 issues found.
```

## circom/succinctlabs_telepathy-circuits/veridise_zero_padding_for_sha256_in_ExpandMessageXMD_is_vulnerable_to_an_overflow

### Short Description of the Vulnerability

Template ExpandMessageXMD calls I2OSP(64) with `in` set to 0. In template I2OSP, numbers are represented in bigint format, a 64-byte chunk. This representation allows number much larger than scalar field modulus `p`, so attacker can compute `0 + k * p` and turn that into bigint representation and still pass the constraints.

### Circomspect Output for hash_to_field.circom

```
circomspect: analyzing template 'I2OSP'
warning: Using the signal assignment operator `<--` does not constrain the assigned signal.
  ┌─ /home/ret2basic/zkbugs/dataset/circom/succinctlabs_telepathy-circuits/veridise_zero_padding_for_sha256_in_ExpandMessageXMD_is_vulnerable_to_an_overflow/circuits/hash_to_field.circom:9:9
  │
9 │         out[i] <-- value & 255;
  │         ^^^^^^^^^^^^^^^^^^^^^^ The assigned signal `out[i]` is not constrained here.
  │
  = Consider if it is possible to rewrite the statement using `<==` instead.
  = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#signal-assignment.

circomspect: 1 issue found.
```

## circom/succinctlabs_telepathy-circuits/veridise_sync_committee_can_be_rotated_successfully_with_random_public_keys

### Short Description of the Vulnerability

The circuit does not implement constraint to avoid division by zero. When setting the divisor to 0, `out[0]` is underconstrained and can be set to any value.

### Circomspect Output for rotate.circom

```
circomspect: analyzing template 'Rotate'
circomspect: No issues found.
```

## circom/succinctlabs_telepathy-circuits/trailofbits_prover_can_lock_user_funds_by_supplying_non-reduced_Y_values_to_G1BigIntToSignFlag

### Short Description of the Vulnerability

`G1BigIntToSignFlag` fails to check if the y-coordinate is properly reduced mod p. This missing of range check allows malicious prover to lock user funds by supplying a non-reduced y-coordinate, which can be manipulated to have a positive sign when it should be negative. This manipulation can prevent future provers from generating valid proofs, effectively halting the LightClient and trapping user funds in the bridge.

### Circomspect Output for bls.circom

```
circomspect: analyzing template 'G1BytesToBigInt'
warning: Using `Bits2Num` to convert arrays to field elements may lead to aliasing issues.
    ┌─ /home/ret2basic/zkbugs/dataset/circom/succinctlabs_telepathy-circuits/trailofbits_prover_can_lock_user_funds_by_supplying_non-reduced_Y_values_to_G1BigIntToSignFlag/circuits/bls.circom:161:34
    │
161 │         convertBitsToBigInt[i] = Bits2Num(N);
    │                                  ^^^^^^^^^^^ Circomlib template `Bits2Num` instantiated here.
    │
    = Consider using `Bits2Num_strict` if the input size may be >= than the prime size.
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#non-strict-binary-conversion.

circomspect: analyzing template 'G1Add'
warning: The parameter `N` is never read.
   ┌─ /home/ret2basic/zkbugs/dataset/circom/succinctlabs_telepathy-circuits/trailofbits_prover_can_lock_user_funds_by_supplying_non-reduced_Y_values_to_G1BigIntToSignFlag/circuits/bls.circom:83:25
   │
83 │ template parallel G1Add(N, K) {
   │                         ^^^^ The parameter `N` is never used in `G1Add`.
   │
   = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unused-variable-or-parameter.

circomspect: analyzing template 'G1BytesToSignFlag'
warning: The parameter `N` is never read.
    ┌─ /home/ret2basic/zkbugs/dataset/circom/succinctlabs_telepathy-circuits/trailofbits_prover_can_lock_user_funds_by_supplying_non-reduced_Y_values_to_G1BigIntToSignFlag/circuits/bls.circom:177:28
    │
177 │ template G1BytesToSignFlag(N, K, G1_POINT_SIZE) {
    │                            ^^^^^^^^^^^^^^^^^^^ The parameter `N` is never used in `G1BytesToSignFlag`.
    │
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unused-variable-or-parameter.

warning: The parameter `K` is never read.
    ┌─ /home/ret2basic/zkbugs/dataset/circom/succinctlabs_telepathy-circuits/trailofbits_prover_can_lock_user_funds_by_supplying_non-reduced_Y_values_to_G1BigIntToSignFlag/circuits/bls.circom:177:28
    │
177 │ template G1BytesToSignFlag(N, K, G1_POINT_SIZE) {
    │                            ^^^^^^^^^^^^^^^^^^^ The parameter `K` is never used in `G1BytesToSignFlag`.
    │
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unused-variable-or-parameter.

circomspect: analyzing template 'G1Reduce'
circomspect: analyzing template 'G1BigIntToSignFlag'
warning: The variable `LOG_K` is assigned a value, but this value is never read.
    ┌─ /home/ret2basic/zkbugs/dataset/circom/succinctlabs_telepathy-circuits/trailofbits_prover_can_lock_user_funds_by_supplying_non-reduced_Y_values_to_G1BigIntToSignFlag/circuits/bls.circom:203:5
    │
203 │     var LOG_K = log_ceil(K);
    │     ^^^^^^^^^^^^^^^^^^^^^^^ The value assigned to `LOG_K` here is never read.
    │
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unused-variable-or-parameter.

circomspect: analyzing template 'G1AddMany'
circomspect: 5 issues found.
```

## circom/succinctlabs_telepathy-circuits/trailofbits_incorrect_handling_of_point_doubling_can_allow_signature_forgery

### Short Description of the Vulnerability

`G1Add` calls `EllipticCurveAddUnequal`. The template `EllipticCurveAddUnequal` assumes input `a` and `b` are two unequal public keys but this is not checked. Attacker can use two same public keys to do sophisticated attacks. In such scenario, the constraint on output in `EllipticCurveAddUnequal` reduces to 0 = 0 so it is always true. In other words, attacker can do point doubling at a place where it is supposed to do point addition of two unequal EC points.

### Circomspect Output for curve.circom

```
circomspect: analyzing template 'EllipticCurveAddUnequal'
warning: Using the signal assignment operator `<--` does not constrain the assigned signal.
    ┌─ /home/ret2basic/zkbugs/dataset/circom/succinctlabs_telepathy-circuits/trailofbits_incorrect_handling_of_point_doubling_can_allow_signature_forgery/circuits/pairing/curve.circom:179:9
    │
179 │         out[1][i] <-- y3[i];
    │         ^^^^^^^^^^^^^^^^^^^ The assigned signal `out[1][i]` is not constrained here.
    │
    = Consider if it is possible to rewrite the statement using `<==` instead.
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#signal-assignment.

warning: Using the signal assignment operator `<--` does not constrain the assigned signal.
    ┌─ /home/ret2basic/zkbugs/dataset/circom/succinctlabs_telepathy-circuits/trailofbits_incorrect_handling_of_point_doubling_can_allow_signature_forgery/circuits/pairing/curve.circom:178:9
    │
178 │         out[0][i] <-- x3[i];
    │         ^^^^^^^^^^^^^^^^^^^ The assigned signal `out[0][i]` is not constrained here.
    │
    = Consider if it is possible to rewrite the statement using `<==` instead.
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#signal-assignment.

warning: The output signal `X` defined by the template `SignedCheckCarryModToZero` is not constrained in `EllipticCurveAddUnequal`.
    ┌─ /home/ret2basic/zkbugs/dataset/circom/succinctlabs_telepathy-circuits/trailofbits_incorrect_handling_of_point_doubling_can_allow_signature_forgery/circuits/pairing/curve.circom:209:27
    │
209 │     component cubic_mod = SignedCheckCarryModToZero(n, k, 4*n + LOGK3, p);
    │                           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ The template `SignedCheckCarryModToZero` is instantiated here.
    │
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unused-output-signal.

circomspect: analyzing template 'PointOnLine'
warning: The output signal `X` defined by the template `SignedCheckCarryModToZero` is not constrained in `PointOnLine`.
   ┌─ /home/ret2basic/zkbugs/dataset/circom/succinctlabs_telepathy-circuits/trailofbits_incorrect_handling_of_point_doubling_can_allow_signature_forgery/circuits/pairing/curve.circom:35:26
   │
35 │     component diff_mod = SignedCheckCarryModToZero(n, k, 3*n + LOGK2, p);
   │                          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ The template `SignedCheckCarryModToZero` is instantiated here.
   │
   = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unused-output-signal.

circomspect: analyzing template 'EllipticCurveScalarMultiply'
warning: The variable `LOGK` is assigned a value, but this value is never read.
    ┌─ /home/ret2basic/zkbugs/dataset/circom/succinctlabs_telepathy-circuits/trailofbits_incorrect_handling_of_point_doubling_can_allow_signature_forgery/circuits/pairing/curve.circom:380:5
    │
380 │     var LOGK = log_ceil(k);
    │     ^^^^^^^^^^^^^^^^^^^^^^ The value assigned to `LOGK` here is never read.
    │
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unused-variable-or-parameter.

circomspect: analyzing template 'PointOnTangent'
warning: The output signal `X` defined by the template `SignedCheckCarryModToZero` is not constrained in `PointOnTangent`.
    ┌─ /home/ret2basic/zkbugs/dataset/circom/succinctlabs_telepathy-circuits/trailofbits_incorrect_handling_of_point_doubling_can_allow_signature_forgery/circuits/pairing/curve.circom:136:28
    │
136 │     component constraint = SignedCheckCarryModToZero(n, k, 4*n + LOGK3, p);
    │                            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ The template `SignedCheckCarryModToZero` is instantiated here.
    │
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unused-output-signal.

circomspect: analyzing template 'EllipticCurveScalarMultiplyUnequal'
warning: The variable `LOGK` is assigned a value, but this value is never read.
    ┌─ /home/ret2basic/zkbugs/dataset/circom/succinctlabs_telepathy-circuits/trailofbits_incorrect_handling_of_point_doubling_can_allow_signature_forgery/circuits/pairing/curve.circom:456:5
    │
456 │     var LOGK = log_ceil(k);
    │     ^^^^^^^^^^^^^^^^^^^^^^ The value assigned to `LOGK` here is never read.
    │
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unused-variable-or-parameter.

circomspect: analyzing template 'PointOnCurve'
warning: The output signal `X` defined by the template `SignedCheckCarryModToZero` is not constrained in `PointOnCurve`.
   ┌─ /home/ret2basic/zkbugs/dataset/circom/succinctlabs_telepathy-circuits/trailofbits_incorrect_handling_of_point_doubling_can_allow_signature_forgery/circuits/pairing/curve.circom:86:28
   │
86 │     component constraint = SignedCheckCarryModToZero(n, k, 4*n + LOGK2, p);
   │                            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ The template `SignedCheckCarryModToZero` is instantiated here.
   │
   = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unused-output-signal.

circomspect: analyzing template 'EllipticCurveDouble'
warning: Using the signal assignment operator `<--` does not constrain the assigned signal.
    ┌─ /home/ret2basic/zkbugs/dataset/circom/succinctlabs_telepathy-circuits/trailofbits_incorrect_handling_of_point_doubling_can_allow_signature_forgery/circuits/pairing/curve.circom:272:9
    │
272 │         out[1][i] <-- y3[i];
    │         ^^^^^^^^^^^^^^^^^^^ The assigned signal `out[1][i]` is not constrained here.
    │
    = Consider if it is possible to rewrite the statement using `<==` instead.
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#signal-assignment.

warning: Using the signal assignment operator `<--` does not constrain the assigned signal.
    ┌─ /home/ret2basic/zkbugs/dataset/circom/succinctlabs_telepathy-circuits/trailofbits_incorrect_handling_of_point_doubling_can_allow_signature_forgery/circuits/pairing/curve.circom:271:9
    │
271 │         out[0][i] <-- x3[i];
    │         ^^^^^^^^^^^^^^^^^^^ The assigned signal `out[0][i]` is not constrained here.
    │
    = Consider if it is possible to rewrite the statement using `<==` instead.
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#signal-assignment.

circomspect: analyzing template 'EllipticCurveAdd'
circomspect: 10 issues found.
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
   ┌─ /home/ret2basic/zkbugs/dataset/circom/uniRep_protocol/veridise_underconstrained_circuit_allows_invalid_comparison/circuits/bigComparators.circom:31:18
   │
31 │     lt.in[1] <== upper_bits[1].out;
   │                  ^^^^^^^^^^^^^^^^^ `upper_bits[1].out` needs to be constrained to ensure that it is <= p/2.
   │
   = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unconstrained-less-than.

warning: Inputs to `LessThan` need to be constrained to ensure that they are non-negative
   ┌─ /home/ret2basic/zkbugs/dataset/circom/uniRep_protocol/veridise_underconstrained_circuit_allows_invalid_comparison/circuits/bigComparators.circom:30:18
   │
30 │     lt.in[0] <== upper_bits[0].out;
   │                  ^^^^^^^^^^^^^^^^^ `upper_bits[0].out` needs to be constrained to ensure that it is <= p/2.
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

## circom/zkopru/leastauthority_previously_correct_ownership_proof_disabled_via_code_changes

### Short Description of the Vulnerability

The circuit integrates with `EdDSAPoseidonVerifier` template from circomlib, but the `enabled` signal is set to 0, disabling the verification. There is no signature verification in the circuit, so attacker can craft some non-existent signature and still generate a valid proof.

### Circomspect Output for ownership_proof.circom

```
circomspect: analyzing template 'OwnershipProof'
warning: The signal `out` is not used by the template.
   ┌─ /home/ret2basic/zkbugs/dataset/circom/zkopru/leastauthority_previously_correct_ownership_proof_disabled_via_code_changes/circuits/ownership_proof.circom:11:5
   │
11 │     signal output out; // @audit To suppress "snarkJS: Error: Scalar size does not match"
   │     ^^^^^^^^^^^^^^^^^ This signal is unused and could be removed.
   │
   = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unused-variable-or-parameter.

warning: The output signal `out` defined by the template `EdDSAPoseidonVerifier` is not constrained in `OwnershipProof`.
   ┌─ /home/ret2basic/zkbugs/dataset/circom/zkopru/leastauthority_previously_correct_ownership_proof_disabled_via_code_changes/circuits/ownership_proof.circom:13:23
   │
13 │     component eddsa = EdDSAPoseidonVerifier();
   │                       ^^^^^^^^^^^^^^^^^^^^^^^ The template `EdDSAPoseidonVerifier` is instantiated here.
   │
   = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unused-output-signal.

circomspect: 2 issues found.
```

## circom/circom-bigint_circomlib/veridise_underconstrained_outputs_in_bitElementMulAny

### Short Description of the Vulnerability

`BitElementMulAny` template itself is fine, but it uses `MontgomeryDouble` and `MontgomeryAdd`, which have underconstraint bugs. With the same `input.json`, malicious prover can manipulate lambda value in `MontgomeryDouble` to let the circuit produce different outputs, making it nondeterministic.

### Circomspect Output for escalarmulany.circom

```
circomspect: analyzing template 'Multiplexor2'
circomspect: analyzing template 'BitElementMulAny'
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

## circom/circom-bigint_circomlib/veridise_missing_range_checks_in_bigmod

### Short Description of the Vulnerability

The bug in the BigMod template arises from missing range checks on the remainder `mod[i]`, allowing it to exceed the expected range of `2**n`. This underconstrained error can be exploited by providing inputs that result in a remainder larger than `2^n`, potentially compromising the integrity of the circuit. Proper range checks are applied to the quotient `div[i]`, but not to `mod[i]`, leaving the system vulnerable to malicious inputs that break the invariant of the modulus operation.

### Circomspect Output for bigint.circom

```
circomspect: analyzing template 'ModSub'
warning: Inputs to `LessThan` need to be constrained to ensure that they are non-negative
   ┌─ /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_missing_range_checks_in_bigmod/circuits/bigint.circom:31:18
   │
31 │     lt.in[0] <== a;
   │                  ^ `a` needs to be constrained to ensure that it is <= p/2.
   │
   = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unconstrained-less-than.

warning: Inputs to `LessThan` need to be constrained to ensure that they are non-negative
   ┌─ /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_missing_range_checks_in_bigmod/circuits/bigint.circom:32:18
   │
32 │     lt.in[1] <== b;
   │                  ^ `b` needs to be constrained to ensure that it is <= p/2.
   │
   = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unconstrained-less-than.

circomspect: analyzing template 'BigMod'
warning: Using the signal assignment operator `<--` does not constrain the assigned signal.
    ┌─ /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_missing_range_checks_in_bigmod/circuits/bigint.circom:374:9
    │
374 │         mod[i] <-- longdiv[1][i];
    │         ^^^^^^^^^^^^^^^^^^^^^^^^ The assigned signal `mod[i]` is not constrained here.
    │
    = Consider if it is possible to rewrite the statement using `<==` instead.
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#signal-assignment.

warning: Using the signal assignment operator `<--` does not constrain the assigned signal.
    ┌─ /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_missing_range_checks_in_bigmod/circuits/bigint.circom:376:5
    │
376 │     div[k] <-- longdiv[0][k];
    │     ^^^^^^^^^^^^^^^^^^^^^^^^ The assigned signal `div[k]` is not constrained here.
    ·
388 │     mul.a[k] <== div[k];
    │     ------------------- The signal `div[k]` is constrained here.
    │
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#signal-assignment.

warning: Using the signal assignment operator `<--` does not constrain the assigned signal.
    ┌─ /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_missing_range_checks_in_bigmod/circuits/bigint.circom:373:9
    │
373 │         div[i] <-- longdiv[0][i];
    │         ^^^^^^^^^^^^^^^^^^^^^^^^ The assigned signal `div[i]` is not constrained here.
    │
    = Consider if it is possible to rewrite the statement using `<==` instead.
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#signal-assignment.

warning: Using `Num2Bits` to convert field elements to bits may lead to aliasing issues.
    ┌─ /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_missing_range_checks_in_bigmod/circuits/bigint.circom:379:27
    │
379 │         range_checks[i] = Num2Bits(n);
    │                           ^^^^^^^^^^^ Circomlib template `Num2Bits` instantiated here.
    │
    = Consider using `Num2Bits_strict` if the input size may be >= than the prime size.
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#non-strict-binary-conversion.

circomspect: analyzing template 'BigIsEqual'
circomspect: analyzing template 'ModSubThree'
warning: Inputs to `LessThan` need to be constrained to ensure that they are non-negative
   ┌─ /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_missing_range_checks_in_bigmod/circuits/bigint.circom:50:18
   │
50 │     lt.in[0] <== a;
   │                  ^ `a` needs to be constrained to ensure that it is <= p/2.
   │
   = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unconstrained-less-than.

warning: Inputs to `LessThan` need to be constrained to ensure that they are non-negative
   ┌─ /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_missing_range_checks_in_bigmod/circuits/bigint.circom:51:18
   │
51 │     lt.in[1] <== b_plus_c;
   │                  ^^^^^^^^ `b_plus_c` needs to be constrained to ensure that it is <= p/2.
   │
   = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unconstrained-less-than.

circomspect: analyzing template 'BigSubModP'
circomspect: analyzing template 'BigAdd'
circomspect: analyzing template 'ModSum'
warning: Using `Num2Bits` to convert field elements to bits may lead to aliasing issues.
   ┌─ /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_missing_range_checks_in_bigmod/circuits/bigint.circom:17:21
   │
17 │     component n2b = Num2Bits(n + 1);
   │                     ^^^^^^^^^^^^^^^ Circomlib template `Num2Bits` instantiated here.
   │
   = Consider using `Num2Bits_strict` if the input size may be >= than the prime size.
   = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#non-strict-binary-conversion.

circomspect: analyzing template 'BigLessThan'
warning: Inputs to `LessThan` need to be constrained to ensure that they are non-negative
    ┌─ /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_missing_range_checks_in_bigmod/circuits/bigint.circom:307:25
    │
307 │         lt[i].in[0] <== a[i];
    │                         ^^^^ `a[i]` needs to be constrained to ensure that it is <= p/2.
    │
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unconstrained-less-than.

warning: Inputs to `LessThan` need to be constrained to ensure that they are non-negative
    ┌─ /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_missing_range_checks_in_bigmod/circuits/bigint.circom:308:25
    │
308 │         lt[i].in[1] <== b[i];
    │                         ^^^^ `b[i]` needs to be constrained to ensure that it is <= p/2.
    │
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unconstrained-less-than.

circomspect: analyzing template 'BigMult'
circomspect: analyzing template 'LongToShortNoEndCarry'
warning: Using the signal assignment operator `<--` does not constrain the assigned signal.
    ┌─ /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_missing_range_checks_in_bigmod/circuits/bigint.circom:250:13
    │
250 │             out[i] <-- sumAndCarry[0];
    │             ^^^^^^^^^^^^^^^^^^^^^^^^^ The assigned signal `out[i]` is not constrained here.
    │
    = Consider if it is possible to rewrite the statement using `<==` instead.
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#signal-assignment.

warning: Using the signal assignment operator `<--` does not constrain the assigned signal.
    ┌─ /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_missing_range_checks_in_bigmod/circuits/bigint.circom:237:2
    │
237 │     out[1] <-- split[0][1];
    │     ^^^^^^^^^^^^^^^^^^^^^^ The assigned signal `out[1]` is not constrained here.
    │
    = Consider if it is possible to rewrite the statement using `<==` instead.
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#signal-assignment.

warning: Using the signal assignment operator `<--` is not necessary here.
    ┌─ /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_missing_range_checks_in_bigmod/circuits/bigint.circom:264:5
    │
264 │     runningCarry[0] <-- (in[0] - out[0]) / (1 << n);
    │     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ The expression assigned to `runningCarry[0]` is quadratic.
    │
    = Consider rewriting the statement using the constraint assignment operator `<==`.
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unnecessary-signal-assignment.

warning: Using the signal assignment operator `<--` does not constrain the assigned signal.
    ┌─ /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_missing_range_checks_in_bigmod/circuits/bigint.circom:235:5
    │
235 │     out[0] <-- split[0][0];
    │     ^^^^^^^^^^^^^^^^^^^^^^ The assigned signal `out[0]` is not constrained here.
    ·
267 │     runningCarry[0] * (1 << n) === in[0] - out[0];
    │     ---------------------------------------------- The signal `out[0]` is constrained here.
    │
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#signal-assignment.

warning: Using the signal assignment operator `<--` does not constrain the assigned signal.
    ┌─ /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_missing_range_checks_in_bigmod/circuits/bigint.circom:241:9
    │
241 │         out[1] <-- sumAndCarry[0];
    │         ^^^^^^^^^^^^^^^^^^^^^^^^^ The assigned signal `out[1]` is not constrained here.
    │
    = Consider if it is possible to rewrite the statement using `<==` instead.
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#signal-assignment.

warning: Using the signal assignment operator `<--` is not necessary here.
    ┌─ /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_missing_range_checks_in_bigmod/circuits/bigint.circom:269:9
    │
269 │         runningCarry[i] <-- (in[i] - out[i] + runningCarry[i-1]) / (1 << n);
    │         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ The expression assigned to `runningCarry[i]` is quadratic.
    │
    = Consider rewriting the statement using the constraint assignment operator `<==`.
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unnecessary-signal-assignment.

warning: Using the signal assignment operator `<--` does not constrain the assigned signal.
    ┌─ /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_missing_range_checks_in_bigmod/circuits/bigint.circom:245:2
    │
245 │     out[2] <-- split[1][1] + split[0][2] + carry[1];
    │     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ The assigned signal `out[2]` is not constrained here.
    │
    = Consider if it is possible to rewrite the statement using `<==` instead.
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#signal-assignment.

warning: Using the signal assignment operator `<--` does not constrain the assigned signal.
    ┌─ /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_missing_range_checks_in_bigmod/circuits/bigint.circom:253:9
    │
253 │         out[k] <-- split[k-1][1] + split[k-2][2] + carry[k-1];
    │         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ The assigned signal `out[k]` is not constrained here.
    ·
274 │     runningCarry[k-1] === out[k];
    │     ----------------------------- The signal `out[k]` is constrained here.
    │
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#signal-assignment.

warning: Using `Num2Bits` to convert field elements to bits may lead to aliasing issues.
    ┌─ /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_missing_range_checks_in_bigmod/circuits/bigint.circom:258:29
    │
258 │         outRangeChecks[i] = Num2Bits(n);
    │                             ^^^^^^^^^^^ Circomlib template `Num2Bits` instantiated here.
    │
    = Consider using `Num2Bits_strict` if the input size may be >= than the prime size.
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#non-strict-binary-conversion.

warning: Using `Num2Bits` to convert field elements to bits may lead to aliasing issues.
    ┌─ /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_missing_range_checks_in_bigmod/circuits/bigint.circom:265:34
    │
265 │     runningCarryRangeChecks[0] = Num2Bits(n + log_ceil(k));
    │                                  ^^^^^^^^^^^^^^^^^^^^^^^^^ Circomlib template `Num2Bits` instantiated here.
    │
    = Consider using `Num2Bits_strict` if the input size may be >= than the prime size.
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#non-strict-binary-conversion.

warning: Using `Num2Bits` to convert field elements to bits may lead to aliasing issues.
    ┌─ /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_missing_range_checks_in_bigmod/circuits/bigint.circom:270:38
    │
270 │         runningCarryRangeChecks[i] = Num2Bits(n + log_ceil(k));
    │                                      ^^^^^^^^^^^^^^^^^^^^^^^^^ Circomlib template `Num2Bits` instantiated here.
    │
    = Consider using `Num2Bits_strict` if the input size may be >= than the prime size.
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#non-strict-binary-conversion.

circomspect: analyzing template 'ModSumFour'
warning: Using `Num2Bits` to convert field elements to bits may lead to aliasing issues.
   ┌─ /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_missing_range_checks_in_bigmod/circuits/bigint.circom:79:21
   │
79 │     component n2b = Num2Bits(n + 2);
   │                     ^^^^^^^^^^^^^^^ Circomlib template `Num2Bits` instantiated here.
   │
   = Consider using `Num2Bits_strict` if the input size may be >= than the prime size.
   = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#non-strict-binary-conversion.

circomspect: analyzing template 'BigSub'
circomspect: analyzing template 'ModSumThree'
warning: Using `Num2Bits` to convert field elements to bits may lead to aliasing issues.
   ┌─ /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_missing_range_checks_in_bigmod/circuits/bigint.circom:64:21
   │
64 │     component n2b = Num2Bits(n + 2);
   │                     ^^^^^^^^^^^^^^^ Circomlib template `Num2Bits` instantiated here.
   │
   = Consider using `Num2Bits_strict` if the input size may be >= than the prime size.
   = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#non-strict-binary-conversion.

circomspect: analyzing template 'BigModInv'
warning: Using the signal assignment operator `<--` does not constrain the assigned signal.
    ┌─ /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_missing_range_checks_in_bigmod/circuits/bigint.circom:509:9
    │
509 │         out[i] <-- inv[i];
    │         ^^^^^^^^^^^^^^^^^ The assigned signal `out[i]` is not constrained here.
    │
    = Consider if it is possible to rewrite the statement using `<==` instead.
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#signal-assignment.

warning: Using `Num2Bits` to convert field elements to bits may lead to aliasing issues.
    ┌─ /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_missing_range_checks_in_bigmod/circuits/bigint.circom:513:27
    │
513 │         range_checks[i] = Num2Bits(n);
    │                           ^^^^^^^^^^^ Circomlib template `Num2Bits` instantiated here.
    │
    = Consider using `Num2Bits_strict` if the input size may be >= than the prime size.
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#non-strict-binary-conversion.

warning: The output signal `div` defined by the template `BigMod` is not constrained in `BigModInv`.
    ┌─ /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_missing_range_checks_in_bigmod/circuits/bigint.circom:522:21
    │
522 │     component mod = BigMod(n, k);
    │                     ^^^^^^^^^^^^ The template `BigMod` is instantiated here.
    │
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unused-output-signal.

circomspect: analyzing template 'Split'
warning: Using the signal assignment operator `<--` does not constrain the assigned signal.
    ┌─ /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_missing_range_checks_in_bigmod/circuits/bigint.circom:114:5
    │
114 │     small <-- in % (1 << n);
    │     ^^^^^^^^^^^^^^^^^^^^^^^ The assigned signal `small` is not constrained here.
    ·
118 │     n2b_small.in <== small;
    │     ---------------------- The signal `small` is constrained here.
    ·
122 │     in === small + big * (1 << n);
    │     ------------------------------ The signal `small` is constrained here.
    │
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#signal-assignment.

warning: Using the signal assignment operator `<--` does not constrain the assigned signal.
    ┌─ /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_missing_range_checks_in_bigmod/circuits/bigint.circom:115:5
    │
115 │     big <-- in \ (1 << n);
    │     ^^^^^^^^^^^^^^^^^^^^^ The assigned signal `big` is not constrained here.
    ·
120 │     n2b_big.in <== big;
    │     ------------------ The signal `big` is constrained here.
121 │ 
122 │     in === small + big * (1 << n);
    │     ------------------------------ The signal `big` is constrained here.
    │
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#signal-assignment.

warning: Using `Num2Bits` to convert field elements to bits may lead to aliasing issues.
    ┌─ /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_missing_range_checks_in_bigmod/circuits/bigint.circom:117:27
    │
117 │     component n2b_small = Num2Bits(n);
    │                           ^^^^^^^^^^^ Circomlib template `Num2Bits` instantiated here.
    │
    = Consider using `Num2Bits_strict` if the input size may be >= than the prime size.
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#non-strict-binary-conversion.

warning: Using `Num2Bits` to convert field elements to bits may lead to aliasing issues.
    ┌─ /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_missing_range_checks_in_bigmod/circuits/bigint.circom:119:25
    │
119 │     component n2b_big = Num2Bits(m);
    │                         ^^^^^^^^^^^ Circomlib template `Num2Bits` instantiated here.
    │
    = Consider using `Num2Bits_strict` if the input size may be >= than the prime size.
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#non-strict-binary-conversion.

circomspect: analyzing template 'SplitThree'
warning: Using the signal assignment operator `<--` does not constrain the assigned signal.
    ┌─ /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_missing_range_checks_in_bigmod/circuits/bigint.circom:134:5
    │
134 │     medium <-- (in \ (1 << n)) % (1 << m);
    │     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ The assigned signal `medium` is not constrained here.
    ·
140 │     n2b_medium.in <== medium;
    │     ------------------------ The signal `medium` is constrained here.
    ·
144 │     in === small + medium * (1 << n) + big * (1 << n + m);
    │     ------------------------------------------------------ The signal `medium` is constrained here.
    │
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#signal-assignment.

warning: Using the signal assignment operator `<--` does not constrain the assigned signal.
    ┌─ /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_missing_range_checks_in_bigmod/circuits/bigint.circom:135:5
    │
135 │     big <-- in \ (1 << n + m);
    │     ^^^^^^^^^^^^^^^^^^^^^^^^^ The assigned signal `big` is not constrained here.
    ·
142 │     n2b_big.in <== big;
    │     ------------------ The signal `big` is constrained here.
143 │ 
144 │     in === small + medium * (1 << n) + big * (1 << n + m);
    │     ------------------------------------------------------ The signal `big` is constrained here.
    │
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#signal-assignment.

warning: Using the signal assignment operator `<--` does not constrain the assigned signal.
    ┌─ /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_missing_range_checks_in_bigmod/circuits/bigint.circom:133:5
    │
133 │     small <-- in % (1 << n);
    │     ^^^^^^^^^^^^^^^^^^^^^^^ The assigned signal `small` is not constrained here.
    ·
138 │     n2b_small.in <== small;
    │     ---------------------- The signal `small` is constrained here.
    ·
144 │     in === small + medium * (1 << n) + big * (1 << n + m);
    │     ------------------------------------------------------ The signal `small` is constrained here.
    │
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#signal-assignment.

warning: Using `Num2Bits` to convert field elements to bits may lead to aliasing issues.
    ┌─ /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_missing_range_checks_in_bigmod/circuits/bigint.circom:137:27
    │
137 │     component n2b_small = Num2Bits(n);
    │                           ^^^^^^^^^^^ Circomlib template `Num2Bits` instantiated here.
    │
    = Consider using `Num2Bits_strict` if the input size may be >= than the prime size.
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#non-strict-binary-conversion.

warning: Using `Num2Bits` to convert field elements to bits may lead to aliasing issues.
    ┌─ /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_missing_range_checks_in_bigmod/circuits/bigint.circom:139:28
    │
139 │     component n2b_medium = Num2Bits(m);
    │                            ^^^^^^^^^^^ Circomlib template `Num2Bits` instantiated here.
    │
    = Consider using `Num2Bits_strict` if the input size may be >= than the prime size.
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#non-strict-binary-conversion.

warning: Using `Num2Bits` to convert field elements to bits may lead to aliasing issues.
    ┌─ /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_missing_range_checks_in_bigmod/circuits/bigint.circom:141:25
    │
141 │     component n2b_big = Num2Bits(k);
    │                         ^^^^^^^^^^^ Circomlib template `Num2Bits` instantiated here.
    │
    = Consider using `Num2Bits_strict` if the input size may be >= than the prime size.
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#non-strict-binary-conversion.

circomspect: analyzing template 'BigMultNoCarry'
warning: Using the signal assignment operator `<--` does not constrain the assigned signal.
    ┌─ /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_missing_range_checks_in_bigmod/circuits/bigint.circom:195:9
    │
195 │         out[i] <-- prod_val[i];
    │         ^^^^^^^^^^^^^^^^^^^^^^ The assigned signal `out[i]` is not constrained here.
    │
    = Consider if it is possible to rewrite the statement using `<==` instead.
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#signal-assignment.

warning: The parameter `n` is never read.
    ┌─ /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_missing_range_checks_in_bigmod/circuits/bigint.circom:179:25
    │
179 │ template BigMultNoCarry(n, ma, mb, ka, kb) {
    │                         ^^^^^^^^^^^^^^^^^ The parameter `n` is never used in `BigMultNoCarry`.
    │
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unused-variable-or-parameter.

circomspect: analyzing template 'CheckCarryToZero'
warning: Using the signal assignment operator `<--` is not necessary here.
    ┌─ /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_missing_range_checks_in_bigmod/circuits/bigint.circom:554:13
    │
554 │             carry[i] <-- (in[i]+carry[i-1]) / (1<<n);
    │             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ The expression assigned to `carry[i]` is quadratic.
    │
    = Consider rewriting the statement using the constraint assignment operator `<==`.
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unnecessary-signal-assignment.

warning: Using the signal assignment operator `<--` is not necessary here.
    ┌─ /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_missing_range_checks_in_bigmod/circuits/bigint.circom:550:13
    │
550 │             carry[i] <-- in[i] / (1<<n);
    │             ^^^^^^^^^^^^^^^^^^^^^^^^^^^ The expression assigned to `carry[i]` is quadratic.
    │
    = Consider rewriting the statement using the constraint assignment operator `<==`.
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unnecessary-signal-assignment.

warning: Using `Num2Bits` to convert field elements to bits may lead to aliasing issues.
    ┌─ /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_missing_range_checks_in_bigmod/circuits/bigint.circom:548:31
    │
548 │         carryRangeChecks[i] = Num2Bits(m + EPSILON - n); 
    │                               ^^^^^^^^^^^^^^^^^^^^^^^^^ Circomlib template `Num2Bits` instantiated here.
    │
    = Consider using `Num2Bits_strict` if the input size may be >= than the prime size.
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#non-strict-binary-conversion.

circomspect: analyzing template 'BigMultModP'
warning: The output signal `div` defined by the template `BigMod` is not constrained in `BigMultModP`.
    ┌─ /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_missing_range_checks_in_bigmod/circuits/bigint.circom:488:25
    │
488 │     component big_mod = BigMod(n, k);
    │                         ^^^^^^^^^^^^ The template `BigMod` is instantiated here.
    │
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unused-output-signal.

circomspect: analyzing template 'ModProd'
warning: Using `Num2Bits` to convert field elements to bits may lead to aliasing issues.
   ┌─ /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_missing_range_checks_in_bigmod/circuits/bigint.circom:93:21
   │
93 │     component n2b = Num2Bits(2 * n);
   │                     ^^^^^^^^^^^^^^^ Circomlib template `Num2Bits` instantiated here.
   │
   = Consider using `Num2Bits_strict` if the input size may be >= than the prime size.
   = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#non-strict-binary-conversion.

warning: Using `Bits2Num` to convert arrays to field elements may lead to aliasing issues.
   ┌─ /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_missing_range_checks_in_bigmod/circuits/bigint.circom:96:22
   │
96 │     component b2n1 = Bits2Num(n);
   │                      ^^^^^^^^^^^ Circomlib template `Bits2Num` instantiated here.
   │
   = Consider using `Bits2Num_strict` if the input size may be >= than the prime size.
   = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#non-strict-binary-conversion.

warning: Using `Bits2Num` to convert arrays to field elements may lead to aliasing issues.
   ┌─ /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_missing_range_checks_in_bigmod/circuits/bigint.circom:97:22
   │
97 │     component b2n2 = Bits2Num(n);
   │                      ^^^^^^^^^^^ Circomlib template `Bits2Num` instantiated here.
   │
   = Consider using `Bits2Num_strict` if the input size may be >= than the prime size.
   = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#non-strict-binary-conversion.

circomspect: 46 issues found.
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

## circom/circom-bigint_circomlib/veridise_underconstrained_outputs_in_window4

### Short Description of the Vulnerability

`Window4` template itself is fine, but it uses `MontgomeryDouble` and `MontgomeryAdd`, which have underconstraint bugs. With the same `input.json`, malicious prover can manipulate lambda value in `MontgomeryDouble` to let the circuit produce different outputs, making it nondeterministic.

### Circomspect Output for pederson.circom

```
circomspect: analyzing template 'Window4'
circomspect: analyzing template 'Segment'
circomspect: analyzing template 'Pedersen'
circomspect: No issues found.
```

## circom/circom-bigint_circomlib/veridise_underconstrained_points_in_edwards2Montgomery

### Short Description of the Vulnerability

The circuit does not implement constraint to avoid division by zero. When setting the divisor to 0, `out[1]` is underconstrained and can be set to any value.

### Circomspect Output for montgomery.circom

```
circomspect: analyzing template 'Edwards2Montgomery'
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

## circom/circom-bigint_circomlib/veridise_underconstrained_outputs_in_windowmulfix

### Short Description of the Vulnerability

`WindowMulFix` template itself is fine, but it uses `MontgomeryDouble` and `MontgomeryAdd`, which have underconstraint bugs. With the same `input.json`, malicious prover can manipulate lambda value in `MontgomeryDouble` to let the circuit produce different outputs, making it nondeterministic.

### Circomspect Output for escalarmulfix.circom

```
circomspect: analyzing template 'EscalarMulFix'
circomspect: analyzing template 'SegmentMulFix'
circomspect: analyzing template 'WindowMulFix'
circomspect: No issues found.
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

## circom/maci/hashcloak_data_are_not_fully_verified_during_state_update

### Short Description of the Vulnerability

If the batch is the first batch, `iz.out` will be 0, and `hz` will be 0, so the constraint `hz <== iz.out * currentTallyCommitmentHasher.hash` will always hold true. There is no checks confirming that the current tally is actually the initial tally in such a case.

### Circomspect Output for processMessages.circom

```
circomspect: analyzing template 'ProcessMessagesInputHasher'
circomspect: analyzing template 'ProcessOne'
warning: The variable `MSG_LENGTH` is assigned a value, but this value is never read.
    ┌─ /home/ret2basic/zkbugs/dataset/circom/maci/hashcloak_data_are_not_fully_verified_during_state_update/circuits/lib/processMessages.circom:443:5
    │
443 │     var MSG_LENGTH = 11;
    │     ^^^^^^^^^^^^^^^^^^^ The value assigned to `MSG_LENGTH` here is never read.
    │
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unused-variable-or-parameter.

warning: The signal `currentBallotRoot` is not used by the template.
    ┌─ /home/ret2basic/zkbugs/dataset/circom/maci/hashcloak_data_are_not_fully_verified_during_state_update/circuits/lib/processMessages.circom:461:5
    │
461 │     signal input currentBallotRoot;
    │     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ This signal is unused and could be removed.
    │
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unused-variable-or-parameter.

warning: The signal `currentStateRoot` is not used by the template.
    ┌─ /home/ret2basic/zkbugs/dataset/circom/maci/hashcloak_data_are_not_fully_verified_during_state_update/circuits/lib/processMessages.circom:460:5
    │
460 │     signal input currentStateRoot;
    │     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ This signal is unused and could be removed.
    │
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unused-variable-or-parameter.

warning: The output signal `root` defined by the template `QuinTreeInclusionProof` is not constrained in `ProcessOne`.
    ┌─ /home/ret2basic/zkbugs/dataset/circom/maci/hashcloak_data_are_not_fully_verified_during_state_update/circuits/lib/processMessages.circom:528:30
    │
528 │     component stateLeafQip = QuinTreeInclusionProof(stateTreeDepth);
    │                              ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ The template `QuinTreeInclusionProof` is instantiated here.
    │
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unused-output-signal.

warning: The output signal `root` defined by the template `QuinTreeInclusionProof` is not constrained in `ProcessOne`.
    ┌─ /home/ret2basic/zkbugs/dataset/circom/maci/hashcloak_data_are_not_fully_verified_during_state_update/circuits/lib/processMessages.circom:550:27
    │
550 │     component ballotQip = QuinTreeInclusionProof(stateTreeDepth);
    │                           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ The template `QuinTreeInclusionProof` is instantiated here.
    │
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unused-output-signal.

warning: The output signal `root` defined by the template `QuinTreeInclusionProof` is not constrained in `ProcessOne`.
    ┌─ /home/ret2basic/zkbugs/dataset/circom/maci/hashcloak_data_are_not_fully_verified_during_state_update/circuits/lib/processMessages.circom:588:38
    │
588 │     component currentVoteWeightQip = QuinTreeInclusionProof(voteOptionTreeDepth);
    │                                      ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ The template `QuinTreeInclusionProof` is instantiated here.
    │
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unused-output-signal.

circomspect: analyzing template 'ProcessMessages'
warning: The variable `BALLOT_VO_ROOT_IDX` is assigned a value, but this value is never read.
   ┌─ /home/ret2basic/zkbugs/dataset/circom/maci/hashcloak_data_are_not_fully_verified_during_state_update/circuits/lib/processMessages.circom:41:5
   │
41 │     var BALLOT_VO_ROOT_IDX = 1;
   │     ^^^^^^^^^^^^^^^^^^^^^^^^^^ The value assigned to `BALLOT_VO_ROOT_IDX` here is never read.
   │
   = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unused-variable-or-parameter.

warning: The variable `BALLOT_NONCE_IDX` is assigned a value, but this value is never read.
   ┌─ /home/ret2basic/zkbugs/dataset/circom/maci/hashcloak_data_are_not_fully_verified_during_state_update/circuits/lib/processMessages.circom:40:5
   │
40 │     var BALLOT_NONCE_IDX = 0;
   │     ^^^^^^^^^^^^^^^^^^^^^^^^ The value assigned to `BALLOT_NONCE_IDX` here is never read.
   │
   = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unused-variable-or-parameter.

warning: The variable `STATE_LEAF_TIMESTAMP_IDX` is assigned a value, but this value is never read.
   ┌─ /home/ret2basic/zkbugs/dataset/circom/maci/hashcloak_data_are_not_fully_verified_during_state_update/circuits/lib/processMessages.circom:46:5
   │
46 │     var STATE_LEAF_TIMESTAMP_IDX = 3;
   │     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ The value assigned to `STATE_LEAF_TIMESTAMP_IDX` here is never read.
   │
   = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unused-variable-or-parameter.

warning: The variable `STATE_LEAF_PUB_Y_IDX` is assigned a value, but this value is never read.
   ┌─ /home/ret2basic/zkbugs/dataset/circom/maci/hashcloak_data_are_not_fully_verified_during_state_update/circuits/lib/processMessages.circom:44:5
   │
44 │     var STATE_LEAF_PUB_Y_IDX = 1;
   │     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^ The value assigned to `STATE_LEAF_PUB_Y_IDX` here is never read.
   │
   = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unused-variable-or-parameter.

warning: The variable `STATE_LEAF_PUB_X_IDX` is assigned a value, but this value is never read.
   ┌─ /home/ret2basic/zkbugs/dataset/circom/maci/hashcloak_data_are_not_fully_verified_during_state_update/circuits/lib/processMessages.circom:43:5
   │
43 │     var STATE_LEAF_PUB_X_IDX = 0;
   │     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^ The value assigned to `STATE_LEAF_PUB_X_IDX` here is never read.
   │
   = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unused-variable-or-parameter.

warning: The variable `STATE_LEAF_VOICE_CREDIT_BALANCE_IDX` is assigned a value, but this value is never read.
   ┌─ /home/ret2basic/zkbugs/dataset/circom/maci/hashcloak_data_are_not_fully_verified_during_state_update/circuits/lib/processMessages.circom:45:5
   │
45 │     var STATE_LEAF_VOICE_CREDIT_BALANCE_IDX = 2;
   │     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ The value assigned to `STATE_LEAF_VOICE_CREDIT_BALANCE_IDX` here is never read.
   │
   = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unused-variable-or-parameter.

warning: The signal `out` is not used by the template.
    ┌─ /home/ret2basic/zkbugs/dataset/circom/maci/hashcloak_data_are_not_fully_verified_during_state_update/circuits/lib/processMessages.circom:130:5
    │
130 │     signal output out; // @audit To suppress "snarkJS: Error: Scalar size does not match"
    │     ^^^^^^^^^^^^^^^^^ This signal is unused and could be removed.
    │
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unused-variable-or-parameter.

warning: Inputs to `LessThan` need to be constrained to ensure that they are non-negative
    ┌─ /home/ret2basic/zkbugs/dataset/circom/maci/hashcloak_data_are_not_fully_verified_during_state_update/circuits/lib/processMessages.circom:207:25
    │
207 │         lt[i].in[1] <== batchEndIndex;
    │                         ^^^^^^^^^^^^^ `batchEndIndex` needs to be constrained to ensure that it is <= p/2.
    │
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unconstrained-less-than.

warning: Inputs to `LessThan` need to be constrained to ensure that they are non-negative
    ┌─ /home/ret2basic/zkbugs/dataset/circom/maci/hashcloak_data_are_not_fully_verified_during_state_update/circuits/lib/processMessages.circom:206:25
    │
206 │         lt[i].in[0] <== batchStartIndex + i;
    │                         ^^^^^^^^^^^^^^^^^^^ `(batchStartIndex + i)` needs to be constrained to ensure that it is <= p/2.
    │
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unconstrained-less-than.

warning: The output signal `hash` defined by the template `Hasher3` is not constrained in `ProcessMessages`.
    ┌─ /home/ret2basic/zkbugs/dataset/circom/maci/hashcloak_data_are_not_fully_verified_during_state_update/circuits/lib/processMessages.circom:355:36
    │
355 │     component sbCommitmentHasher = Hasher3();
    │                                    ^^^^^^^^^ The template `Hasher3` is instantiated here.
    │
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unused-output-signal.

circomspect: analyzing template 'ProcessTopup'
warning: The variable `MSG_LENGTH` is assigned a value, but this value is never read.
    ┌─ /home/ret2basic/zkbugs/dataset/circom/maci/hashcloak_data_are_not_fully_verified_during_state_update/circuits/lib/processMessages.circom:366:5
    │
366 │     var MSG_LENGTH = 11;
    │     ^^^^^^^^^^^^^^^^^^^ The value assigned to `MSG_LENGTH` here is never read.
    │
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unused-variable-or-parameter.

warning: The output signal `out` defined by the template `LessEqThan` is not constrained in `ProcessTopup`.
    ┌─ /home/ret2basic/zkbugs/dataset/circom/maci/hashcloak_data_are_not_fully_verified_during_state_update/circuits/lib/processMessages.circom:408:36
    │
408 │     component validCreditBalance = LessEqThan(252);
    │                                    ^^^^^^^^^^^^^^^ The template `LessEqThan` is instantiated here.
    │
    = For more details, see https://github.com/trailofbits/circomspect/blob/main/doc/analysis_passes.md#unused-output-signal.

circomspect: 18 issues found.
```


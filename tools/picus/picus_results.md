# Picus Analysis Results

## circom/circomlib_mimc/kobi_gurkan_mimc_hash_assigned_but_not_constrained

```
working directory: /var/tmp/picus17288207751728820775156
Cannot determine whether the circuit is properly constrained

```

## circom/reclaimprotocol_circom_chacha/zksecurity_unsound_left_rotation

```
working directory: /var/tmp/picus17288207811728820781884
The circuit is underconstrained
Counterexample:
  inputs:
    main.in: 0
  first possible outputs:
    main.out: 0
  second possible outputs:
    main.out: 1
  first internal variables:
    main.part1: 0
    main.part2: 0
  second internal variables:
    main.part1: 3406955086604249147507984143852424082257047603521737805943454231131528309745
    main.part2: 18481287785235026074738421601404851006291316796894296537754749955444280185873

```

## circom/spartan_ecdsa/yacademy_input_signal_s_is_not_constrained_in_eff_ecdsa_circom

```
Error: Picus execution timed out after 100 seconds for /home/ret2basic/zkbugs/dataset/circom/spartan_ecdsa/yacademy_input_signal_s_is_not_constrained_in_eff_ecdsa_circom
```

## circom/spartan_ecdsa/yacademy_under_constrained_circuits_compromising_the_soundness_of_the_system

```
Error: Picus execution timed out after 100 seconds for /home/ret2basic/zkbugs/dataset/circom/spartan_ecdsa/yacademy_under_constrained_circuits_compromising_the_soundness_of_the_system
```

## circom/darkforest_circuits/daira_hopwood_darkforest_v0_3_missing_bit_length_check

```
working directory: /var/tmp/picus17288209841728820984590
Cannot determine whether the circuit is properly constrained

```

## circom/semaphore-protocol_semaphore/veridise_no_zero_value_validation

```
working directory: /var/tmp/picus17288209911728820991231
The circuit is properly constrained

```

## circom/succinctlabs_telepathy-circuits/veridise_arrayxor_is_under_constrained

```
working directory: /var/tmp/picus17288209931728820993849
The circuit is underconstrained
Counterexample:
  inputs:
    main.a[0]: 0
    main.a[1]: 0
    main.a[2]: 0
    main.a[3]: 0
    main.b[0]: 0
    main.b[1]: 0
    main.b[2]: 0
    main.b[3]: 0
  first possible outputs:
    main.out[0]: 0
    main.out[1]: 0
    main.out[2]: 0
    main.out[3]: 0
  second possible outputs:
    main.out[0]: 1
    main.out[1]: 0
    main.out[2]: 0
    main.out[3]: 0
  first internal variables:
    no first internal variables
  second internal variables:
    no second internal variables

```

## circom/succinctlabs_telepathy-circuits/trailofbits_prover_can_lock_user_funds_by_including_ill-formed_bigints_in_public_key_commitment

```
working directory: /var/tmp/picus17288209951728820995625
The circuit is properly constrained

```

## circom/succinctlabs_telepathy-circuits/veridise_template_CoreVerifyPubkeyG1_does_not_perform_input_validation_simplified

```
Error: Picus execution timed out after 100 seconds for /home/ret2basic/zkbugs/dataset/circom/succinctlabs_telepathy-circuits/veridise_template_CoreVerifyPubkeyG1_does_not_perform_input_validation_simplified
```

## circom/succinctlabs_telepathy-circuits/veridise_zero_padding_for_sha256_in_ExpandMessageXMD_is_vulnerable_to_an_overflow

```
Error: Picus execution timed out after 100 seconds for /home/ret2basic/zkbugs/dataset/circom/succinctlabs_telepathy-circuits/veridise_zero_padding_for_sha256_in_ExpandMessageXMD_is_vulnerable_to_an_overflow
```

## circom/succinctlabs_telepathy-circuits/veridise_sync_committee_can_be_rotated_successfully_with_random_public_keys

```
Error: Picus execution timed out after 100 seconds for /home/ret2basic/zkbugs/dataset/circom/succinctlabs_telepathy-circuits/veridise_sync_committee_can_be_rotated_successfully_with_random_public_keys
```

## circom/succinctlabs_telepathy-circuits/trailofbits_prover_can_lock_user_funds_by_supplying_non-reduced_Y_values_to_G1BigIntToSignFlag

```
Error: Picus execution timed out after 100 seconds for /home/ret2basic/zkbugs/dataset/circom/succinctlabs_telepathy-circuits/trailofbits_prover_can_lock_user_funds_by_supplying_non-reduced_Y_values_to_G1BigIntToSignFlag
```

## circom/succinctlabs_telepathy-circuits/trailofbits_incorrect_handling_of_point_doubling_can_allow_signature_forgery

```
Error: Picus execution timed out after 100 seconds for /home/ret2basic/zkbugs/dataset/circom/succinctlabs_telepathy-circuits/trailofbits_incorrect_handling_of_point_doubling_can_allow_signature_forgery
```

## circom/uniRep_protocol/veridise_missing_range_checks_on_comparison_circuits

```
working directory: /var/tmp/picus17288215001728821500770
The circuit is properly constrained

```

## circom/uniRep_protocol/veridise_underconstrained_circuit_allows_invalid_comparison

```
Error: Picus execution timed out after 100 seconds for /home/ret2basic/zkbugs/dataset/circom/uniRep_protocol/veridise_underconstrained_circuit_allows_invalid_comparison
```

## circom/zkopru/leastauthority_previously_correct_ownership_proof_disabled_via_code_changes

```
Error: Picus execution timed out after 100 seconds for /home/ret2basic/zkbugs/dataset/circom/zkopru/leastauthority_previously_correct_ownership_proof_disabled_via_code_changes
```

## circom/circom-bigint_circomlib/veridise_underconstrained_outputs_in_bitElementMulAny

```
working directory: /var/tmp/picus17288217031728821703418
Cannot determine whether the circuit is properly constrained

```

## circom/circom-bigint_circomlib/veridise_underconstrained_points_in_montgomeryAdd

```
working directory: /var/tmp/picus17288217851728821785168
The circuit is underconstrained
Counterexample:
  inputs:
    main.in1[0]: 0
    main.in1[1]: 0
    main.in2[0]: 0
    main.in2[1]: 0
  first possible outputs:
    main.out[0]: 21888242871839275222246405745257275088548364400416034343698204186575808326919
    main.out[1]: 0
  second possible outputs:
    main.out[0]: 21888242871839275222246405745257275088548364400416034343698204186575808326920
    main.out[1]: 168697
  first internal variables:
    main.lamda: 0
  second internal variables:
    main.lamda: 1

```

## circom/circom-bigint_circomlib/veridise_missing_range_checks_in_bigmod

```
Error: Picus execution timed out after 100 seconds for /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_missing_range_checks_in_bigmod
```

## circom/circom-bigint_circomlib/veridise_decoder_accepting_bogus_output_signal

```
working directory: /var/tmp/picus17288218871728821887430
The circuit is underconstrained
Counterexample:
  inputs:
    main.inp: 0
  first possible outputs:
    main.out[0]: 1
    main.out[1]: 0
    main.out[2]: 0
    main.out[3]: 0
    main.success: 1
  second possible outputs:
    main.out[0]: 0
    main.out[1]: 0
    main.out[2]: 0
    main.out[3]: 0
    main.success: 0
  first internal variables:
    no first internal variables
  second internal variables:
    no second internal variables

```

## circom/circom-bigint_circomlib/veridise_underconstrained_outputs_in_window4

```
Error: Picus execution timed out after 100 seconds for /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_underconstrained_outputs_in_window4
```

## circom/circom-bigint_circomlib/veridise_underconstrained_points_in_edwards2Montgomery

```
working directory: /var/tmp/picus17288219891728821989481
The circuit is underconstrained
Counterexample:
  inputs:
    main.in[0]: 0
    main.in[1]: 21888242871839275222246405745257275088548364400416034343698204186575808495616
  first possible outputs:
    main.out[0]: 0
    main.out[1]: 0
  second possible outputs:
    main.out[0]: 0
    main.out[1]: 1
  first internal variables:
    no first internal variables
  second internal variables:
    no second internal variables

```

## circom/circom-bigint_circomlib/veridise_underconstrained_points_in_montgomeryDouble

```
working directory: /var/tmp/picus17288219911728821991074
The circuit is underconstrained
Counterexample:
  inputs:
    main.in[0]: 19227208690775748531865437331126676461733156385287048589618245965417551240156
    main.in[1]: 0
  first possible outputs:
    main.out[0]: 5322068362127053380761936828261197253630416030257971508159916442316514342224
    main.out[1]: 0
  second possible outputs:
    main.out[0]: 0
    main.out[1]: 11395287471962378606215025428882238971762841540906324053591198862844560648166
  first internal variables:
    main.lamda: 0
    main.x1_2: 18039640916646237372880335511686420348069741665070947478680356439334569097561
  second internal variables:
    main.lamda: 1919201053887612038854394017032965582736186453021883147377541836331787784350
    main.x1_2: 18039640916646237372880335511686420348069741665070947478680356439334569097561

```

## circom/circom-bigint_circomlib/veridise_underconstrained_outputs_in_windowmulfix

```
Error: Picus execution timed out after 100 seconds for /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_underconstrained_outputs_in_windowmulfix
```

## circom/circom-bigint_circomlib/veridise_underconstrained_points_in_montgomery2Edwards

```
working directory: /var/tmp/picus17288220931728822093169
The circuit is underconstrained
Counterexample:
  inputs:
    main.in[0]: 0
    main.in[1]: 0
  first possible outputs:
    main.out[0]: 0
    main.out[1]: 21888242871839275222246405745257275088548364400416034343698204186575808495616
  second possible outputs:
    main.out[0]: 1
    main.out[1]: 21888242871839275222246405745257275088548364400416034343698204186575808495616
  first internal variables:
    no first internal variables
  second internal variables:
    no second internal variables

```

## circom/maci/hashcloak_data_are_not_fully_verified_during_state_update

```
Error: Picus execution timed out after 100 seconds for /home/ret2basic/zkbugs/dataset/circom/maci/hashcloak_data_are_not_fully_verified_during_state_update
```


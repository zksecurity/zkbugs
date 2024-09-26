# Picus Analysis Results

## /home/ret2basic/zkbugs/dataset/circom/circomlib_mimc/kobi_gurkan_mimc_hash_assigned_but_not_constrained

```
working directory: /var/tmp/picus17273603271727360327904
Cannot determine whether the circuit is properly constrained

```

## /home/ret2basic/zkbugs/dataset/circom/reclaimprotocol_circom_chacha/zksecurity_unsound_left_rotation

```
working directory: /var/tmp/picus17273603351727360335763
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

## /home/ret2basic/zkbugs/dataset/circom/spartan_ecdsa/yacademy_input_signal_s_is_not_constrained_in_eff_ecdsa_circom

```
Error: Picus execution timed out after 10 seconds for /home/ret2basic/zkbugs/dataset/circom/spartan_ecdsa/yacademy_input_signal_s_is_not_constrained_in_eff_ecdsa_circom
```

## /home/ret2basic/zkbugs/dataset/circom/darkforest_circuits/daira_hopwood_darkforest_v0_3_missing_bit_length_check

```
working directory: /var/tmp/picus17273603481727360348520
Cannot determine whether the circuit is properly constrained

```

## /home/ret2basic/zkbugs/dataset/circom/uniRep_protocol/veridise_missing_range_checks_on_comparison_circuits

```
working directory: /var/tmp/picus17273603561727360356211
The circuit is properly constrained

```

## /home/ret2basic/zkbugs/dataset/circom/uniRep_protocol/veridise_underconstrained_circuit_allows_invalid_comparison

```
Error: Picus execution timed out after 10 seconds for /home/ret2basic/zkbugs/dataset/circom/uniRep_protocol/veridise_underconstrained_circuit_allows_invalid_comparison
```

## /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_underconstrained_outputs_in_bitElementMulAny

```
Error: Picus execution timed out after 10 seconds for /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_underconstrained_outputs_in_bitElementMulAny
```

## /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_underconstrained_points_in_montgomeryAdd

```
working directory: /var/tmp/picus17273603791727360379528
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

## /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_decoder_accepting_bogus_output_signal

```
working directory: /var/tmp/picus17273603821727360382472
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

## /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_underconstrained_points_in_edwards2Montgomery

```
working directory: /var/tmp/picus17273603851727360385363
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

## /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_underconstrained_points_in_montgomeryDouble

```
working directory: /var/tmp/picus17273603881727360388377
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

## /home/ret2basic/zkbugs/dataset/circom/circom-bigint_circomlib/veridise_underconstrained_points_in_montgomery2Edwards

```
working directory: /var/tmp/picus17273603921727360392150
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


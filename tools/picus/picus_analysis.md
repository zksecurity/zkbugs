# Picus Analysis Report

## Intro to Picus

Picus is detection tool for finding underconstrained bug. Picus is build on top of [this paper](https://dl.acm.org/doi/abs/10.1145/3591282). The tool mentioned in the paper is called QED2 and Picus is an implementation of it.

In simple words, Picus tries to prove the uniqueness of witness given a set of inputs. If the same set of inputs results in multiple possible witness, it means some constraints are missing, which is underconstrained bug. For a concrete example, you can see [this audit report](https://veridise.com/wp-content/uploads/2023/02/VAR-circom-bigint.pdf).

## Results Summary

Total circuits analyzed: 12
- Correctly identified as underconstrained: 6
- Incorrectly reported as properly constrained: 1
- Unable to determine (timeout or inconclusive): 5

Success rate: 50% (6 out of 12)

## Detailed Analysis

### Correctly Identified Bugs

Picus successfully identified the following circuits as underconstrained and provided counterexamples:

1. dataset/circom/reclaimprotocol_circom_chacha/zksecurity_unsound_left_rotation
2. dataset/circom/circom-bigint_circomlib/veridise_underconstrained_points_in_montgomeryAdd
3. dataset/circom/circom-bigint_circomlib/veridise_decoder_accepting_bogus_output_signal
4. dataset/circom/circom-bigint_circomlib/veridise_underconstrained_points_in_edwards2Montgomery
5. dataset/circom/circom-bigint_circomlib/veridise_underconstrained_points_in_montgomeryDouble
6. dataset/circom/circom-bigint_circomlib/veridise_underconstrained_points_in_montgomery2Edwards

These results demonstrate Picus's ability to detect certain types of bugs, particularly those related to underconstrained points in various mathematical operations and decoders.

### Incorrectly Reported as Properly Constrained

Picus incorrectly reported one circuit as properly constrained:

1. dataset/circom/uniRep_protocol/veridise_missing_range_checks_on_comparison_circuits

This is expected since Picus only checks for underconstrained bugs, not missing range check bugs.

### Unable to Determine

Picus was unable to provide a definitive result for the following circuits:

1. dataset/circom/circomlib_mimc/kobi_gurkan_mimc_hash_assigned_but_not_constrained (inconclusive)
2. dataset/circom/spartan_ecdsa/yacademy_input_signal_s_is_not_constrained_in_eff_ecdsa_circom (timeout)
3. dataset/circom/darkforest_circuits/daira_hopwood_darkforest_v0_3_missing_bit_length_check (inconclusive)
4. dataset/circom/uniRep_protocol/veridise_underconstrained_circuit_allows_invalid_comparison (timeout)
5. dataset/circom/circom-bigint_circomlib/veridise_underconstrained_outputs_in_bitElementMulAny (timeout)

The high number of timeouts and inconclusive results (41.7% of the dataset) suggests that Picus may struggle with more complex circuits or certain types of bugs.

// unit_is_complete_underconstrained.rs
//
// Standalone unit tests for the underconstrained is_complete flag vulnerability
// in SP1's recursive verifier (GHSA-c873-wfhp-wx5m Bug 2).
//
// **Bug Summary:**
// In the vulnerable version (commit 4681d4f), the first recursion layers
// (core.rs and wrap.rs) set the `is_complete` flag in public values but
// do NOT call `assert_complete()` to constrain it. This allows a malicious
// prover to set `is_complete = 1` even when the execution is incomplete
// (e.g., next_pc != 0), bypassing soundness checks.
//
// **Fix (commit 4fe8144):**
// Added `assert_complete(builder, recursion_public_values, is_complete);`
// calls in both core.rs and wrap.rs before committing public values.
//
// **Oracle Design:**
// These tests use a differential oracle that checks whether contradictory
// public values are detected:
// - is_complete = 1 but next_pc != 0  (should be rejected)
// - is_complete = 1 but start_shard != 1  (should be rejected)
// - is_complete = 1 but cumulative_sum != 0  (should be rejected)
//
// **Usage:**
// rustc --test unit_is_complete_underconstrained.rs -o test_runner
// ./test_runner

use std::collections::HashMap;

// ============================================================================
// Mock Structures (simplified versions of SP1 types)
// ============================================================================

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct Felt {
    value: u32,
}

impl Felt {
    fn new(value: u32) -> Self {
        Self { value }
    }

    fn zero() -> Self {
        Self { value: 0 }
    }

    fn one() -> Self {
        Self { value: 1 }
    }

    fn is_zero(&self) -> bool {
        self.value == 0
    }

    fn is_one(&self) -> bool {
        self.value == 1
    }

    // Multiply two felts (wrapping arithmetic for simplicity)
    fn mul(&self, other: &Felt) -> Felt {
        Felt::new(self.value.wrapping_mul(other.value))
    }

    fn sub(&self, other: &Felt) -> Felt {
        Felt::new(self.value.wrapping_sub(other.value))
    }
}

const DIGEST_SIZE: usize = 8;

#[derive(Debug, Clone)]
struct RecursionPublicValues {
    committed_value_digest: [Felt; DIGEST_SIZE],
    deferred_proofs_digest: [Felt; DIGEST_SIZE],
    start_pc: Felt,
    next_pc: Felt,
    start_shard: Felt,
    next_shard: Felt,
    start_execution_shard: Felt,
    next_execution_shard: Felt,
    cumulative_sum: [Felt; DIGEST_SIZE],
    start_reconstruct_deferred_digest: [Felt; DIGEST_SIZE],
    end_reconstruct_deferred_digest: [Felt; DIGEST_SIZE],
    leaf_challenger: [Felt; 8],
    end_reconstruct_challenger: [Felt; 8],
    contains_execution_shard: Felt,
    is_complete: Felt,
    exit_code: Felt,
    vk_root: [Felt; DIGEST_SIZE],
}

impl RecursionPublicValues {
    fn new() -> Self {
        Self {
            committed_value_digest: [Felt::zero(); DIGEST_SIZE],
            deferred_proofs_digest: [Felt::zero(); DIGEST_SIZE],
            start_pc: Felt::zero(),
            next_pc: Felt::zero(),
            start_shard: Felt::one(),
            next_shard: Felt::new(2),
            start_execution_shard: Felt::one(),
            next_execution_shard: Felt::new(2),
            cumulative_sum: [Felt::zero(); DIGEST_SIZE],
            start_reconstruct_deferred_digest: [Felt::zero(); DIGEST_SIZE],
            end_reconstruct_deferred_digest: [Felt::zero(); DIGEST_SIZE],
            leaf_challenger: [Felt::zero(); 8],
            end_reconstruct_challenger: [Felt::zero(); 8],
            contains_execution_shard: Felt::one(),
            is_complete: Felt::zero(),
            exit_code: Felt::zero(),
            vk_root: [Felt::zero(); DIGEST_SIZE],
        }
    }
}

// ============================================================================
// Constraint Checker (Oracle)
// ============================================================================

#[derive(Debug)]
enum ConstraintViolation {
    IsCompleteNotBoolean,
    NextPcNotZero { next_pc: u32 },
    StartShardNotOne { start_shard: u32 },
    NextShardIsOne,
    ContainsExecutionShardNotOne { value: u32 },
    StartExecutionShardNotOne { value: u32 },
    ChallengerMismatch,
    StartReconstructDigestNotZero,
    EndReconstructDigestMismatch,
    CumulativeSumNotZero { index: usize, value: u32 },
}

/// Mimics the constraints enforced by `assert_complete` in complete.rs
fn assert_complete_constraints(pv: &RecursionPublicValues) -> Result<(), Vec<ConstraintViolation>> {
    let mut violations = Vec::new();

    // Only check constraints if is_complete = 1
    if !pv.is_complete.is_one() {
        return Ok(());
    }

    // 1. Boolean check: is_complete * (is_complete - 1) == 0
    let boolean_check = pv.is_complete.mul(&pv.is_complete.sub(&Felt::one()));
    if !boolean_check.is_zero() {
        violations.push(ConstraintViolation::IsCompleteNotBoolean);
    }

    // 2. PC check: is_complete * next_pc == 0
    let pc_check = pv.is_complete.mul(&pv.next_pc);
    if !pc_check.is_zero() {
        violations.push(ConstraintViolation::NextPcNotZero {
            next_pc: pv.next_pc.value,
        });
    }

    // 3. Start shard: is_complete * (start_shard - 1) == 0
    let start_shard_check = pv.is_complete.mul(&pv.start_shard.sub(&Felt::one()));
    if !start_shard_check.is_zero() {
        violations.push(ConstraintViolation::StartShardNotOne {
            start_shard: pv.start_shard.value,
        });
    }

    // 4. Next shard != 1: is_complete * next_shard != 1
    let next_shard_check = pv.is_complete.mul(&pv.next_shard);
    if next_shard_check.is_one() {
        violations.push(ConstraintViolation::NextShardIsOne);
    }

    // 5. Contains execution shard: is_complete * (contains_execution_shard - 1) == 0
    let contains_exec_check = pv
        .is_complete
        .mul(&pv.contains_execution_shard.sub(&Felt::one()));
    if !contains_exec_check.is_zero() {
        violations.push(ConstraintViolation::ContainsExecutionShardNotOne {
            value: pv.contains_execution_shard.value,
        });
    }

    // 6. Start execution shard: is_complete * (start_execution_shard - 1) == 0
    let start_exec_check = pv
        .is_complete
        .mul(&pv.start_execution_shard.sub(&Felt::one()));
    if !start_exec_check.is_zero() {
        violations.push(ConstraintViolation::StartExecutionShardNotOne {
            value: pv.start_execution_shard.value,
        });
    }

    // 7. Challenger equality: end_reconstruct_challenger == leaf_challenger
    for (end, leaf) in pv
        .end_reconstruct_challenger
        .iter()
        .zip(pv.leaf_challenger.iter())
    {
        let check = pv.is_complete.mul(&end.sub(leaf));
        if !check.is_zero() {
            violations.push(ConstraintViolation::ChallengerMismatch);
            break;
        }
    }

    // 8. Start reconstruct digest should be zero
    for word in &pv.start_reconstruct_deferred_digest {
        let check = pv.is_complete.mul(word);
        if !check.is_zero() {
            violations.push(ConstraintViolation::StartReconstructDigestNotZero);
            break;
        }
    }

    // 9. End reconstruct digest == deferred proofs digest
    for (end, deferred) in pv
        .end_reconstruct_deferred_digest
        .iter()
        .zip(pv.deferred_proofs_digest.iter())
    {
        let check = pv.is_complete.mul(&end.sub(deferred));
        if !check.is_zero() {
            violations.push(ConstraintViolation::EndReconstructDigestMismatch);
            break;
        }
    }

    // 10. Cumulative sum should be zero
    for (i, word) in pv.cumulative_sum.iter().enumerate() {
        let check = pv.is_complete.mul(word);
        if !check.is_zero() {
            violations.push(ConstraintViolation::CumulativeSumNotZero {
                index: i,
                value: word.value,
            });
        }
    }

    if violations.is_empty() {
        Ok(())
    } else {
        Err(violations)
    }
}

// ============================================================================
// Vulnerable vs Fixed Behavior Simulation
// ============================================================================

/// Simulates the VULNERABLE core.rs behavior:
/// - Sets is_complete in public values
/// - Does NOT call assert_complete()
/// - Commits public values without constraint checking
fn vulnerable_core_verify(pv: &RecursionPublicValues) -> bool {
    // In vulnerable version: just commit, no constraint checking!
    // This would accept ANY is_complete value, even with contradictory fields
    true // Always accepts
}

/// Simulates the FIXED core.rs behavior:
/// - Sets is_complete in public values
/// - DOES call assert_complete()
/// - Only commits if constraints are satisfied
fn fixed_core_verify(pv: &RecursionPublicValues) -> bool {
    // In fixed version: check constraints first
    assert_complete_constraints(pv).is_ok()
}

/// Simulates the VULNERABLE wrap.rs behavior:
/// - Ignores is_complete entirely (uses `..` pattern)
/// - Does NOT call assert_complete()
fn vulnerable_wrap_verify(_pv: &RecursionPublicValues) -> bool {
    // In vulnerable version: ignores is_complete, no checking
    true // Always accepts
}

/// Simulates the FIXED wrap.rs behavior:
/// - Extracts is_complete from input
/// - Calls assert_complete()
/// - Asserts is_complete == 1
fn fixed_wrap_verify(pv: &RecursionPublicValues) -> bool {
    // In fixed version: must check constraints AND is_complete must be 1
    assert_complete_constraints(pv).is_ok() && pv.is_complete.is_one()
}

// ============================================================================
// Test Cases
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_valid_complete_proof() {
        // This represents a truly complete proof
        let mut pv = RecursionPublicValues::new();
        pv.is_complete = Felt::one();
        pv.next_pc = Felt::zero(); // Execution completed
        pv.start_shard = Felt::one();
        pv.next_shard = Felt::new(2); // At least one shard
        pv.contains_execution_shard = Felt::one();
        pv.start_execution_shard = Felt::one();
        pv.cumulative_sum = [Felt::zero(); DIGEST_SIZE];
        pv.end_reconstruct_challenger = pv.leaf_challenger; // Matching
        pv.start_reconstruct_deferred_digest = [Felt::zero(); DIGEST_SIZE];
        pv.end_reconstruct_deferred_digest = pv.deferred_proofs_digest; // Matching

        // Both vulnerable and fixed versions should accept valid proofs
        assert!(vulnerable_core_verify(&pv), "Vulnerable should accept valid proof");
        assert!(fixed_core_verify(&pv), "Fixed should accept valid proof");
        assert!(vulnerable_wrap_verify(&pv), "Vulnerable wrap should accept valid proof");
        assert!(fixed_wrap_verify(&pv), "Fixed wrap should accept valid proof");
    }

    #[test]
    fn test_incomplete_proof_with_is_complete_true() {
        // **THE BUG:** is_complete = 1 but next_pc != 0 (execution not done)
        let mut pv = RecursionPublicValues::new();
        pv.is_complete = Felt::one(); // Claims complete
        pv.next_pc = Felt::new(100); // BUT execution not finished!
        pv.start_shard = Felt::one();
        pv.next_shard = Felt::new(2);
        pv.contains_execution_shard = Felt::one();
        pv.start_execution_shard = Felt::one();

        // Vulnerable version: ACCEPTS (no constraint checking)
        assert!(
            vulnerable_core_verify(&pv),
            "VULNERABILITY: Vulnerable version accepts is_complete=1 with next_pc!=0"
        );
        assert!(
            vulnerable_wrap_verify(&pv),
            "VULNERABILITY: Vulnerable wrap accepts inconsistent state"
        );

        // Fixed version: REJECTS (constraint checking catches the contradiction)
        assert!(
            !fixed_core_verify(&pv),
            "Fixed version should REJECT is_complete=1 with next_pc!=0"
        );
        assert!(
            !fixed_wrap_verify(&pv),
            "Fixed wrap should REJECT inconsistent state"
        );

        // Verify the constraint violation is detected
        let result = assert_complete_constraints(&pv);
        assert!(result.is_err(), "Constraints should be violated");
        let violations = result.unwrap_err();
        assert!(
            violations.iter().any(|v| matches!(v, ConstraintViolation::NextPcNotZero { .. })),
            "Should detect next_pc violation"
        );
    }

    #[test]
    fn test_is_complete_true_but_wrong_start_shard() {
        let mut pv = RecursionPublicValues::new();
        pv.is_complete = Felt::one();
        pv.start_shard = Felt::new(5); // Should be 1!
        pv.next_pc = Felt::zero();
        pv.next_shard = Felt::new(6);
        pv.contains_execution_shard = Felt::one();
        pv.start_execution_shard = Felt::one();

        // Vulnerable: accepts
        assert!(vulnerable_core_verify(&pv));

        // Fixed: rejects
        assert!(!fixed_core_verify(&pv));

        let result = assert_complete_constraints(&pv);
        assert!(result.is_err());
        let violations = result.unwrap_err();
        assert!(violations
            .iter()
            .any(|v| matches!(v, ConstraintViolation::StartShardNotOne { .. })));
    }

    #[test]
    fn test_is_complete_true_but_nonzero_cumulative_sum() {
        let mut pv = RecursionPublicValues::new();
        pv.is_complete = Felt::one();
        pv.next_pc = Felt::zero();
        pv.start_shard = Felt::one();
        pv.next_shard = Felt::new(2);
        pv.contains_execution_shard = Felt::one();
        pv.start_execution_shard = Felt::one();
        pv.cumulative_sum[0] = Felt::new(42); // Should be zero!

        // Vulnerable: accepts
        assert!(vulnerable_core_verify(&pv));

        // Fixed: rejects
        assert!(!fixed_core_verify(&pv));

        let result = assert_complete_constraints(&pv);
        assert!(result.is_err());
        let violations = result.unwrap_err();
        assert!(violations
            .iter()
            .any(|v| matches!(v, ConstraintViolation::CumulativeSumNotZero { .. })));
    }

    #[test]
    fn test_is_complete_true_but_challenger_mismatch() {
        let mut pv = RecursionPublicValues::new();
        pv.is_complete = Felt::one();
        pv.next_pc = Felt::zero();
        pv.start_shard = Felt::one();
        pv.next_shard = Felt::new(2);
        pv.contains_execution_shard = Felt::one();
        pv.start_execution_shard = Felt::one();
        pv.cumulative_sum = [Felt::zero(); DIGEST_SIZE];
        pv.leaf_challenger = [Felt::new(1); 8];
        pv.end_reconstruct_challenger = [Felt::new(2); 8]; // Mismatch!

        // Vulnerable: accepts
        assert!(vulnerable_core_verify(&pv));

        // Fixed: rejects
        assert!(!fixed_core_verify(&pv));

        let result = assert_complete_constraints(&pv);
        assert!(result.is_err());
        let violations = result.unwrap_err();
        assert!(violations
            .iter()
            .any(|v| matches!(v, ConstraintViolation::ChallengerMismatch)));
    }

    #[test]
    fn test_is_complete_false_allows_inconsistent_state() {
        // When is_complete = 0, constraints should NOT be enforced
        let mut pv = RecursionPublicValues::new();
        pv.is_complete = Felt::zero(); // Incomplete
        pv.next_pc = Felt::new(100); // This is OK for incomplete proofs
        pv.start_shard = Felt::new(5); // This is also OK

        // Both versions should accept incomplete proofs with "wrong" values
        // because the constraints are only enforced when is_complete = 1
        let result = assert_complete_constraints(&pv);
        assert!(
            result.is_ok(),
            "Constraints should not be enforced when is_complete = 0"
        );

        assert!(vulnerable_core_verify(&pv));
        assert!(fixed_core_verify(&pv));
    }

    #[test]
    fn test_wrap_verifier_requires_is_complete_one() {
        // Wrap verifier should ADDITIONALLY check that is_complete = 1
        let mut pv = RecursionPublicValues::new();
        pv.is_complete = Felt::zero(); // Not complete
        pv.next_pc = Felt::zero();
        pv.start_shard = Felt::one();
        pv.next_shard = Felt::new(2);
        pv.contains_execution_shard = Felt::one();
        pv.start_execution_shard = Felt::one();

        // Core verifier (fixed) would accept this (constraints OK, is_complete can be 0)
        assert!(fixed_core_verify(&pv));

        // But wrap verifier (fixed) requires is_complete = 1
        assert!(
            !fixed_wrap_verify(&pv),
            "Wrap verifier should require is_complete = 1"
        );
    }

    #[test]
    fn test_constraint_violation_reporting() {
        // Test that all constraint violations are properly detected
        let mut pv = RecursionPublicValues::new();
        pv.is_complete = Felt::one();
        pv.next_pc = Felt::new(42);
        pv.start_shard = Felt::new(3);
        pv.cumulative_sum[2] = Felt::new(99);

        let result = assert_complete_constraints(&pv);
        assert!(result.is_err());
        let violations = result.unwrap_err();

        // Should have multiple violations
        assert!(violations.len() >= 2, "Should detect multiple violations");

        // Verify specific violations are present
        assert!(violations
            .iter()
            .any(|v| matches!(v, ConstraintViolation::NextPcNotZero { .. })));
        assert!(violations
            .iter()
            .any(|v| matches!(v, ConstraintViolation::StartShardNotOne { .. })));
        assert!(violations
            .iter()
            .any(|v| matches!(v, ConstraintViolation::CumulativeSumNotZero { .. })));
    }
}

// ============================================================================
// Fuzzing Oracle Interface
// ============================================================================

#[cfg(test)]
mod fuzzing_oracle {
    use super::*;

    /// Differential oracle for fuzzing: compare vulnerable vs fixed behavior
    pub fn oracle_detects_inconsistency(
        is_complete: u32,
        next_pc: u32,
        start_shard: u32,
        cumulative_sum_word: u32,
    ) -> bool {
        let mut pv = RecursionPublicValues::new();
        pv.is_complete = Felt::new(is_complete);
        pv.next_pc = Felt::new(next_pc);
        pv.start_shard = Felt::new(start_shard);
        pv.cumulative_sum[0] = Felt::new(cumulative_sum_word);
        pv.next_shard = Felt::new(2);
        pv.contains_execution_shard = Felt::one();
        pv.start_execution_shard = Felt::one();

        let vulnerable_accepts = vulnerable_core_verify(&pv);
        let fixed_accepts = fixed_core_verify(&pv);

        // Oracle detects inconsistency when behaviors differ
        vulnerable_accepts != fixed_accepts
    }

    #[test]
    fn test_differential_oracle() {
        // Case 1: Valid complete proof - both accept
        assert!(
            !oracle_detects_inconsistency(1, 0, 1, 0),
            "No inconsistency for valid proof"
        );

        // Case 2: is_complete=1 but next_pc!=0 - vulnerable accepts, fixed rejects
        assert!(
            oracle_detects_inconsistency(1, 100, 1, 0),
            "Should detect inconsistency: is_complete=1, next_pc!=0"
        );

        // Case 3: is_complete=1 but start_shard!=1 - vulnerable accepts, fixed rejects
        assert!(
            oracle_detects_inconsistency(1, 0, 5, 0),
            "Should detect inconsistency: is_complete=1, start_shard!=1"
        );

        // Case 4: is_complete=1 but cumulative_sum!=0 - vulnerable accepts, fixed rejects
        assert!(
            oracle_detects_inconsistency(1, 0, 1, 42),
            "Should detect inconsistency: is_complete=1, cumulative_sum!=0"
        );

        // Case 5: is_complete=0 - both accept (constraints not enforced)
        assert!(
            !oracle_detects_inconsistency(0, 100, 5, 42),
            "No inconsistency when is_complete=0"
        );
    }
}

fn main() {
    println!("Run with: cargo test or rustc --test");
}


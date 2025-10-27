// Unit Tests for RISC0 Division Under-Constrained Vulnerability
// Bug: GHSA-f6rc-24x4-ppxp - Division circuit under-constrained
//
// Vulnerability: Two issues in risc0-circuit-rv32im:
//   1. For some inputs to signed integer division, circuit allowed two outputs (only one valid)
//   2. Division by zero result was underconstrained
//
// Key Edge Case: MIN_INT / -1 = MIN_INT (overflow case)
//   - In two's complement: i32::MIN / -1 should wrap to i32::MIN
//   - But mathematically would be MAX_INT + 1 (out of range)
//   - Circuit must enforce unique solution
//
// Commits:
//   Vulnerable: c8fd3bd2e2e18ad7a5abce213a376432116db039
//   Fixed:      bef7bf580eb13d5467074b5f6075a986734d3fe5

use std::num::Wrapping;

/// Division result: (quotient, remainder)
pub type DivResult = (i32, i32);

/// Emulator for vulnerable division (allows non-deterministic results)
pub struct VulnerableDivEmulator;

impl VulnerableDivEmulator {
    /// Vulnerable signed division - may return multiple valid results for edge cases
    pub fn div_signed(numer: i32, denom: i32) -> Vec<DivResult> {
        if denom == 0 {
            // Vulnerable: division by zero is underconstrained
            // Could return ANY value (non-deterministic)
            vec![
                (0, numer),              // Option 1
                (-1, numer),             // Option 2  
                (numer, 0),              // Option 3
                (i32::MAX, i32::MIN),    // Option 4 (arbitrary)
            ]
        } else if numer == i32::MIN && denom == -1 {
            // Vulnerable: MIN_INT / -1 allows two outputs
            // Option 1: Overflow wraps to MIN_INT
            // Option 2: Could erroneously compute MAX_INT  
            vec![
                (i32::MIN, 0),           // Correct: overflow wraps
                (i32::MAX, -1),          // Incorrect but allowed by underconstrained circuit
            ]
        } else {
            // Normal case: only one valid result
            vec![(numer / denom, numer % denom)]
        }
    }

    /// Vulnerable unsigned division - may return multiple results for div by zero
    pub fn div_unsigned(numer: u32, denom: u32) -> Vec<(u32, u32)> {
        if denom == 0 {
            // Vulnerable: division by zero is underconstrained
            vec![
                (0, numer),
                (u32::MAX, 0),
                (numer, 0),
            ]
        } else {
            vec![(numer / denom, numer % denom)]
        }
    }
}

/// Emulator for fixed division (deterministic, unique results)
pub struct FixedDivEmulator;

impl FixedDivEmulator {
    /// Fixed signed division - always returns unique, deterministic result
    pub fn div_signed(numer: i32, denom: i32) -> DivResult {
        if denom == 0 {
            // Fixed: division by zero has defined behavior (RISC-V spec)
            // quotient = -1, remainder = numerator
            (-1, numer)
        } else if numer == i32::MIN && denom == -1 {
            // Fixed: MIN_INT / -1 = MIN_INT (wrapping overflow)
            // This is the correct two's complement behavior
            (i32::MIN, 0)
        } else {
            // Normal case
            (numer / denom, numer % denom)
        }
    }

    /// Fixed unsigned division - deterministic div by zero behavior
    pub fn div_unsigned(numer: u32, denom: u32) -> (u32, u32) {
        if denom == 0 {
            // Fixed: division by zero has defined behavior (RISC-V spec)
            // quotient = MAX, remainder = numerator
            (u32::MAX, numer)
        } else {
            (numer / denom, numer % denom)
        }
    }
}

/// Verify division invariant: numer == quot * denom + rem
pub fn verify_division_invariant(numer: i32, denom: i32, quot: i32, rem: i32) -> bool {
    if denom == 0 {
        // Special case: can't verify with multiplication for div by zero
        // Just check that result is deterministic (handled by other tests)
        true
    } else {
        // Use wrapping arithmetic to handle overflow
        let reconstructed = (Wrapping(quot) * Wrapping(denom) + Wrapping(rem)).0;
        reconstructed == numer
    }
}

/// Oracle: Returns true if division behavior is non-deterministic (vulnerable)
pub fn oracle_division_determinism(numer: i32, denom: i32) -> bool {
    let vuln_results = VulnerableDivEmulator::div_signed(numer, denom);
    
    // Vulnerable if multiple different results are possible
    if vuln_results.len() > 1 {
        let first = vuln_results[0];
        vuln_results.iter().any(|&r| r != first)
    } else {
        false
    }
}

// ============================================================================
// UNIT TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    // ========================================================================
    // CORE BUG DEMONSTRATIONS
    // ========================================================================

    #[test]
    fn test_signed_div_min_int_neg_one() {
        println!("\n=== Test: MIN_INT / -1 Edge Case ===");
        
        let numer = i32::MIN; // -2147483648
        let denom = -1;
        
        println!("Input: {} / {}", numer, denom);
        
        // Vulnerable: May return multiple results
        let vuln_results = VulnerableDivEmulator::div_signed(numer, denom);
        println!("Vulnerable emulator returned {} possible results:", vuln_results.len());
        for (i, (q, r)) in vuln_results.iter().enumerate() {
            println!("  Option {}: quot={}, rem={}", i + 1, q, r);
        }
        
        assert!(vuln_results.len() > 1, "Vulnerable should allow multiple results");
        
        // Fixed: Always returns unique result
        let (fixed_quot, fixed_rem) = FixedDivEmulator::div_signed(numer, denom);
        println!("Fixed emulator: quot={}, rem={}", fixed_quot, fixed_rem);
        
        // The correct answer is MIN_INT (overflow wraps)
        assert_eq!(fixed_quot, i32::MIN, "Fixed should return MIN_INT (wrapping overflow)");
        assert_eq!(fixed_rem, 0, "Remainder should be 0");
        
        // Verify invariant
        assert!(verify_division_invariant(numer, denom, fixed_quot, fixed_rem),
                "Division invariant must hold");
        
        println!("✓ MIN_INT / -1 edge case properly constrained in fixed version");
    }

    #[test]
    fn test_div_by_zero_constrained() {
        println!("\n=== Test: Division by Zero Determinism ===");
        
        let numer = 42;
        let denom = 0;
        
        println!("Input: {} / {}", numer, denom);
        
        // Vulnerable: May return multiple different results
        let vuln_results = VulnerableDivEmulator::div_signed(numer, denom);
        println!("Vulnerable emulator returned {} possible results:", vuln_results.len());
        for (i, (q, r)) in vuln_results.iter().enumerate() {
            println!("  Option {}: quot={}, rem={}", i + 1, q, r);
        }
        
        assert!(vuln_results.len() > 1, "Vulnerable should allow multiple div-by-zero results");
        
        // Fixed: Always returns same deterministic result
        let result1 = FixedDivEmulator::div_signed(numer, denom);
        let result2 = FixedDivEmulator::div_signed(numer, denom);
        
        println!("Fixed emulator result 1: quot={}, rem={}", result1.0, result1.1);
        println!("Fixed emulator result 2: quot={}, rem={}", result2.0, result2.1);
        
        assert_eq!(result1, result2, "Division by zero must be deterministic");
        
        // Per RISC-V spec: DIV by zero returns -1
        assert_eq!(result1.0, -1, "DIV by zero should return -1 (RISC-V spec)");
        assert_eq!(result1.1, numer, "REM by zero should return numerator (RISC-V spec)");
        
        println!("✓ Division by zero is deterministic in fixed version");
    }

    #[test]
    fn test_unsigned_div_by_zero_constrained() {
        println!("\n=== Test: Unsigned Division by Zero Determinism ===");
        
        let numer = 100u32;
        let denom = 0u32;
        
        println!("Input: {} / {} (unsigned)", numer, denom);
        
        // Vulnerable: Multiple possible results
        let vuln_results = VulnerableDivEmulator::div_unsigned(numer, denom);
        println!("Vulnerable emulator returned {} possible results", vuln_results.len());
        
        assert!(vuln_results.len() > 1, "Vulnerable should allow multiple results");
        
        // Fixed: Deterministic
        let result1 = FixedDivEmulator::div_unsigned(numer, denom);
        let result2 = FixedDivEmulator::div_unsigned(numer, denom);
        
        println!("Fixed emulator: quot={}, rem={}", result1.0, result1.1);
        
        assert_eq!(result1, result2, "Unsigned div by zero must be deterministic");
        
        // Per RISC-V spec: DIVU by zero returns MAX
        assert_eq!(result1.0, u32::MAX, "DIVU by zero should return MAX (RISC-V spec)");
        assert_eq!(result1.1, numer, "REMU by zero should return numerator (RISC-V spec)");
        
        println!("✓ Unsigned division by zero is deterministic in fixed version");
    }

    #[test]
    fn test_oracle_detects_vulnerability() {
        println!("\n=== Test: Oracle Correctness ===");
        
        // Oracle should return true for vulnerable cases
        let vuln_case1 = oracle_division_determinism(i32::MIN, -1);
        let vuln_case2 = oracle_division_determinism(42, 0);
        
        println!("Oracle on MIN_INT / -1: {} (true = vuln)", vuln_case1);
        println!("Oracle on 42 / 0: {} (true = vuln)", vuln_case2);
        
        assert!(vuln_case1, "Oracle should detect MIN_INT / -1 vulnerability");
        assert!(vuln_case2, "Oracle should detect division by zero vulnerability");
        
        // Oracle should return false for normal cases
        let normal_case = oracle_division_determinism(10, 3);
        println!("Oracle on 10 / 3: {} (false = safe)", normal_case);
        
        assert!(!normal_case, "Oracle should NOT trigger on normal division");
        
        println!("✓ Oracle correctly identifies vulnerable cases");
    }

    // ========================================================================
    // EXHAUSTIVE EDGE CASE TESTING
    // ========================================================================

    #[test]
    fn test_all_powers_of_two_signed() {
        println!("\n=== Test: Powers of Two (Signed) ===");
        
        let powers: Vec<i32> = (0..31).map(|i| 1i32 << i).collect();
        let neg_powers: Vec<i32> = powers.iter().map(|&p| -p).collect();
        
        let mut edge_cases_tested = 0;
        
        for &numer in powers.iter().chain(neg_powers.iter()) {
            for &denom in [1, -1, 2, -2].iter() {
                if denom != 0 {
                    let (q, r) = FixedDivEmulator::div_signed(numer, denom);
                    assert!(verify_division_invariant(numer, denom, q, r),
                            "Invariant failed for {} / {}", numer, denom);
                    edge_cases_tested += 1;
                }
            }
        }
        
        println!("✓ Tested {} power-of-two edge cases", edge_cases_tested);
    }

    #[test]
    fn test_boundary_values_signed() {
        println!("\n=== Test: Boundary Values (Signed) ===");
        
        let boundaries = vec![
            i32::MIN, i32::MIN + 1, i32::MIN + 2,
            -2, -1, 0, 1, 2,
            i32::MAX - 2, i32::MAX - 1, i32::MAX,
        ];
        
        let mut cases_tested = 0;
        
        for &numer in &boundaries {
            for &denom in &boundaries {
                if denom != 0 {
                    let (q, r) = FixedDivEmulator::div_signed(numer, denom);
                    assert!(verify_division_invariant(numer, denom, q, r),
                            "Invariant failed for {} / {}", numer, denom);
                    cases_tested += 1;
                }
            }
        }
        
        println!("✓ Tested {} boundary value combinations", cases_tested);
    }

    #[test]
    fn test_boundary_values_unsigned() {
        println!("\n=== Test: Boundary Values (Unsigned) ===");
        
        let boundaries = vec![
            0u32, 1, 2,
            u32::MAX - 2, u32::MAX - 1, u32::MAX,
        ];
        
        let mut cases_tested = 0;
        
        for &numer in &boundaries {
            for &denom in &boundaries {
                if denom != 0 {
                    let (q, r) = FixedDivEmulator::div_unsigned(numer, denom);
                    
                    // Verify invariant for unsigned
                    let reconstructed = q.wrapping_mul(denom).wrapping_add(r);
                    assert_eq!(reconstructed, numer,
                               "Unsigned invariant failed for {} / {}", numer, denom);
                    
                    // Remainder must be less than divisor
                    assert!(r < denom, "Remainder {} must be < divisor {}", r, denom);
                    
                    cases_tested += 1;
                }
            }
        }
        
        println!("✓ Tested {} unsigned boundary combinations", cases_tested);
    }

    #[test]
    fn test_all_div_by_zero_values() {
        println!("\n=== Test: All Division by Zero Cases ===");
        
        let test_values = vec![
            i32::MIN, i32::MIN + 1, -1000, -1, 0, 1, 1000, i32::MAX - 1, i32::MAX,
        ];
        
        for &numer in &test_values {
            let result1 = FixedDivEmulator::div_signed(numer, 0);
            let result2 = FixedDivEmulator::div_signed(numer, 0);
            
            assert_eq!(result1, result2, 
                       "Div by zero must be deterministic for numer={}", numer);
            assert_eq!(result1.0, -1, "DIV {} / 0 should return -1", numer);
            assert_eq!(result1.1, numer, "REM {} / 0 should return {}", numer, numer);
        }
        
        println!("✓ All div-by-zero cases are deterministic");
    }

    #[test]
    fn test_min_int_with_various_denominators() {
        println!("\n=== Test: MIN_INT with Various Denominators ===");
        
        let numer = i32::MIN;
        let denoms = vec![-2, -1, 1, 2, i32::MIN, i32::MAX];
        
        for &denom in &denoms {
            let (q, r) = FixedDivEmulator::div_signed(numer, denom);
            
            println!("  MIN_INT / {}: quot={}, rem={}", denom, q, r);
            
            assert!(verify_division_invariant(numer, denom, q, r),
                    "Invariant failed for MIN_INT / {}", denom);
            
            // Special check for the critical case
            if denom == -1 {
                assert_eq!(q, i32::MIN, "MIN_INT / -1 must wrap to MIN_INT");
                assert_eq!(r, 0, "MIN_INT / -1 remainder must be 0");
            }
        }
        
        println!("✓ MIN_INT divisions correctly handled");
    }

    #[test]
    fn test_remainder_constraints() {
        println!("\n=== Test: Remainder Constraints ===");
        
        // For division numer / denom = quot remainder rem:
        // - If denom > 0: 0 <= rem < denom
        // - If denom < 0: 0 <= rem < |denom|
        // - rem has same sign as numerator (or is zero)
        
        let test_cases = vec![
            (10, 3), (10, -3), (-10, 3), (-10, -3),
            (7, 2), (7, -2), (-7, 2), (-7, -2),
            (100, 7), (-100, 7), (100, -7), (-100, -7),
        ];
        
        for &(numer, denom) in &test_cases {
            let (q, r) = FixedDivEmulator::div_signed(numer, denom);
            
            // Remainder magnitude must be less than divisor magnitude
            assert!(r.abs() < denom.abs(),
                    "Remainder {} must have magnitude < divisor {} for {} / {}",
                    r, denom, numer, denom);
            
            // Verify invariant
            assert!(verify_division_invariant(numer, denom, q, r),
                    "Invariant failed for {} / {}", numer, denom);
        }
        
        println!("✓ All remainder constraints satisfied");
    }

    // ========================================================================
    // PROPERTY-BASED TESTS (SIMULATED)
    // ========================================================================

    #[test]
    fn test_division_determinism_property() {
        println!("\n=== Property Test: Division Determinism ===");
        
        // Property: For any fixed input, division must always return same result
        let test_inputs = vec![
            (0, 1), (1, 1), (10, 3), (100, 7), (-50, 8),
            (i32::MAX, 2), (i32::MIN, 2), (i32::MAX, -1),
            (42, -5), (-123, 456), (999, -999),
        ];
        
        for &(numer, denom) in &test_inputs {
            let result1 = FixedDivEmulator::div_signed(numer, denom);
            let result2 = FixedDivEmulator::div_signed(numer, denom);
            let result3 = FixedDivEmulator::div_signed(numer, denom);
            
            assert_eq!(result1, result2, "Non-deterministic for {} / {}", numer, denom);
            assert_eq!(result2, result3, "Non-deterministic for {} / {}", numer, denom);
        }
        
        println!("✓ Division is deterministic across all tested inputs");
    }

    #[test]
    fn test_division_invariant_property() {
        println!("\n=== Property Test: Division Invariant (numer = quot * denom + rem) ===");
        
        // Generate test cases across the full range
        let mut rng_state = 12345u32;
        let mut cases_tested = 0;
        
        for _ in 0..100 {
            // Simple LCG for pseudo-random numbers
            rng_state = rng_state.wrapping_mul(1103515245).wrapping_add(12345);
            let numer = rng_state as i32;
            
            rng_state = rng_state.wrapping_mul(1103515245).wrapping_add(12345);
            let denom = rng_state as i32;
            
            if denom != 0 {
                let (q, r) = FixedDivEmulator::div_signed(numer, denom);
                assert!(verify_division_invariant(numer, denom, q, r),
                        "Invariant violated for {} / {} = {} rem {}", numer, denom, q, r);
                cases_tested += 1;
            }
        }
        
        println!("✓ Division invariant holds for {} random cases", cases_tested);
    }

    #[test]
    fn test_division_uniqueness_property() {
        println!("\n=== Property Test: Division Uniqueness ===");
        
        // Property: For any valid division result (q, r),
        // there should be no other valid pair (q', r') where q' != q or r' != r
        
        let test_cases = vec![
            (10, 3), (20, 7), (-15, 4), (100, -13),
            (i32::MIN, 2), (i32::MAX, 3),
        ];
        
        for &(numer, denom) in &test_cases {
            let (q, r) = FixedDivEmulator::div_signed(numer, denom);
            
            // Try to find another valid solution
            let mut found_alternative = false;
            for q_alt in (q - 2)..=(q + 2) {
                for r_alt in (r - 2)..=(r + 2) {
                    if (q_alt, r_alt) == (q, r) {
                        continue;
                    }
                    
                    // Check if this alternative satisfies the invariant
                    if verify_division_invariant(numer, denom, q_alt, r_alt) {
                        // Also check remainder constraint
                        if r_alt.abs() < denom.abs() {
                            found_alternative = true;
                            println!("⚠ Found alternative solution for {} / {}: ({}, {}) and ({}, {})",
                                     numer, denom, q, r, q_alt, r_alt);
                        }
                    }
                }
            }
            
            assert!(!found_alternative, "Division solution must be unique for {} / {}", numer, denom);
        }
        
        println!("✓ All division solutions are unique");
    }

    // ========================================================================
    // REGRESSION TESTS
    // ========================================================================

    #[test]
    fn test_known_problematic_inputs() {
        println!("\n=== Regression Test: Known Problematic Inputs ===");
        
        // These are the specific cases mentioned in the advisory
        let critical_cases = vec![
            (i32::MIN, -1, i32::MIN, 0, "MIN_INT / -1 overflow"),
            (42, 0, -1, 42, "Division by zero (positive)"),
            (-42, 0, -1, -42, "Division by zero (negative)"),
            (0, 0, -1, 0, "Zero divided by zero"),
        ];
        
        for (numer, denom, expected_q, expected_r, description) in critical_cases {
            let (q, r) = FixedDivEmulator::div_signed(numer, denom);
            
            println!("  Testing: {} ({} / {})", description, numer, denom);
            println!("    Expected: quot={}, rem={}", expected_q, expected_r);
            println!("    Got:      quot={}, rem={}", q, r);
            
            assert_eq!(q, expected_q, "Quotient mismatch for {}", description);
            assert_eq!(r, expected_r, "Remainder mismatch for {}", description);
        }
        
        println!("✓ All known problematic inputs handled correctly");
    }
}


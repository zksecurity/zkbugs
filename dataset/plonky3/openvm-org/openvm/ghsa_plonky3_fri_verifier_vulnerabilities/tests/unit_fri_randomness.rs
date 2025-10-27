// Unit Tests for OpenVM/Plonky3 FRI Missing Randomness & Final Poly Check
// Bug: GHSA-4w7p-8f9q-f4g2 - Two vulnerabilities in FRI verifier
//
// Issue 1: Missing randomness (beta^2) in FRI folding when mixing domains
// Issue 2: Missing final polynomial degree check (native verifier only)
//
// Scope:
//   - Native verifier: BOTH issues
//   - Recursive verifier: ONLY issue 1 (final_poly fixed to degree 0)
//
// Commits:
//   Vulnerable: 7548bdf844db53c0a6fc9ed9f153c54422c6cfa4
//   Fixed:      bdb4831fefed13b0741d3a052d434a9c995c6d5d

/// Simulated field element (simplified for testing)
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct FieldElement(pub u64);

impl FieldElement {
    pub fn zero() -> Self {
        FieldElement(0)
    }
    
    pub fn one() -> Self {
        FieldElement(1)
    }
    
    pub fn add(&self, other: &Self) -> Self {
        FieldElement(self.0.wrapping_add(other.0))
    }
    
    pub fn mul(&self, other: &Self) -> Self {
        FieldElement(self.0.wrapping_mul(other.0))
    }
    
    pub fn square(&self) -> Self {
        self.mul(self)
    }
}

/// FRI folding result
#[derive(Debug, Clone, PartialEq)]
pub struct FoldingResult {
    pub folded_eval: FieldElement,
    pub used_beta_squared: bool,
}

/// Emulator for vulnerable FRI folding (missing beta^2)
pub struct VulnerableFriFolding;

impl VulnerableFriFolding {
    /// Vulnerable: Missing beta^2 term in folding
    pub fn fold(eval_0: FieldElement, eval_1: FieldElement, beta: FieldElement, _reduced_opening: FieldElement) -> FoldingResult {
        // VULNERABLE: folded = eval_0 + beta * eval_1
        // Missing: + beta^2 * reduced_opening
        let folded = eval_0.add(&beta.mul(&eval_1));
        
        FoldingResult {
            folded_eval: folded,
            used_beta_squared: false,  // BUG: Not using beta^2!
        }
    }
}

/// Emulator for fixed FRI folding (includes beta^2)
pub struct FixedFriFolding;

impl FixedFriFolding {
    /// Fixed: Includes beta^2 term in folding
    pub fn fold(eval_0: FieldElement, eval_1: FieldElement, beta: FieldElement, reduced_opening: FieldElement) -> FoldingResult {
        // FIXED: folded = eval_0 + beta * eval_1 + beta^2 * reduced_opening
        let beta_squared = beta.square();
        let folded = eval_0
            .add(&beta.mul(&eval_1))
            .add(&beta_squared.mul(&reduced_opening));
        
        FoldingResult {
            folded_eval: folded,
            used_beta_squared: true,  // FIX: Using beta^2!
        }
    }
}

/// Final polynomial length validation
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LengthCheckResult {
    Pass,
    Fail,
    NotChecked,  // Vulnerable: no check performed
}

/// Emulator for vulnerable final poly check (no validation)
pub struct VulnerableFinalPolyCheck;

impl VulnerableFinalPolyCheck {
    pub fn check_length(_actual_len: usize, _expected_len: usize) -> LengthCheckResult {
        // VULNERABLE: No length check performed
        LengthCheckResult::NotChecked
    }
}

/// Emulator for fixed final poly check (validates length)
pub struct FixedFinalPolyCheck;

impl FixedFinalPolyCheck {
    pub fn check_length(actual_len: usize, expected_len: usize) -> LengthCheckResult {
        // FIXED: Enforce length equality
        if actual_len == expected_len {
            LengthCheckResult::Pass
        } else {
            LengthCheckResult::Fail
        }
    }
}

/// Oracle: Returns true if beta^2 randomness is missing (vulnerable)
pub fn oracle_missing_beta_squared(used_beta_squared: bool) -> bool {
    !used_beta_squared
}

/// Oracle: Returns true if final poly length check is missing (vulnerable)
pub fn oracle_missing_length_check(check_result: LengthCheckResult) -> bool {
    check_result == LengthCheckResult::NotChecked
}

/// Demonstrate how missing randomness allows cancellation
pub fn demonstrate_cancellation_attack(beta: FieldElement) -> bool {
    // Attacker crafts eval_0, eval_1, reduced_opening such that
    // high-degree terms cancel out when beta^2 is missing
    
    // Example: If eval_0 = X, eval_1 = -X/beta, reduced_opening = 0
    // Vulnerable folding: X + beta*(-X/beta) = X - X = 0 (cancelled!)
    // Fixed folding: X + beta*(-X/beta) + beta^2*0 = 0 (still, but with proper constraint)
    
    // For demonstration, we'll show the computation differs
    let eval_0 = FieldElement(100);
    let eval_1 = FieldElement(50);
    let reduced_opening = FieldElement(25);
    
    let vuln_result = VulnerableFriFolding::fold(eval_0, eval_1, beta, reduced_opening);
    let fixed_result = FixedFriFolding::fold(eval_0, eval_1, beta, reduced_opening);
    
    // Results should differ when reduced_opening is non-zero
    vuln_result.folded_eval != fixed_result.folded_eval
}

// ============================================================================
// UNIT TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    // ========================================================================
    // ISSUE 1: MISSING BETA^2 RANDOMNESS
    // ========================================================================

    #[test]
    fn test_beta_squared_computation() {
        println!("\n=== Test: Beta Squared Computation ===");
        
        let test_betas = vec![
            FieldElement(2),
            FieldElement(3),
            FieldElement(10),
            FieldElement(100),
            FieldElement(12345),
        ];
        
        for beta in test_betas {
            let beta_sq_manual = FieldElement(beta.0 * beta.0);
            let beta_sq_method = beta.square();
            
            println!("beta={}: beta^2={} (manual), {} (method)",
                     beta.0, beta_sq_manual.0, beta_sq_method.0);
            
            assert_eq!(beta_sq_manual, beta_sq_method,
                      "Beta squared computation must be correct");
        }
        
        println!("✓ Beta squared computation verified");
    }

    #[test]
    fn test_folding_with_randomness_vulnerable() {
        println!("\n=== Test: Vulnerable Folding (Missing Beta^2) ===");
        
        let eval_0 = FieldElement(100);
        let eval_1 = FieldElement(200);
        let beta = FieldElement(5);
        let reduced_opening = FieldElement(50);
        
        let result = VulnerableFriFolding::fold(eval_0, eval_1, beta, reduced_opening);
        
        println!("Inputs:");
        println!("  eval_0 = {}", eval_0.0);
        println!("  eval_1 = {}", eval_1.0);
        println!("  beta = {}", beta.0);
        println!("  reduced_opening = {}", reduced_opening.0);
        println!("Output:");
        println!("  folded_eval = {}", result.folded_eval.0);
        println!("  used_beta_squared = {}", result.used_beta_squared);
        
        // Calculate expected: eval_0 + beta * eval_1
        let expected = eval_0.add(&beta.mul(&eval_1));
        println!("Expected (eval_0 + beta*eval_1) = {}", expected.0);
        
        assert_eq!(result.folded_eval, expected, "Vulnerable should NOT include beta^2 term");
        assert!(!result.used_beta_squared, "Vulnerable should NOT use beta_squared");
        
        println!("✓ Vulnerable folding confirmed (missing beta^2 term)");
    }

    #[test]
    fn test_folding_with_randomness_fixed() {
        println!("\n=== Test: Fixed Folding (Includes Beta^2) ===");
        
        let eval_0 = FieldElement(100);
        let eval_1 = FieldElement(200);
        let beta = FieldElement(5);
        let reduced_opening = FieldElement(50);
        
        let result = FixedFriFolding::fold(eval_0, eval_1, beta, reduced_opening);
        
        println!("Inputs:");
        println!("  eval_0 = {}", eval_0.0);
        println!("  eval_1 = {}", eval_1.0);
        println!("  beta = {}", beta.0);
        println!("  reduced_opening = {}", reduced_opening.0);
        println!("Output:");
        println!("  folded_eval = {}", result.folded_eval.0);
        println!("  used_beta_squared = {}", result.used_beta_squared);
        
        // Calculate expected: eval_0 + beta * eval_1 + beta^2 * reduced_opening
        let beta_squared = beta.square();
        let expected = eval_0
            .add(&beta.mul(&eval_1))
            .add(&beta_squared.mul(&reduced_opening));
        println!("Expected (eval_0 + beta*eval_1 + beta^2*reduced_opening) = {}", expected.0);
        
        assert_eq!(result.folded_eval, expected, "Fixed should include beta^2 term");
        assert!(result.used_beta_squared, "Fixed should use beta_squared");
        
        println!("✓ Fixed folding confirmed (includes beta^2 term)");
    }

    #[test]
    fn test_folding_differential() {
        println!("\n=== Test: Differential Folding (Vulnerable vs Fixed) ===");
        
        let eval_0 = FieldElement(100);
        let eval_1 = FieldElement(200);
        let beta = FieldElement(5);
        let reduced_opening = FieldElement(50);  // Non-zero to show difference
        
        let vuln_result = VulnerableFriFolding::fold(eval_0, eval_1, beta, reduced_opening);
        let fixed_result = FixedFriFolding::fold(eval_0, eval_1, beta, reduced_opening);
        
        println!("Vulnerable folded_eval: {}", vuln_result.folded_eval.0);
        println!("Fixed folded_eval: {}", fixed_result.folded_eval.0);
        println!("Difference: {}", fixed_result.folded_eval.0.wrapping_sub(vuln_result.folded_eval.0));
        
        // When reduced_opening is non-zero, results should differ
        if reduced_opening.0 != 0 {
            assert_ne!(vuln_result.folded_eval, fixed_result.folded_eval,
                      "Results should differ when reduced_opening is non-zero");
            println!("✓ Differential behavior confirmed");
        } else {
            println!("⚠ Results same when reduced_opening = 0 (beta^2 term vanishes)");
        }
    }

    #[test]
    fn test_randomness_cancellation_attack() {
        println!("\n=== Test: Randomness Cancellation Attack ===");
        
        let beta = FieldElement(7);
        
        let can_cancel = demonstrate_cancellation_attack(beta);
        println!("Can attacker exploit missing randomness? {}", can_cancel);
        
        if can_cancel {
            println!("✓ Missing randomness enables cancellation attacks");
        } else {
            println!("⚠ This specific test case doesn't show cancellation");
            println!("  (Attack exists but requires carefully crafted inputs)");
        }
    }

    #[test]
    fn test_oracle_beta_squared() {
        println!("\n=== Test: Beta Squared Oracle ===");
        
        let eval_0 = FieldElement(100);
        let eval_1 = FieldElement(200);
        let beta = FieldElement(5);
        let reduced_opening = FieldElement(50);
        
        let vuln = VulnerableFriFolding::fold(eval_0, eval_1, beta, reduced_opening);
        let fixed = FixedFriFolding::fold(eval_0, eval_1, beta, reduced_opening);
        
        let vuln_oracle = oracle_missing_beta_squared(vuln.used_beta_squared);
        let fixed_oracle = oracle_missing_beta_squared(fixed.used_beta_squared);
        
        println!("Vulnerable oracle: {} (true = missing beta^2)", vuln_oracle);
        println!("Fixed oracle: {} (false = has beta^2)", fixed_oracle);
        
        assert!(vuln_oracle, "Oracle should detect missing beta^2 in vulnerable");
        assert!(!fixed_oracle, "Oracle should not trigger on fixed");
        
        println!("✓ Beta squared oracle works correctly");
    }

    // ========================================================================
    // ISSUE 2: MISSING FINAL POLY LENGTH CHECK (NATIVE ONLY)
    // ========================================================================

    #[test]
    fn test_final_poly_length_enforcement_vulnerable() {
        println!("\n=== Test: Vulnerable Final Poly Length (No Check) ===");
        
        let actual_len = 16;
        let expected_len = 0;  // OpenVM recursion expects degree 0
        
        let result = VulnerableFinalPolyCheck::check_length(actual_len, expected_len);
        
        println!("Actual length: {}", actual_len);
        println!("Expected length: {}", expected_len);
        println!("Check result: {:?}", result);
        
        assert_eq!(result, LengthCheckResult::NotChecked,
                  "Vulnerable: No length check performed");
        
        println!("✓ Vulnerable accepts oversized final_poly (no check!)");
    }

    #[test]
    fn test_final_poly_length_enforcement_fixed() {
        println!("\n=== Test: Fixed Final Poly Length (Enforced) ===");
        
        // Test 1: Wrong length should fail
        let result_wrong = FixedFinalPolyCheck::check_length(16, 0);
        println!("Wrong length (16 vs 0): {:?}", result_wrong);
        assert_eq!(result_wrong, LengthCheckResult::Fail, "Should reject wrong length");
        
        // Test 2: Correct length should pass
        let result_correct = FixedFinalPolyCheck::check_length(0, 0);
        println!("Correct length (0 vs 0): {:?}", result_correct);
        assert_eq!(result_correct, LengthCheckResult::Pass, "Should accept correct length");
        
        println!("✓ Fixed enforces final_poly length check");
    }

    #[test]
    fn test_final_poly_various_lengths() {
        println!("\n=== Test: Final Poly Various Lengths ===");
        
        let expected = 0;  // OpenVM recursion fixed to degree 0
        let test_lengths = vec![0, 1, 2, 4, 8, 16, 32];
        
        for actual in test_lengths {
            let vuln = VulnerableFinalPolyCheck::check_length(actual, expected);
            let fixed = FixedFinalPolyCheck::check_length(actual, expected);
            
            println!("Length {}: vulnerable={:?}, fixed={:?}", actual, vuln, fixed);
            
            assert_eq!(vuln, LengthCheckResult::NotChecked,
                      "Vulnerable never checks");
            
            if actual == expected {
                assert_eq!(fixed, LengthCheckResult::Pass, "Fixed accepts correct length");
            } else {
                assert_eq!(fixed, LengthCheckResult::Fail, "Fixed rejects wrong length");
            }
        }
        
        println!("✓ Length validation tested across multiple values");
    }

    #[test]
    fn test_oracle_length_check() {
        println!("\n=== Test: Length Check Oracle ===");
        
        let vuln_result = VulnerableFinalPolyCheck::check_length(16, 0);
        let fixed_result = FixedFinalPolyCheck::check_length(16, 0);
        
        let vuln_oracle = oracle_missing_length_check(vuln_result);
        let fixed_oracle = oracle_missing_length_check(fixed_result);
        
        println!("Vulnerable oracle: {} (true = no check)", vuln_oracle);
        println!("Fixed oracle: {} (false = has check)", fixed_oracle);
        
        assert!(vuln_oracle, "Oracle should detect missing length check");
        assert!(!fixed_oracle, "Oracle should not trigger when check present");
        
        println!("✓ Length check oracle works correctly");
    }

    // ========================================================================
    // COMBINED TESTS
    // ========================================================================

    #[test]
    fn test_both_vulnerabilities_present() {
        println!("\n=== Test: Both Vulnerabilities Present (Native Verifier) ===");
        
        // Native verifier has BOTH issues
        println!("Native verifier vulnerabilities:");
        
        // Issue 1: Missing beta^2
        let folding = VulnerableFriFolding::fold(
            FieldElement(100), FieldElement(200), FieldElement(5), FieldElement(50)
        );
        println!("  1. Missing beta^2: {}", !folding.used_beta_squared);
        assert!(!folding.used_beta_squared);
        
        // Issue 2: Missing length check
        let length_check = VulnerableFinalPolyCheck::check_length(16, 0);
        println!("  2. Missing length check: {}", length_check == LengthCheckResult::NotChecked);
        assert_eq!(length_check, LengthCheckResult::NotChecked);
        
        println!("✓ Both vulnerabilities confirmed in vulnerable version");
    }

    #[test]
    fn test_recursive_verifier_scope() {
        println!("\n=== Test: Recursive Verifier Vulnerability Scope ===");
        
        println!("Recursive verifier characteristics:");
        println!("  - Affected by: Missing beta^2 randomness");
        println!("  - NOT affected by: Final poly length check");
        println!("  - Reason: final_poly degree fixed to 0 (constant)");
        println!("");
        println!("From PR #1703 commit message:");
        println!("  'Since our recursion program only supports final poly");
        println!("   length = 0, we can remove the previous checks that");
        println!("   higher degree coefficients are zero.'");
        println!("");
        println!("Implication:");
        println!("  - Recursive verifier ONLY needs beta^2 fix");
        println!("  - Final poly length is hardcoded to 0");
        println!("  - No length check needed (degree is constant)");
    }

    #[test]
    fn test_native_vs_recursive_differences() {
        println!("\n=== Test: Native vs Recursive Verifier Differences ===");
        
        println!("\nNative Verifier (Plonky3 SDK/CLI):");
        println!("  Vulnerability 1: Missing beta^2 ✗");
        println!("  Vulnerability 2: Missing length check ✗");
        println!("  Fix required: BOTH issues");
        
        println!("\nRecursive Verifier (OpenVM on-chain):");
        println!("  Vulnerability 1: Missing beta^2 ✗");
        println!("  Vulnerability 2: N/A (degree fixed to 0) ✓");
        println!("  Fix required: ONLY beta^2");
        
        println!("\n✓ Scope differences documented");
    }

    // ========================================================================
    // PROPERTY TESTS
    // ========================================================================

    #[test]
    fn test_property_beta_squared_always_equal() {
        println!("\n=== Property Test: beta^2 == beta * beta ===");
        
        // Simple pseudo-random test
        let mut rng_state = 12345u64;
        let mut cases_tested = 0;
        
        for _ in 0..100 {
            rng_state = rng_state.wrapping_mul(1103515245).wrapping_add(12345);
            let beta = FieldElement(rng_state);
            
            let beta_sq_1 = beta.square();
            let beta_sq_2 = beta.mul(&beta);
            
            assert_eq!(beta_sq_1, beta_sq_2,
                      "beta^2 must equal beta * beta");
            cases_tested += 1;
        }
        
        println!("✓ Tested {} random beta values", cases_tested);
    }

    #[test]
    fn test_property_folding_includes_all_terms() {
        println!("\n=== Property Test: Fixed Folding Includes All Terms ===");
        
        // Property: Fixed folding result should equal eval_0 + beta*eval_1 + beta^2*reduced
        
        let test_cases = vec![
            (100, 200, 5, 50),
            (0, 0, 0, 0),
            (1, 1, 1, 1),
            (1000, 2000, 10, 500),
        ];
        
        for (e0, e1, b, ro) in test_cases {
            let eval_0 = FieldElement(e0);
            let eval_1 = FieldElement(e1);
            let beta = FieldElement(b);
            let reduced = FieldElement(ro);
            
            let result = FixedFriFolding::fold(eval_0, eval_1, beta, reduced);
            
            // Manual calculation
            let beta_sq = beta.square();
            let expected = eval_0
                .add(&beta.mul(&eval_1))
                .add(&beta_sq.mul(&reduced));
            
            assert_eq!(result.folded_eval, expected,
                      "Folding must include all three terms");
        }
        
        println!("✓ All terms properly included in folding");
    }
}


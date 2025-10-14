// Harness Tests for RISC0 Composite Receipt Integrity Validation
// Bug: GHSA-5c79-r6x7-3jx9 - Missing verify_integrity_with_context calls
//
// These tests perform static analysis and pattern detection on the RISC0 source code
// to identify vulnerability and fix indicators for receipt integrity validation.

use std::fs;
use std::path::Path;

/// Path helper for locating source files
pub struct SourcePaths {
    base: &'static str,
}

impl SourcePaths {
    pub fn new() -> Self {
        Self {
            base: "../sources/risc0/zkvm/src",
        }
    }

    pub fn receipt_rs(&self) -> String {
        format!("{}/receipt.rs", self.base)
    }

    pub fn receipt_claim_rs(&self) -> String {
        format!("{}/receipt_claim.rs", self.base)
    }
}

/// Pattern matcher for integrity validation patterns
pub struct IntegrityPatternMatcher {
    content: String,
}

impl IntegrityPatternMatcher {
    pub fn from_file<P: AsRef<Path>>(path: P) -> std::io::Result<Self> {
        let content = fs::read_to_string(path)?;
        Ok(Self { content })
    }

    /// Check for verify_integrity_with_context function definition
    pub fn has_verify_integrity_function(&self) -> bool {
        self.content.contains("fn verify_integrity_with_context")
            || self.content.contains("pub fn verify_integrity_with_context")
    }

    /// Check for Composite receipt integrity call
    pub fn has_composite_integrity_call(&self) -> bool {
        self.content.contains("Self::Composite(inner)") 
            && self.contains_nearby("Self::Composite(inner)", "verify_integrity_with_context", 150)
    }

    /// Check for Succinct receipt integrity call
    pub fn has_succinct_integrity_call(&self) -> bool {
        self.content.contains("Self::Succinct(inner)") 
            && self.contains_nearby("Self::Succinct(inner)", "verify_integrity_with_context", 150)
    }

    /// Check for Groth16 receipt integrity call
    pub fn has_groth16_integrity_call(&self) -> bool {
        self.content.contains("Self::Groth16(inner)") 
            && self.contains_nearby("Self::Groth16(inner)", "verify_integrity_with_context", 150)
    }

    /// Check if two patterns appear within N characters of each other
    fn contains_nearby(&self, pattern1: &str, pattern2: &str, max_distance: usize) -> bool {
        if let Some(idx1) = self.content.find(pattern1) {
            let search_start = idx1;
            let search_end = std::cmp::min(idx1 + max_distance, self.content.len());
            let window = &self.content[search_start..search_end];
            window.contains(pattern2)
        } else {
            false
        }
    }

    /// Check for VerifierContext parameter
    pub fn has_verifier_context(&self) -> bool {
        self.content.contains("VerifierContext") 
            || self.content.contains("ctx: &")
    }

    /// Count total integrity check patterns
    pub fn count_integrity_patterns(&self) -> usize {
        let mut count = 0;
        if self.has_composite_integrity_call() {
            count += 1;
        }
        if self.has_succinct_integrity_call() {
            count += 1;
        }
        if self.has_groth16_integrity_call() {
            count += 1;
        }
        count
    }

    /// Check for vulnerable patterns (direct Ok(()) without validation)
    pub fn has_vulnerable_pattern(&self) -> bool {
        // Look for match arms that return Ok(()) without calling inner.verify_integrity_with_context
        self.has_direct_ok_return_in_composite()
            || self.has_direct_ok_return_in_succinct()
            || self.has_direct_ok_return_in_groth16()
    }

    fn has_direct_ok_return_in_composite(&self) -> bool {
        if let Some(idx) = self.content.find("Self::Composite(inner)") {
            let window = &self.content[idx..std::cmp::min(idx + 150, self.content.len())];
            window.contains("=> Ok(())") && !window.contains("verify_integrity_with_context")
        } else {
            false
        }
    }

    fn has_direct_ok_return_in_succinct(&self) -> bool {
        if let Some(idx) = self.content.find("Self::Succinct(inner)") {
            let window = &self.content[idx..std::cmp::min(idx + 150, self.content.len())];
            window.contains("=> Ok(())") && !window.contains("verify_integrity_with_context")
        } else {
            false
        }
    }

    fn has_direct_ok_return_in_groth16(&self) -> bool {
        if let Some(idx) = self.content.find("Self::Groth16(inner)") {
            let window = &self.content[idx..std::cmp::min(idx + 150, self.content.len())];
            window.contains("=> Ok(())") && !window.contains("verify_integrity_with_context")
        } else {
            false
        }
    }
}

/// Assessment result for receipt integrity validation
#[derive(Debug)]
pub struct AssessmentResult {
    pub has_function: bool,
    pub composite_check: bool,
    pub succinct_check: bool,
    pub groth16_check: bool,
    pub has_vulnerable_pattern: bool,
    pub total_checks: usize,
}

impl AssessmentResult {
    pub fn is_vulnerable(&self) -> bool {
        // Vulnerable if any check is missing OR vulnerable patterns are present
        !self.composite_check || !self.succinct_check || !self.groth16_check || self.has_vulnerable_pattern
    }

    pub fn is_fixed(&self) -> bool {
        // Fixed if all checks are present AND no vulnerable patterns
        self.composite_check && self.succinct_check && self.groth16_check && !self.has_vulnerable_pattern
    }

    pub fn classification(&self) -> &'static str {
        if self.is_fixed() {
            "FIXED"
        } else if self.total_checks == 0 {
            "VULNERABLE"
        } else if self.total_checks < 3 {
            "PARTIALLY_FIXED"
        } else {
            "UNKNOWN"
        }
    }
}

/// Perform comprehensive assessment of receipt integrity validation
pub fn assess_receipt_integrity<P: AsRef<Path>>(receipt_path: P) -> std::io::Result<AssessmentResult> {
    let matcher = IntegrityPatternMatcher::from_file(receipt_path)?;

    Ok(AssessmentResult {
        has_function: matcher.has_verify_integrity_function(),
        composite_check: matcher.has_composite_integrity_call(),
        succinct_check: matcher.has_succinct_integrity_call(),
        groth16_check: matcher.has_groth16_integrity_call(),
        has_vulnerable_pattern: matcher.has_vulnerable_pattern(),
        total_checks: matcher.count_integrity_patterns(),
    })
}

// ============================================================================
// HARNESS TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    fn get_receipt_path() -> String {
        SourcePaths::new().receipt_rs()
    }

    #[test]
    fn test_verify_integrity_function_presence() {
        println!("\n=== Test: verify_integrity_with_context Function Presence ===");

        let receipt_path = get_receipt_path();

        if let Ok(matcher) = IntegrityPatternMatcher::from_file(&receipt_path) {
            let has_function = matcher.has_verify_integrity_function();
            println!("✓ Successfully read receipt.rs");
            println!("Has verify_integrity_with_context function: {}", has_function);

            if has_function {
                println!("✓ Function exists (required for fix)");
            } else {
                println!("⚠ Function missing (may indicate very early version or different API)");
            }
        } else {
            println!("⚠ Could not read receipt.rs: {}", receipt_path);
            println!("  This is expected if sources haven't been cloned yet");
        }

        // Test always passes - informational only
    }

    #[test]
    fn test_composite_receipt_integrity_check() {
        println!("\n=== Test: Composite Receipt Integrity Check ===");

        let receipt_path = get_receipt_path();

        if let Ok(matcher) = IntegrityPatternMatcher::from_file(&receipt_path) {
            let has_check = matcher.has_composite_integrity_call();
            println!("✓ Successfully read receipt.rs");
            println!("Composite receipt has integrity check: {}", has_check);

            if has_check {
                println!("✓ Fix present: Composite calls verify_integrity_with_context");
            } else {
                println!("⚠ Fix missing: Composite does NOT call verify_integrity_with_context");
            }
        } else {
            println!("⚠ Could not read receipt.rs: {}", receipt_path);
        }
    }

    #[test]
    fn test_succinct_receipt_integrity_check() {
        println!("\n=== Test: Succinct Receipt Integrity Check ===");

        let receipt_path = get_receipt_path();

        if let Ok(matcher) = IntegrityPatternMatcher::from_file(&receipt_path) {
            let has_check = matcher.has_succinct_integrity_call();
            println!("✓ Successfully read receipt.rs");
            println!("Succinct receipt has integrity check: {}", has_check);

            if has_check {
                println!("✓ Fix present: Succinct calls verify_integrity_with_context");
            } else {
                println!("⚠ Fix missing: Succinct does NOT call verify_integrity_with_context");
            }
        } else {
            println!("⚠ Could not read receipt.rs: {}", receipt_path);
        }
    }

    #[test]
    fn test_groth16_receipt_integrity_check() {
        println!("\n=== Test: Groth16 Receipt Integrity Check ===");

        let receipt_path = get_receipt_path();

        if let Ok(matcher) = IntegrityPatternMatcher::from_file(&receipt_path) {
            let has_check = matcher.has_groth16_integrity_call();
            println!("✓ Successfully read receipt.rs");
            println!("Groth16 receipt has integrity check: {}", has_check);

            if has_check {
                println!("✓ Fix present: Groth16 calls verify_integrity_with_context");
            } else {
                println!("⚠ Fix missing: Groth16 does NOT call verify_integrity_with_context");
            }
        } else {
            println!("⚠ Could not read receipt.rs: {}", receipt_path);
        }
    }

    #[test]
    fn test_vulnerable_pattern_detection() {
        println!("\n=== Test: Vulnerable Pattern Detection ===");

        let receipt_path = get_receipt_path();

        if let Ok(matcher) = IntegrityPatternMatcher::from_file(&receipt_path) {
            let has_vuln = matcher.has_vulnerable_pattern();
            println!("✓ Successfully read receipt.rs");
            println!("Has vulnerable patterns (direct Ok(()) without validation): {}", has_vuln);

            if has_vuln {
                println!("⚠ VULNERABLE: Found match arms returning Ok(()) without integrity checks");
            } else {
                println!("✓ SAFE: No vulnerable patterns detected");
            }
        } else {
            println!("⚠ Could not read receipt.rs: {}", receipt_path);
        }
    }

    #[test]
    fn test_all_receipt_types_coverage() {
        println!("\n=== Test: All Receipt Types Coverage ===");
        println!("Expected: 3 receipt types (Composite, Succinct, Groth16) should have integrity checks");

        let receipt_path = get_receipt_path();

        if let Ok(matcher) = IntegrityPatternMatcher::from_file(&receipt_path) {
            let count = matcher.count_integrity_patterns();
            println!("✓ Successfully read receipt.rs");
            println!("Integrity checks found: {}/3", count);

            println!("\nBreakdown:");
            println!("  Composite: {}", matcher.has_composite_integrity_call());
            println!("  Succinct: {}", matcher.has_succinct_integrity_call());
            println!("  Groth16: {}", matcher.has_groth16_integrity_call());

            if count == 3 {
                println!("✓ COMPLETE: All receipt types have integrity checks");
            } else if count > 0 {
                println!("⚠ PARTIAL: Only {}/3 receipt types have integrity checks", count);
            } else {
                println!("⚠ VULNERABLE: No integrity checks found");
            }
        } else {
            println!("⚠ Could not read receipt.rs: {}", receipt_path);
        }
    }

    #[test]
    fn test_overall_assessment() {
        println!("\n=== Test: Overall Receipt Integrity Assessment ===");

        let receipt_path = get_receipt_path();

        match assess_receipt_integrity(&receipt_path) {
            Ok(result) => {
                println!("✓ Successfully assessed receipt.rs");
                println!("\n=== Assessment Results ===");
                println!("Has verify_integrity_with_context function: {}", result.has_function);
                println!("Composite check present: {}", result.composite_check);
                println!("Succinct check present: {}", result.succinct_check);
                println!("Groth16 check present: {}", result.groth16_check);
                println!("Has vulnerable patterns: {}", result.has_vulnerable_pattern);
                println!("Total integrity checks: {}/3", result.total_checks);
                println!("\nClassification: {}", result.classification());

                if result.is_fixed() {
                    println!("✅ FIXED: All integrity checks present, no vulnerable patterns");
                } else if result.is_vulnerable() {
                    println!("⚠ VULNERABLE: Missing integrity checks or vulnerable patterns present");
                }
            }
            Err(e) => {
                println!("⚠ Could not read receipt.rs: {}", e);
                println!("  This is expected if sources haven't been cloned yet");
            }
        }
    }

    #[test]
    fn test_verifier_context_usage() {
        println!("\n=== Test: VerifierContext Usage ===");

        let receipt_path = get_receipt_path();

        if let Ok(matcher) = IntegrityPatternMatcher::from_file(&receipt_path) {
            let has_context = matcher.has_verifier_context();
            println!("✓ Successfully read receipt.rs");
            println!("Uses VerifierContext: {}", has_context);

            if has_context {
                println!("✓ VerifierContext is used (enables aggregation set validation)");
            } else {
                println!("⚠ VerifierContext not detected (may be missing or different API)");
            }
        } else {
            println!("⚠ Could not read receipt.rs: {}", receipt_path);
        }
    }

    #[test]
    fn test_differential_analysis() {
        println!("\n=== Test: Differential Pattern Analysis ===");
        println!("\nExpected patterns in VULNERABLE commit (2b50e65):");
        println!("  - verify_integrity_with_context function exists");
        println!("  - match arms return Ok(()) WITHOUT calling inner.verify_integrity_with_context");
        println!("  - Composite: Self::Composite(inner) => Ok(())");
        println!("  - Succinct: Self::Succinct(inner) => Ok(())");
        println!("  - Groth16: Self::Groth16(inner) => Ok(())");

        println!("\nExpected patterns in FIXED commit (0948e2f):");
        println!("  - verify_integrity_with_context function exists");
        println!("  - match arms call inner.verify_integrity_with_context(ctx)");
        println!("  - Composite: Self::Composite(inner) => inner.verify_integrity_with_context(ctx)");
        println!("  - Succinct: Self::Succinct(inner) => inner.verify_integrity_with_context(ctx)");
        println!("  - Groth16: Self::Groth16(inner) => inner.verify_integrity_with_context(ctx)");

        let receipt_path = get_receipt_path();

        if Path::new(&receipt_path).exists() {
            println!("\n⚠ Cannot perform differential analysis without commit checkout");
            println!("  To run differential analysis:");
            println!("  1. Checkout vulnerable commit: git checkout 2b50e65cb1a6aba413c24d89fea6bac7eb0f422c");
            println!("  2. Run harness tests (should detect vulnerable patterns)");
            println!("  3. Checkout fixed commit: git checkout 0948e2f780aba50861c95437cf54db420ffb5ad5");
            println!("  4. Run harness tests (should detect fix patterns)");
        } else {
            println!("\n⚠ receipt.rs not found - sources not cloned yet");
        }
    }

    #[test]
    fn test_receipt_types_documentation() {
        println!("\n=== Receipt Types Affected by Bug ===");
        println!("RISC0 has 4 receipt types:");
        println!("  1. Composite Receipt - vector of ZK-STARKs (one per segment)");
        println!("  2. Succinct Receipt - single ZK-STARK (aggregated proof)");
        println!("  3. Groth16 Receipt - single Groth16 proof (most compact)");
        println!("  4. Fake Receipt - no proof (dev mode only)");
        println!("\nVulnerability Impact:");
        println!("  ✓ Composite, Succinct, Groth16 all need integrity checks");
        println!("  ✓ Fake receipts don't need checks (no cryptographic proof)");
        println!("\nWhat verify_integrity_with_context Does:");
        println!("  - Validates aggregation set Merkle tree");
        println!("  - Ensures receipt claims match proof structure");
        println!("  - Prevents forged receipts from passing verification");
    }

    #[test]
    fn test_source_file_accessibility() {
        println!("\n=== Test: Source File Accessibility ===");

        let paths = SourcePaths::new();
        let receipt_path = paths.receipt_rs();
        let claim_path = paths.receipt_claim_rs();

        println!("Checking source file paths:");
        println!("  receipt.rs: {}", receipt_path);
        println!("  receipt_claim.rs: {}", claim_path);

        if Path::new(&receipt_path).exists() {
            println!("✓ receipt.rs is accessible");
        } else {
            println!("⚠ receipt.rs not found (sources not cloned)");
        }

        if Path::new(&claim_path).exists() {
            println!("✓ receipt_claim.rs is accessible");
        } else {
            println!("⚠ receipt_claim.rs not found (sources not cloned)");
        }

        println!("\nTo clone sources: cd .. && ./zkbugs_get_sources.sh");
    }

    #[test]
    fn test_fix_commit_characteristics() {
        println!("\n=== Fix Commit Characteristics ===");
        println!("Commit: 0948e2f780aba50861c95437cf54db420ffb5ad5");
        println!("Title: 'Support wider range of client/server use cases (#2357)'");
        println!("Released in: v1.1.1");
        println!("\nKey Changes:");
        println!("  + Added inner.verify_integrity_with_context(ctx) calls");
        println!("  + For Composite, Succinct, and Groth16 receipt types");
        println!("  + Ensures aggregation set validation happens");
        println!("\nSecurity Impact:");
        println!("  - Before: Receipts could be forged (aggregation set not validated)");
        println!("  - After: All receipt types properly validate aggregation set");
        println!("  - Severity: CRITICAL (allows proof forgery)");
    }
}


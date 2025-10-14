// Unit Tests for RISC0 Composite Receipt Integrity Validation
// Bug: GHSA-5c79-r6x7-3jx9 - Missing verify_integrity_with_context calls
//
// Vulnerability: Prior to v1.1.1, the Receipt enum did not call verify_integrity_with_context
// for all receipt types (Composite, Succinct, Groth16), allowing forged receipts to pass validation.
//
// Fix: Added verify_integrity_with_context calls for each receipt variant
//
// Commits:
//   Vulnerable: 2b50e65cb1a6aba413c24d89fea6bac7eb0f422c
//   Fixed:      0948e2f780aba50861c95437cf54db420ffb5ad5

use std::path::Path;

/// Represents the different types of receipts in RISC0
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ReceiptKind {
    Composite,
    Succinct,
    Groth16,
    Fake,
}

impl ReceiptKind {
    pub fn all_real() -> Vec<ReceiptKind> {
        vec![
            ReceiptKind::Composite,
            ReceiptKind::Succinct,
            ReceiptKind::Groth16,
        ]
    }

    pub fn as_str(&self) -> &'static str {
        match self {
            ReceiptKind::Composite => "Composite",
            ReceiptKind::Succinct => "Succinct",
            ReceiptKind::Groth16 => "Groth16",
            ReceiptKind::Fake => "Fake",
        }
    }
}

/// Analysis result for a receipt type's integrity validation
#[derive(Debug)]
pub struct IntegrityCheckResult {
    pub kind: ReceiptKind,
    pub has_verify_call: bool,
    pub has_context_param: bool,
    pub pattern_matched: bool,
}

impl IntegrityCheckResult {
    pub fn is_vulnerable(&self) -> bool {
        // Vulnerable if verify_integrity_with_context is NOT called
        !self.has_verify_call
    }

    pub fn is_fixed(&self) -> bool {
        // Fixed if verify_integrity_with_context IS called with context parameter
        self.has_verify_call && self.has_context_param
    }
}

/// Static analyzer for receipt.rs to detect integrity check patterns
pub struct ReceiptIntegrityAnalyzer {
    source_code: String,
}

impl ReceiptIntegrityAnalyzer {
    pub fn from_file<P: AsRef<Path>>(path: P) -> std::io::Result<Self> {
        let source_code = std::fs::read_to_string(path)?;
        Ok(Self { source_code })
    }

    pub fn from_string(source_code: String) -> Self {
        Self { source_code }
    }

    /// Check if verify_integrity_with_context is called for a specific receipt kind
    pub fn check_integrity_call(&self, kind: ReceiptKind) -> IntegrityCheckResult {
        let kind_str = kind.as_str();
        
        // Pattern: Self::Kind(inner) => inner.verify_integrity_with_context(ctx)
        let expected_pattern = format!(
            "Self::{}(inner) => inner.verify_integrity_with_context(ctx)",
            kind_str
        );
        
        // More flexible pattern matching (handles whitespace variations)
        let has_verify_call = self.source_code.contains(&format!("Self::{}(inner)", kind_str))
            && self.source_code.contains("verify_integrity_with_context")
            && self.has_verify_in_match_arm(kind_str);
        
        let has_context_param = has_verify_call && self.source_code.contains("verify_integrity_with_context(ctx)");
        
        let pattern_matched = self.source_code.contains(&expected_pattern);

        IntegrityCheckResult {
            kind,
            has_verify_call,
            has_context_param,
            pattern_matched,
        }
    }

    /// Check if verify_integrity_with_context appears in the match arm for this receipt kind
    fn has_verify_in_match_arm(&self, kind_str: &str) -> bool {
        // Find the match arm for this receipt kind
        let match_arm_start = format!("Self::{}(inner)", kind_str);
        
        if let Some(start_idx) = self.source_code.find(&match_arm_start) {
            // Look for verify_integrity_with_context in the next ~250 chars
            // (enough to cover the match arm but not leak into next arm)
            let search_end = std::cmp::min(start_idx + 250, self.source_code.len());
            let search_window = &self.source_code[start_idx..search_end];
            
            // Check if verify_integrity_with_context appears
            if let Some(verify_idx) = search_window.find("verify_integrity_with_context") {
                // Check if inner is used (not just a direct Ok(()))
                let has_inner = search_window[..verify_idx].contains("inner.");
                
                // Make sure verify call comes before any "Self::" (next match arm)
                // Look for next Self:: after our match arm start
                let remaining = &search_window[match_arm_start.len()..];
                if let Some(next_self) = remaining.find("Self::") {
                    // verify_idx is relative to search_window, next_self is relative to remaining
                    // So we need to adjust
                    let next_self_abs = match_arm_start.len() + next_self;
                    verify_idx < next_self_abs && has_inner
                } else {
                    // No next match arm found, so verify is in our arm
                    has_inner
                }
            } else {
                false
            }
        } else {
            false
        }
    }

    /// Check all receipt kinds and return results
    pub fn check_all_kinds(&self) -> Vec<IntegrityCheckResult> {
        ReceiptKind::all_real()
            .into_iter()
            .map(|kind| self.check_integrity_call(kind))
            .collect()
    }

    /// Check if the source is vulnerable (missing any integrity calls)
    pub fn is_vulnerable(&self) -> bool {
        self.check_all_kinds().iter().any(|result| result.is_vulnerable())
    }

    /// Check if the source is fixed (all integrity calls present)
    pub fn is_fixed(&self) -> bool {
        self.check_all_kinds().iter().all(|result| result.is_fixed())
    }

    /// Count how many receipt kinds have integrity checks
    pub fn count_integrity_checks(&self) -> usize {
        self.check_all_kinds()
            .iter()
            .filter(|result| result.is_fixed())
            .count()
    }
}

/// Differential oracle: compares vulnerable vs fixed implementations
pub fn oracle_receipt_integrity_validation(source_code: &str) -> bool {
    let analyzer = ReceiptIntegrityAnalyzer::from_string(source_code.to_string());
    
    // Returns true if vulnerability is present (missing integrity checks)
    analyzer.is_vulnerable()
}

// ============================================================================
// UNIT TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    // Test helper: create mock vulnerable source
    fn mock_vulnerable_source() -> String {
        r#"
        impl Receipt {
            pub fn verify_integrity_with_context(&self, ctx: &VerifierContext) -> Result<()> {
                match self {
                    Self::Composite(inner) => Ok(()), // BUG: no integrity check
                    Self::Succinct(inner) => Ok(()),   // BUG: no integrity check
                    Self::Groth16(inner) => Ok(()),    // BUG: no integrity check
                    Self::Fake => Ok(()),
                }
            }
        }
        "#.to_string()
    }

    // Test helper: create mock fixed source
    fn mock_fixed_source() -> String {
        r#"
        impl Receipt {
            pub fn verify_integrity_with_context(&self, ctx: &VerifierContext) -> Result<()> {
                match self {
                    Self::Composite(inner) => inner.verify_integrity_with_context(ctx),
                    Self::Succinct(inner) => inner.verify_integrity_with_context(ctx),
                    Self::Groth16(inner) => inner.verify_integrity_with_context(ctx),
                    Self::Fake => Ok(()),
                }
            }
        }
        "#.to_string()
    }

    #[test]
    fn test_vulnerable_missing_integrity_checks() {
        println!("\n=== Test: Vulnerable Source (Missing Integrity Checks) ===");
        
        let analyzer = ReceiptIntegrityAnalyzer::from_string(mock_vulnerable_source());
        
        // Check each receipt kind
        for kind in ReceiptKind::all_real() {
            let result = analyzer.check_integrity_call(kind);
            println!("{:?}: has_verify={}, is_vulnerable={}", 
                     kind, result.has_verify_call, result.is_vulnerable());
            
            // In vulnerable version, integrity checks are missing
            assert!(result.is_vulnerable(), 
                    "Expected {:?} to be vulnerable (missing verify_integrity_with_context)", kind);
        }
        
        // Overall assessment
        assert!(analyzer.is_vulnerable(), "Expected source to be vulnerable");
        assert_eq!(analyzer.count_integrity_checks(), 0, "Expected 0 integrity checks");
        
        println!("✓ Vulnerability confirmed: All receipt types missing integrity checks");
    }

    #[test]
    fn test_fixed_has_integrity_checks() {
        println!("\n=== Test: Fixed Source (Has Integrity Checks) ===");
        
        let analyzer = ReceiptIntegrityAnalyzer::from_string(mock_fixed_source());
        
        // Check each receipt kind
        for kind in ReceiptKind::all_real() {
            let result = analyzer.check_integrity_call(kind);
            println!("{:?}: has_verify={}, is_fixed={}", 
                     kind, result.has_verify_call, result.is_fixed());
            
            // In fixed version, integrity checks are present
            assert!(result.is_fixed(), 
                    "Expected {:?} to be fixed (has verify_integrity_with_context)", kind);
        }
        
        // Overall assessment
        assert!(!analyzer.is_vulnerable(), "Expected source to NOT be vulnerable");
        assert!(analyzer.is_fixed(), "Expected source to be fixed");
        assert_eq!(analyzer.count_integrity_checks(), 3, "Expected 3 integrity checks");
        
        println!("✓ Fix confirmed: All receipt types have integrity checks");
    }

    #[test]
    fn test_composite_receipt_integrity_call() {
        println!("\n=== Test: Composite Receipt Integrity Call ===");
        
        let fixed_analyzer = ReceiptIntegrityAnalyzer::from_string(mock_fixed_source());
        let vuln_analyzer = ReceiptIntegrityAnalyzer::from_string(mock_vulnerable_source());
        
        let fixed_result = fixed_analyzer.check_integrity_call(ReceiptKind::Composite);
        let vuln_result = vuln_analyzer.check_integrity_call(ReceiptKind::Composite);
        
        println!("Fixed: has_verify={}, is_fixed={}", 
                 fixed_result.has_verify_call, fixed_result.is_fixed());
        println!("Vulnerable: has_verify={}, is_vulnerable={}", 
                 vuln_result.has_verify_call, vuln_result.is_vulnerable());
        
        assert!(fixed_result.is_fixed(), "Fixed version should have Composite integrity check");
        assert!(vuln_result.is_vulnerable(), "Vulnerable version should lack Composite integrity check");
        
        println!("✓ Composite receipt: Fix detected");
    }

    #[test]
    fn test_succinct_receipt_integrity_call() {
        println!("\n=== Test: Succinct Receipt Integrity Call ===");
        
        let fixed_analyzer = ReceiptIntegrityAnalyzer::from_string(mock_fixed_source());
        let vuln_analyzer = ReceiptIntegrityAnalyzer::from_string(mock_vulnerable_source());
        
        let fixed_result = fixed_analyzer.check_integrity_call(ReceiptKind::Succinct);
        let vuln_result = vuln_analyzer.check_integrity_call(ReceiptKind::Succinct);
        
        println!("Fixed: has_verify={}, is_fixed={}", 
                 fixed_result.has_verify_call, fixed_result.is_fixed());
        println!("Vulnerable: has_verify={}, is_vulnerable={}", 
                 vuln_result.has_verify_call, vuln_result.is_vulnerable());
        
        assert!(fixed_result.is_fixed(), "Fixed version should have Succinct integrity check");
        assert!(vuln_result.is_vulnerable(), "Vulnerable version should lack Succinct integrity check");
        
        println!("✓ Succinct receipt: Fix detected");
    }

    #[test]
    fn test_groth16_receipt_integrity_call() {
        println!("\n=== Test: Groth16 Receipt Integrity Call ===");
        
        let fixed_analyzer = ReceiptIntegrityAnalyzer::from_string(mock_fixed_source());
        let vuln_analyzer = ReceiptIntegrityAnalyzer::from_string(mock_vulnerable_source());
        
        let fixed_result = fixed_analyzer.check_integrity_call(ReceiptKind::Groth16);
        let vuln_result = vuln_analyzer.check_integrity_call(ReceiptKind::Groth16);
        
        println!("Fixed: has_verify={}, is_fixed={}", 
                 fixed_result.has_verify_call, fixed_result.is_fixed());
        println!("Vulnerable: has_verify={}, is_vulnerable={}", 
                 vuln_result.has_verify_call, vuln_result.is_vulnerable());
        
        assert!(fixed_result.is_fixed(), "Fixed version should have Groth16 integrity check");
        assert!(vuln_result.is_vulnerable(), "Vulnerable version should lack Groth16 integrity check");
        
        println!("✓ Groth16 receipt: Fix detected");
    }

    #[test]
    fn test_oracle_correctness() {
        println!("\n=== Test: Oracle Correctness ===");
        
        let vuln_source = mock_vulnerable_source();
        let fixed_source = mock_fixed_source();
        
        let vuln_oracle = oracle_receipt_integrity_validation(&vuln_source);
        let fixed_oracle = oracle_receipt_integrity_validation(&fixed_source);
        
        println!("Vulnerable oracle result: {} (true = vuln)", vuln_oracle);
        println!("Fixed oracle result: {} (false = fixed)", fixed_oracle);
        
        assert!(vuln_oracle, "Oracle should return true for vulnerable source");
        assert!(!fixed_oracle, "Oracle should return false for fixed source");
        
        println!("✓ Oracle correctly distinguishes vulnerable vs fixed");
    }

    #[test]
    fn test_partial_fix_detection() {
        println!("\n=== Test: Partial Fix Detection ===");
        
        // Only Composite and Succinct have integrity checks, Groth16 is missing
        let partial_fix = r#"
        impl Receipt {
            pub fn verify_integrity_with_context(&self, ctx: &VerifierContext) -> Result<()> {
                match self {
                    Self::Composite(inner) => inner.verify_integrity_with_context(ctx),
                    Self::Succinct(inner) => inner.verify_integrity_with_context(ctx),
                    Self::Groth16(inner) => Ok(()),  // BUG: Still missing!
                    Self::Fake => Ok(()),
                }
            }
        }
        "#.to_string();
        
        let analyzer = ReceiptIntegrityAnalyzer::from_string(partial_fix);
        
        let composite = analyzer.check_integrity_call(ReceiptKind::Composite);
        let succinct = analyzer.check_integrity_call(ReceiptKind::Succinct);
        let groth16 = analyzer.check_integrity_call(ReceiptKind::Groth16);
        
        println!("Composite: is_fixed={}", composite.is_fixed());
        println!("Succinct: is_fixed={}", succinct.is_fixed());
        println!("Groth16: is_vulnerable={}", groth16.is_vulnerable());
        
        assert!(composite.is_fixed(), "Composite should be fixed");
        assert!(succinct.is_fixed(), "Succinct should be fixed");
        assert!(groth16.is_vulnerable(), "Groth16 should still be vulnerable");
        
        // Overall: still vulnerable because not all checks are present
        assert!(analyzer.is_vulnerable(), "Partial fix should still be considered vulnerable");
        assert_eq!(analyzer.count_integrity_checks(), 2, "Should have 2 out of 3 checks");
        
        println!("✓ Partial fix correctly detected (2/3 checks present, still vulnerable)");
    }

    #[test]
    fn test_real_source_if_available() {
        println!("\n=== Test: Real Source File (if available) ===");
        
        let receipt_path = "../sources/risc0/zkvm/src/receipt.rs";
        
        if Path::new(receipt_path).exists() {
            match ReceiptIntegrityAnalyzer::from_file(receipt_path) {
                Ok(analyzer) => {
                    println!("✓ Successfully read real receipt.rs");
                    
                    let results = analyzer.check_all_kinds();
                    for result in &results {
                        println!("{:?}: has_verify={}, is_fixed={}", 
                                 result.kind, result.has_verify_call, result.is_fixed());
                    }
                    
                    let check_count = analyzer.count_integrity_checks();
                    println!("Integrity checks found: {}/3", check_count);
                    
                    // Don't assert on the result since we don't know which commit is checked out
                    // Just report the findings
                    if analyzer.is_vulnerable() {
                        println!("⚠ Source appears to be VULNERABLE (missing integrity checks)");
                    } else if analyzer.is_fixed() {
                        println!("✓ Source appears to be FIXED (all integrity checks present)");
                    }
                }
                Err(e) => {
                    println!("⚠ Could not read receipt.rs: {}", e);
                    println!("  This is expected if sources haven't been cloned yet");
                }
            }
        } else {
            println!("⚠ receipt.rs not found at {}", receipt_path);
            println!("  This is expected if sources haven't been cloned yet");
            println!("  Run ../zkbugs_get_sources.sh to clone the sources");
        }
        
        // Test always passes - it's informational only
    }

    #[test]
    fn test_integrity_check_coverage() {
        println!("\n=== Test: Integrity Check Coverage ===");
        
        let fixed_analyzer = ReceiptIntegrityAnalyzer::from_string(mock_fixed_source());
        let vuln_analyzer = ReceiptIntegrityAnalyzer::from_string(mock_vulnerable_source());
        
        let all_kinds = ReceiptKind::all_real();
        
        println!("Total receipt kinds to check: {}", all_kinds.len());
        println!("Fixed version coverage: {}/{}", fixed_analyzer.count_integrity_checks(), all_kinds.len());
        println!("Vulnerable version coverage: {}/{}", vuln_analyzer.count_integrity_checks(), all_kinds.len());
        
        assert_eq!(fixed_analyzer.count_integrity_checks(), all_kinds.len(), 
                   "Fixed version should have checks for all receipt kinds");
        assert_eq!(vuln_analyzer.count_integrity_checks(), 0, 
                   "Vulnerable version should have 0 checks");
        
        println!("✓ Coverage test passed");
    }
}


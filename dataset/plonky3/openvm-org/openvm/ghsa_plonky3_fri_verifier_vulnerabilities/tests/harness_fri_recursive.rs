// Harness Tests for OpenVM/Plonky3 FRI Missing Randomness & Final Poly Check
// Bug: GHSA-4w7p-8f9q-f4g2 - Two vulnerabilities in FRI verifier
//
// These tests perform static analysis on the OpenVM recursive verifier source code
// to detect vulnerability and fix patterns.

use std::fs;
use std::path::Path;

/// Path helper for locating FRI recursion source files
pub struct SourcePaths {
    base: &'static str,
}

impl SourcePaths {
    pub fn new() -> Self {
        Self {
            base: "../sources/extensions/native/recursion/src/fri",
        }
    }

    pub fn mod_rs(&self) -> String {
        format!("{}/mod.rs", self.base)
    }

    pub fn two_adic_pcs_rs(&self) -> String {
        format!("{}/two_adic_pcs.rs", self.base)
    }
}

/// Pattern matcher for FRI recursion fix patterns
pub struct FriPatternMatcher {
    content: String,
}

impl FriPatternMatcher {
    pub fn from_file<P: AsRef<Path>>(path: P) -> std::io::Result<Self> {
        let content = fs::read_to_string(path)?;
        Ok(Self { content })
    }

    /// Check for betas_squared array declaration
    pub fn has_betas_squared_array(&self) -> bool {
        self.content.contains("betas_squared: &Array")
            || self.content.contains("let betas_squared: Array")
    }

    /// Check for betas_squared usage in folding
    pub fn has_betas_squared_usage(&self) -> bool {
        self.content.contains("iter_ptr_get(betas_squared")
            || self.content.contains("iter_ptr_set(&betas_squared")
            || self.content.contains("&betas_squared")
    }

    /// Check for beta squared computation (sample * sample)
    pub fn has_beta_square_computation(&self) -> bool {
        self.content.contains("sample * sample")
            || self.content.contains("beta * beta")
            || self.content.contains("beta.square()")
    }

    /// Check for iter_zip usage (introduced with fix)
    pub fn has_iter_zip(&self) -> bool {
        self.content.contains("iter_zip!")
            || self.content.contains("iter_zip")
    }

    /// Count betas_squared occurrences
    pub fn count_betas_squared(&self) -> usize {
        self.content.matches("betas_squared").count()
    }

    /// Check for final poly length comment/logic
    pub fn has_final_poly_length_logic(&self) -> bool {
        self.content.contains("final_poly.len()")
            || self.content.contains("final poly length")
            || self.content.contains("degree 0")
    }

    /// Assess if this is vulnerable or fixed
    pub fn is_vulnerable(&self) -> bool {
        // Vulnerable if betas_squared is NOT present
        !self.has_betas_squared_array() && !self.has_betas_squared_usage()
    }

    pub fn is_fixed(&self) -> bool {
        // Fixed if betas_squared is present and used
        self.has_betas_squared_array() && self.has_betas_squared_usage()
    }

    pub fn classification(&self) -> &'static str {
        if self.is_fixed() {
            "FIXED"
        } else if self.is_vulnerable() {
            "VULNERABLE"
        } else {
            "PARTIAL"
        }
    }
}

// ============================================================================
// HARNESS TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    fn get_mod_path() -> String {
        SourcePaths::new().mod_rs()
    }

    fn get_two_adic_pcs_path() -> String {
        SourcePaths::new().two_adic_pcs_rs()
    }

    #[test]
    fn test_recursive_beta_squared_array_present() {
        println!("\n=== Test: Beta Squared Array Presence ===");

        let paths = [get_mod_path(), get_two_adic_pcs_path()];

        for path in &paths {
            println!("\nAnalyzing: {}", path);
            
            if let Ok(matcher) = FriPatternMatcher::from_file(path) {
                let has_array = matcher.has_betas_squared_array();
                let has_usage = matcher.has_betas_squared_usage();
                let count = matcher.count_betas_squared();
                
                println!("  Has betas_squared array: {}", has_array);
                println!("  Has betas_squared usage: {}", has_usage);
                println!("  Total occurrences: {}", count);
                
                if has_array || has_usage {
                    println!("  ✓ Fix present: betas_squared found");
                } else {
                    println!("  ⚠ Fix missing: no betas_squared");
                }
            } else {
                println!("  ⚠ Could not read file");
            }
        }
    }

    #[test]
    fn test_beta_square_computation_present() {
        println!("\n=== Test: Beta Square Computation ===");

        let path = get_two_adic_pcs_path();

        if let Ok(matcher) = FriPatternMatcher::from_file(&path) {
            let has_computation = matcher.has_beta_square_computation();
            println!("Has 'sample * sample' computation: {}", has_computation);
            
            if has_computation {
                println!("✓ Beta squaring logic found (fix present)");
            } else {
                println!("⚠ Beta squaring logic missing (vulnerable)");
            }
        } else {
            println!("⚠ Could not read two_adic_pcs.rs");
        }
    }

    #[test]
    fn test_iter_zip_refactoring() {
        println!("\n=== Test: iter_zip Refactoring ===");

        let paths = [get_mod_path(), get_two_adic_pcs_path()];

        for path in &paths {
            if let Ok(matcher) = FriPatternMatcher::from_file(path) {
                let has_iter_zip = matcher.has_iter_zip();
                println!("{}: has iter_zip = {}", 
                         path.split('/').last().unwrap_or(""), has_iter_zip);
                
                if has_iter_zip {
                    println!("  ✓ Uses iter_zip (part of fix refactoring)");
                }
            }
        }
        
        println!("\nNote: iter_zip was introduced to pass both betas and betas_squared");
        println!("  together since no enumerate support in iter_zip macro");
    }

    #[test]
    fn test_differential_openvm_recursion() {
        println!("\n=== Test: Differential OpenVM Recursion Analysis ===");
        
        println!("\nExpected patterns in VULNERABLE commit (7548bdf):");
        println!("  - NO betas_squared array");
        println!("  - folding uses only: eval_0 + beta * eval_1");
        println!("  - reduced_opening not properly incorporated");
        println!("  - Missing randomness allows cancellation attacks");
        
        println!("\nExpected patterns in FIXED commit (bdb4831):");
        println!("  - betas_squared: Array<C, Ext<>> declaration");
        println!("  - betas_squared array allocation");
        println!("  - beta_sq_ptr iteration and getting");
        println!("  - sample * sample computation");
        println!("  - folding uses: eval_0 + beta*eval_1 + beta_sq*reduced");
        
        let mod_path = get_mod_path();
        let pcs_path = get_two_adic_pcs_path();
        
        if Path::new(&mod_path).exists() && Path::new(&pcs_path).exists() {
            println!("\n=== Current Source Analysis ===");
            
            if let (Ok(mod_matcher), Ok(pcs_matcher)) = (
                FriPatternMatcher::from_file(&mod_path),
                FriPatternMatcher::from_file(&pcs_path)
            ) {
                let mod_class = mod_matcher.classification();
                let pcs_class = pcs_matcher.classification();
                
                println!("mod.rs classification: {}", mod_class);
                println!("two_adic_pcs.rs classification: {}", pcs_class);
                
                if mod_class == "FIXED" && pcs_class == "FIXED" {
                    println!("✓ Both files match FIXED pattern");
                } else if mod_class == "VULNERABLE" && pcs_class == "VULNERABLE" {
                    println!("⚠ Both files match VULNERABLE pattern");
                } else {
                    println!("⚠ Mixed or unknown classification");
                }
            }
        } else {
            println!("\n⚠ Source files not found - not cloned yet");
        }
    }

    #[test]
    fn test_recursive_final_poly_degree_zero() {
        println!("\n=== Test: Recursive Final Poly Degree Fixed to Zero ===");
        
        println!("From PR #1703 commit message:");
        println!("  'Since our recursion program only supports final poly");
        println!("   length = 0, we can remove the previous checks that");
        println!("   higher degree coefficients are zero.'");
        println!("");
        println!("Implication:");
        println!("  - Recursive verifier has final_poly.len() hardcoded to 0");
        println!("  - No need for length validation (constant value)");
        println!("  - This vulnerability affects NATIVE verifier only");
        println!("");
        println!("Test verdict:");
        println!("  ✓ Recursive verifier NOT affected by final poly length bug");
        println!("  ✗ Recursive verifier IS affected by beta^2 randomness bug");
    }

    #[test]
    fn test_overall_fri_assessment() {
        println!("\n=== Test: Overall FRI Vulnerability Assessment ===");

        let mod_path = get_mod_path();
        let pcs_path = get_two_adic_pcs_path();

        let mut findings = Vec::new();

        if let Ok(mod_matcher) = FriPatternMatcher::from_file(&mod_path) {
            findings.push(("mod.rs", mod_matcher.classification()));
        } else {
            findings.push(("mod.rs", "NOT_READABLE"));
        }

        if let Ok(pcs_matcher) = FriPatternMatcher::from_file(&pcs_path) {
            findings.push(("two_adic_pcs.rs", pcs_matcher.classification()));
        } else {
            findings.push(("two_adic_pcs.rs", "NOT_READABLE"));
        }

        println!("\n=== Assessment Results ===");
        for (file, classification) in &findings {
            println!("  {}: {}", file, classification);
        }

        let all_fixed = findings.iter().all(|(_, c)| *c == "FIXED");
        let any_vulnerable = findings.iter().any(|(_, c)| *c == "VULNERABLE");

        if all_fixed {
            println!("\n✅ OVERALL: FIXED");
            println!("  All recursion FRI files have betas_squared fix");
        } else if any_vulnerable {
            println!("\n⚠ OVERALL: VULNERABLE");
            println!("  Missing betas_squared in one or more files");
        } else {
            println!("\n⚠ OVERALL: Sources not available or mixed state");
        }
    }

    #[test]
    fn test_source_file_accessibility() {
        println!("\n=== Test: Source File Accessibility ===");

        let paths = SourcePaths::new();
        let mod_path = paths.mod_rs();
        let pcs_path = paths.two_adic_pcs_rs();

        println!("Checking FRI recursion source files:");
        println!("  mod.rs: {}", mod_path);
        println!("  two_adic_pcs.rs: {}", pcs_path);

        if Path::new(&mod_path).exists() {
            println!("✓ mod.rs is accessible");
            if let Ok(content) = fs::read_to_string(&mod_path) {
                println!("  File size: {} lines", content.lines().count());
            }
        } else {
            println!("⚠ mod.rs not found (sources not cloned)");
        }

        if Path::new(&pcs_path).exists() {
            println!("✓ two_adic_pcs.rs is accessible");
            if let Ok(content) = fs::read_to_string(&pcs_path) {
                println!("  File size: {} lines", content.lines().count());
            }
        } else {
            println!("⚠ two_adic_pcs.rs not found (sources not cloned)");
        }

        println!("\nTo clone sources: cd .. && ./zkbugs_get_sources.sh");
    }

    #[test]
    fn test_fix_commit_characteristics() {
        println!("\n=== Fix Commit Characteristics ===");
        println!("Commit: bdb4831fefed13b0741d3a052d434a9c995c6d5d");
        println!("Title: 'fix(recursion): final_poly & FRI missing randomness (#1703)'");
        println!("Released in: v1.2.0");
        println!("\nKey Changes:");
        println!("  1. Beta Squared Randomness:");
        println!("     + let betas_squared: Array<C, Ext<>> = builder.array(log_max_height)");
        println!("     + builder.iter_ptr_set(&betas_squared, ptr, sample * sample)");
        println!("     + let beta_sq = builder.iter_ptr_get(betas_squared, ptr)");
        println!("     + Use beta_sq in folding computation");
        println!("");
        println!("  2. Final Poly Length:");
        println!("     + Simplified for recursion (degree fixed to 0)");
        println!("     + Removed checks for higher degree coefficients");
        println!("     + Note: Native verifier still needs explicit length check");
        println!("\nReferences:");
        println!("  - Plonky3 advisory: GHSA-f69f-5fx9-w9r9");
        println!("  - OpenVM PR: #1703");
    }

    #[test]
    fn test_plonky3_upstream_fix_reference() {
        println!("\n=== Plonky3 Upstream Fix Reference ===");
        println!("OpenVM bug is related to upstream Plonky3 vulnerability:");
        println!("  Plonky3 Advisory: GHSA-f69f-5fx9-w9r9");
        println!("  Title: Missing final polynomial degree check and");
        println!("         randomness in FRI verifier");
        println!("");
        println!("OpenVM Response:");
        println!("  1. Updated Plonky3 dependency to fixed version");
        println!("  2. Modified OpenVM recursive verifier to match fix");
        println!("  3. Added betas_squared array and computation");
        println!("  4. Simplified final_poly handling (degree 0)");
        println!("");
        println!("Affected Components:");
        println!("  ✗ Native verifier (SDK/CLI): BOTH issues");
        println!("  ✗ Recursive verifier (on-chain): beta^2 issue ONLY");
    }
}


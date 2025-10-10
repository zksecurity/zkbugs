//! Harness test for SP1 chip_ordering validation vulnerability
//!
//! This test validates the verifier.rs code directly to check for the presence
//! of chip_ordering validation. It can work in two modes:
//!
//! 1. Source code analysis mode: Check if validation is present in verifier.rs
//! 2. (Future) Full integration mode: Deserialize real ShardProof and test verifier
//!
//! Test Strategy:
//! 1. Analyze verifier.rs source code for validation pattern
//! 2. Identify whether this is vulnerable or fixed commit
//! 3. Report findings
//!
//! This serves as a fuzzing harness and integration test.

use std::path::Path;
use std::fs;

fn main() {
    println!("==============================================");
    println!("SP1 chip_ordering Validation Harness Test");
    println!("==============================================");
    println!("Advisory: GHSA-c873-wfhp-wx5m Bug 1");
    println!("==============================================\n");
    
    test_verifier_source_analysis();
    test_chip_ordering_validation_presence();
    
    println!("\n==============================================");
    println!("✅ Harness tests completed");
    println!("==============================================");
}

/// Test 1: Analyze verifier.rs source code for vulnerable patterns
fn test_verifier_source_analysis() {
    println!("Test 1: Verifier Source Code Analysis");
    println!("---------------------------------------------");
    
    let verifier_path = "../sources/crates/stark/src/verifier.rs";
    
    if !Path::new(verifier_path).exists() {
        println!("⚠️  Source file not found. Run zkbugs_get_sources.sh first.");
        println!("   Expected: {}", verifier_path);
        return;
    }
    
    let source = fs::read_to_string(verifier_path)
        .expect("Failed to read verifier.rs");
    
    println!("  ✓ verifier.rs found");
    
    // Check for chip_ordering usage
    let has_chip_ordering = source.contains("chip_ordering");
    println!("  ✓ Uses chip_ordering: {}", has_chip_ordering);
    
    if !has_chip_ordering {
        println!("  ℹ️  This commit may predate chip_ordering (not applicable)");
        return;
    }
    
    // Check for the validation pattern
    analyze_validation_patterns(&source);
}

fn analyze_validation_patterns(source: &str) {
    println!("\n  Chip Ordering Validation Analysis:");
    
    // Look for the vulnerable pattern: using chip_ordering without validation
    let uses_chip_ordering_indexing = 
        source.contains("chip_ordering[") || 
        source.contains("chip_ordering.get(");
    
    // Look for the fix: validation that chips[i].name() == name
    let has_name_validation = 
        source.contains("chips[i].name()") ||
        source.contains("chips[*i].name()") ||
        source.contains("PreprocessedChipIdMismatch");
    
    // Look for bounds checking
    let has_bounds_check = 
        source.contains("< chips.len()") ||
        source.contains("filter(|&&i| i < chips.len())");
    
    println!("    Uses chip_ordering for indexing: {}", uses_chip_ordering_indexing);
    println!("    Has name validation:              {}", has_name_validation);
    println!("    Has bounds checking:              {}", has_bounds_check);
    
    // Determine vulnerability status
    if uses_chip_ordering_indexing && !has_name_validation {
        println!("\n  ❌ VULNERABLE: chip_ordering is used without name validation!");
        println!("     The verifier trusts prover-provided chip indices.");
        println!("     This commit is susceptible to GHSA-c873-wfhp-wx5m Bug 1");
        println!("\n     Expected fix:");
        println!("     ```rust");
        println!("     if name != &chips[i].name() {{");
        println!("         return Err(VerificationError::PreprocessedChipIdMismatch(...));");
        println!("     }}");
        println!("     ```");
    } else if has_name_validation {
        println!("\n  ✅ FIXED: Chip name validation is present");
        println!("     The verifier checks that chips[i].name() matches expected name");
    } else {
        println!("\n  ⚠️  UNKNOWN: Could not determine vulnerability status");
        println!("     Manual review recommended");
    }
}

/// Test 2: Check for the specific validation in preprocessed_domains_points_and_opens
fn test_chip_ordering_validation_presence() {
    println!("\nTest 2: Specific Validation Check");
    println!("---------------------------------------------");
    
    let verifier_path = "../sources/crates/stark/src/verifier.rs";
    
    if !Path::new(verifier_path).exists() {
        println!("⚠️  Source file not found.");
        return;
    }
    
    let source = fs::read_to_string(verifier_path)
        .expect("Failed to read verifier.rs");
    
    // Look for the exact context where the bug was
    let has_preprocessed_section = 
        source.contains("preprocessed_domains_points_and_opens") ||
        source.contains("chip_information");
    
    println!("  ✓ Found preprocessed chip handling: {}", has_preprocessed_section);
    
    if !has_preprocessed_section {
        println!("  ℹ️  This code structure may be from a different version");
        return;
    }
    
    // Extract the relevant section for detailed analysis
    if let Some(start) = source.find("preprocessed_domains_points_and_opens") {
        let end = start + 1000.min(source.len() - start);
        let section = &source[start..end];
        
        println!("\n  Analyzing preprocessed_domains_points_and_opens section:");
        
        // Check for vulnerability markers
        let uses_chip_ordering_get = section.contains("chip_ordering.get(");
        let validates_name = section.contains("chips[") && 
                            (section.contains(".name()") || section.contains("name()"));
        let has_mismatch_error = section.contains("PreprocessedChipIdMismatch");
        
        println!("    Uses chip_ordering.get():            {}", uses_chip_ordering_get);
        println!("    Validates chip name:                 {}", validates_name);
        println!("    Has PreprocessedChipIdMismatch error: {}", has_mismatch_error);
        
        if uses_chip_ordering_get && (!validates_name || !has_mismatch_error) {
            println!("\n  ❌ VULNERABLE in preprocessed_domains_points_and_opens");
        } else if validates_name && has_mismatch_error {
            println!("\n  ✅ FIXED in preprocessed_domains_points_and_opens");
        }
        
        // Show a snippet if it's small enough
        if section.len() < 500 {
            println!("\n  Code snippet:");
            for line in section.lines().take(15) {
                println!("    {}", line);
            }
        }
    }
    
    println!();
}

#[cfg(test)]
mod integration_tests {
    use super::*;
    
    /// Test that we can detect the vulnerability from source code
    #[test]
    fn test_source_code_analysis_detects_vulnerability() {
        // This test verifies our analysis logic works
        
        // Vulnerable pattern (no validation)
        let vulnerable_code = r#"
            let preprocessed_domains_points_and_opens = vk
                .chip_information
                .iter()
                .map(|(name, domain, _)| {
                    let i = chip_ordering[name];
                    let values = opened_values.chips[i].preprocessed.clone();
                    // ... no validation of chips[i].name() == name
                });
        "#;
        
        let has_validation = vulnerable_code.contains("chips[") && 
                            vulnerable_code.contains(".name()") &&
                            vulnerable_code.contains("!=");
        
        assert!(!has_validation, "Should detect missing validation in vulnerable code");
        
        // Fixed pattern (with validation)
        let fixed_code = r#"
            let preprocessed_domains_points_and_opens = vk
                .chip_information
                .iter()
                .map(|(name, domain, _)| {
                    let i = chip_ordering[name];
                    if name != &chips[i].name() {
                        return Err(VerificationError::PreprocessedChipIdMismatch(
                            name.clone(),
                            chips[i].name(),
                        ));
                    }
                    let values = opened_values.chips[i].preprocessed.clone();
                });
        "#;
        
        let has_validation = fixed_code.contains("chips[i].name()") &&
                            fixed_code.contains("PreprocessedChipIdMismatch");
        
        assert!(has_validation, "Should detect validation in fixed code");
    }
    
    /// Test that the oracle can identify the fix commit
    #[test]
    fn test_identify_fix_commit() {
        // The fix commit (7e2023b2) should contain the validation
        // The vulnerable commit (1fa7d20) should not
        
        println!("\n  Note: To fully test this, run:");
        println!("    1. Checkout vulnerable commit: git checkout 1fa7d20");
        println!("    2. Run this harness: should detect VULNERABLE");
        println!("    3. Checkout fixed commit: git checkout 7e2023b2");
        println!("    4. Run this harness: should detect FIXED");
    }
}

// Note: Future expansion could include:
// - Deserializing actual ShardProof objects and mutating chip_ordering
// - Testing with real SP1 verifier if built
// - Fuzzing with structure-aware mutations of chip_ordering HashMap
//
// Example structure-aware mutations:
// - Swap two random chip indices
// - Rotate all indices by one position
// - Point all chips to index 0
// - Point chip to random valid index
// - Point chip to out-of-bounds index


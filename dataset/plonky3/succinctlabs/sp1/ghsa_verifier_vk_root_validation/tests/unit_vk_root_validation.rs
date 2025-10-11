//! Unit tests for SP1 vk_root validation vulnerability (GHSA-6248-228x-mmvh Bug 1)
//!
//! This test suite demonstrates the missing vk_root validation in SP1's Rust verifier.
//! The vulnerable version checks VK hashes via recursion_vk_map membership but does NOT
//! validate that the vk_root field in public values matches the expected vk_root.
//!
//! These tests use static analysis and require NO SP1 dependencies.

use std::path::Path;

/// Helper function to read source file content
fn read_verify_rs() -> Result<String, std::io::Error> {
    let verify_rs_path = "../sources/crates/prover/src/verify.rs";
    
    if !Path::new(verify_rs_path).exists() {
        return Err(std::io::Error::new(
            std::io::ErrorKind::NotFound,
            format!("Source file not found: {}\nRun zkbugs_get_sources.sh first.", verify_rs_path)
        ));
    }
    
    std::fs::read_to_string(verify_rs_path)
}

/// Helper function to read public values definition
fn read_public_values_rs() -> Result<String, std::io::Error> {
    let public_values_path = "../sources/crates/recursion/core/src/air/public_values.rs";
    
    if !Path::new(public_values_path).exists() {
        return Err(std::io::Error::new(
            std::io::ErrorKind::NotFound,
            format!("Source file not found: {}", public_values_path)
        ));
    }
    
    std::fs::read_to_string(public_values_path)
}

#[cfg(test)]
mod vk_root_validation_tests {
    use super::*;

    /// Test 1: Verify that verify_compressed does NOT check vk_root
    ///
    /// VULNERABLE: verify_compressed function exists but has no vk_root validation
    /// FIXED: verify_compressed checks public_values.vk_root != self.recursion_vk_root
    #[test]
    fn test_verify_compressed_missing_vk_root_check() {
        let source = match read_verify_rs() {
            Ok(s) => s,
            Err(e) => {
                println!("⚠️  {}", e);
                println!("   This test requires sources to be checked out.");
                return;
            }
        };

        // Verify the function exists
        let has_verify_compressed = source.contains("pub fn verify_compressed");
        assert!(has_verify_compressed, "verify_compressed function should exist");
        println!("✓ verify_compressed function exists");

        // Extract the function body (approximate)
        if let Some(start_idx) = source.find("pub fn verify_compressed") {
            // Find the next function or end of impl block (simple heuristic)
            let remaining = &source[start_idx..];
            let end_idx = remaining.find("\n    pub fn verify_shrink")
                .or_else(|| remaining.find("\n    pub fn verify_plonk"))
                .or_else(|| remaining.find("\n    fn verify_deferred"))
                .unwrap_or(remaining.len().min(5000));
            
            let function_body = &remaining[..end_idx];
            
            println!("\n--- Analyzing verify_compressed function ---");
            
            // Check for vk_root validation patterns
            let has_vk_root_check = function_body.contains("vk_root") && 
                (function_body.contains("recursion_vk_root") || 
                 function_body.contains("vk_root mismatch") ||
                 function_body.contains("vk_root ==") ||
                 function_body.contains("vk_root !="));
            
            // Check for what IS validated
            let checks_is_complete = function_body.contains("is_complete");
            let checks_sp1_vk_digest = function_body.contains("sp1_vk_digest");
            let checks_compress_vk_digest = function_body.contains("compress_vk_digest") || 
                                           function_body.contains("recursion_vkey_hash");
            
            println!("Checks performed:");
            println!("  ✓ is_complete:        {}", checks_is_complete);
            println!("  ✓ sp1_vk_digest:      {}", checks_sp1_vk_digest);
            println!("  ✓ compress_vk_digest: {}", checks_compress_vk_digest);
            println!("  ? vk_root:            {}", has_vk_root_check);
            
            if !has_vk_root_check {
                println!("\n❌ VULNERABILITY CONFIRMED: verify_compressed does NOT validate vk_root!");
                println!("   Commit: ad212dd52bdf8f630ea47f2b58aa94d5b6e79904");
                println!("   Advisory: GHSA-6248-228x-mmvh Bug 1");
            } else {
                println!("\n✅ FIXED: verify_compressed validates vk_root");
            }
            
            // For vulnerable version, this should be false
            assert!(!has_vk_root_check, 
                    "VULNERABLE: verify_compressed should NOT have vk_root validation at commit ad212dd5");
        } else {
            panic!("Could not find verify_compressed function");
        }
    }

    /// Test 2: Verify that verify_shrink does NOT check vk_root
    #[test]
    fn test_verify_shrink_missing_vk_root_check() {
        let source = match read_verify_rs() {
            Ok(s) => s,
            Err(e) => {
                println!("⚠️  {}", e);
                return;
            }
        };

        let has_verify_shrink = source.contains("pub fn verify_shrink");
        assert!(has_verify_shrink, "verify_shrink function should exist");
        println!("✓ verify_shrink function exists");

        // Extract function body
        if let Some(start_idx) = source.find("pub fn verify_shrink") {
            let remaining = &source[start_idx..];
            let end_idx = remaining.find("\n    pub fn verify_plonk")
                .or_else(|| remaining.find("\n    pub fn verify_groth16"))
                .or_else(|| remaining.find("\n    fn verify_"))
                .unwrap_or(remaining.len().min(5000));
            
            let function_body = &remaining[..end_idx];
            
            println!("\n--- Analyzing verify_shrink function ---");
            
            let has_vk_root_check = function_body.contains("vk_root") && 
                (function_body.contains("recursion_vk_root") || 
                 function_body.contains("vk_root mismatch"));
            
            let checks_is_complete = function_body.contains("is_complete");
            let checks_recursion_vkey = function_body.contains("recursion_vkey_hash");
            
            println!("Checks performed:");
            println!("  ✓ is_complete:         {}", checks_is_complete);
            println!("  ✓ recursion_vkey_hash: {}", checks_recursion_vkey);
            println!("  ? vk_root:             {}", has_vk_root_check);
            
            if !has_vk_root_check {
                println!("\n❌ VULNERABILITY CONFIRMED: verify_shrink does NOT validate vk_root!");
            } else {
                println!("\n✅ FIXED: verify_shrink validates vk_root");
            }
            
            assert!(!has_vk_root_check, 
                    "VULNERABLE: verify_shrink should NOT have vk_root validation at commit ad212dd5");
        }
    }

    /// Test 3: Verify that verify_deferred_proof does NOT check vk_root
    #[test]
    fn test_verify_deferred_proof_missing_vk_root_check() {
        let source = match read_verify_rs() {
            Ok(s) => s,
            Err(e) => {
                println!("⚠️  {}", e);
                return;
            }
        };

        let has_verify_deferred = source.contains("fn verify_deferred_proof");
        assert!(has_verify_deferred, "verify_deferred_proof function should exist");
        println!("✓ verify_deferred_proof function exists");

        // This function typically calls verify_compressed, so check if IT adds vk_root check
        if let Some(start_idx) = source.find("fn verify_deferred_proof") {
            let remaining = &source[start_idx..];
            // Find a reasonable end point - look for the next function or limit to 3000 chars
            let end_idx = remaining.find("\n    pub fn ")
                .or_else(|| remaining.find("\n    fn "))
                .unwrap_or(remaining.len())
                .min(3000);
            
            let function_body = &remaining[..end_idx];
            
            println!("\n--- Analyzing verify_deferred_proof function ---");
            
            let has_vk_root_check = function_body.contains("vk_root") && 
                (function_body.contains("recursion_vk_root") || 
                 function_body.contains("vk_root mismatch"));
            
            let delegates_to_verify_compressed = function_body.contains("self.verify_compressed");
            
            println!("Function behavior:");
            println!("  Delegates to verify_compressed: {}", delegates_to_verify_compressed);
            println!("  Has own vk_root check:          {}", has_vk_root_check);
            
            if !has_vk_root_check {
                println!("\n❌ VULNERABILITY: verify_deferred_proof does NOT validate vk_root!");
                if delegates_to_verify_compressed {
                    println!("   (Delegates to verify_compressed which also lacks the check)");
                }
            } else {
                println!("\n✅ FIXED: verify_deferred_proof validates vk_root");
            }
            
            assert!(!has_vk_root_check, 
                    "VULNERABLE: verify_deferred_proof should NOT have vk_root validation at commit ad212dd5");
        }
    }

    /// Test 4: Global grep test - confirm NO vk_root validation anywhere in verify.rs
    #[test]
    fn test_no_vk_root_validation_in_verify_rs() {
        let source = match read_verify_rs() {
            Ok(s) => s,
            Err(e) => {
                println!("⚠️  {}", e);
                return;
            }
        };

        println!("\n--- Global Analysis of verify.rs ---");
        
        // Count all occurrences of vk_root
        let vk_root_count = source.matches("vk_root").count();
        println!("Total 'vk_root' mentions: {}", vk_root_count);
        
        // Look for validation patterns
        let has_vk_root_equality_check = source.contains("vk_root ==") || source.contains("vk_root !=");
        let has_recursion_vk_root = source.contains("recursion_vk_root");
        let has_vk_root_mismatch_error = source.contains("vk_root mismatch");
        
        println!("Validation patterns:");
        println!("  vk_root equality check (== or !=): {}", has_vk_root_equality_check);
        println!("  recursion_vk_root reference:        {}", has_recursion_vk_root);
        println!("  'vk_root mismatch' error:           {}", has_vk_root_mismatch_error);
        
        let has_any_vk_root_validation = has_vk_root_equality_check || 
                                          has_recursion_vk_root || 
                                          has_vk_root_mismatch_error;
        
        if !has_any_vk_root_validation {
            println!("\n❌ VULNERABILITY CONFIRMED:");
            println!("   NO vk_root validation found in verify.rs!");
            println!("   Grep 'vk_root' returns {} matches (all likely comments or type defs)", vk_root_count);
        } else {
            println!("\n✅ FIXED: vk_root validation present in verify.rs");
        }
        
        // At vulnerable commit, should be 0
        assert_eq!(vk_root_count, 0, 
                   "VULNERABLE: verify.rs should have ZERO vk_root mentions at commit ad212dd5");
    }

    /// Test 5: Check RecursionPublicValues structure
    ///
    /// In vulnerable version, vk_root field may not even exist in the struct
    #[test]
    fn test_recursion_public_values_structure() {
        let source = match read_public_values_rs() {
            Ok(s) => s,
            Err(e) => {
                println!("⚠️  {}", e);
                println!("   Skipping RecursionPublicValues analysis");
                return;
            }
        };

        println!("\n--- Analyzing RecursionPublicValues struct ---");
        
        // Find the struct definition
        let has_struct = source.contains("pub struct RecursionPublicValues");
        assert!(has_struct, "RecursionPublicValues struct should exist");
        
        if let Some(start_idx) = source.find("pub struct RecursionPublicValues") {
            let remaining = &source[start_idx..];
            let end_idx = remaining.find("\n}\n").unwrap_or(remaining.len().min(3000));
            let struct_def = &remaining[..end_idx];
            
            // Check for vk_root field
            let has_vk_root_field = struct_def.contains("pub vk_root");
            
            println!("RecursionPublicValues fields:");
            println!("  has committed_value_digest: {}", struct_def.contains("committed_value_digest"));
            println!("  has deferred_proofs_digest: {}", struct_def.contains("deferred_proofs_digest"));
            println!("  has start_pc:               {}", struct_def.contains("start_pc"));
            println!("  has is_complete:            {}", struct_def.contains("is_complete"));
            println!("  has vk_root:                {}", has_vk_root_field);
            
            if !has_vk_root_field {
                println!("\n❌ VULNERABILITY: vk_root field does NOT exist in RecursionPublicValues!");
                println!("   This confirms the field was added as part of the fix.");
            } else {
                println!("\n✅ FIXED: vk_root field exists in RecursionPublicValues");
            }
            
            // At vulnerable commit, vk_root field likely doesn't exist yet
            // (If it does exist, that's also OK - the bug is that it's not VALIDATED)
            println!("\n   Note: The critical bug is the VALIDATION, not just field presence.");
        }
    }
}

#[cfg(test)]
mod static_analysis_tests {
    use super::*;

    /// Oracle function: Check if verify.rs contains vk_root validation
    ///
    /// Returns true if validation is present (FIXED)
    /// Returns false if validation is missing (VULNERABLE)
    pub fn oracle_has_vk_root_validation(verify_rs_content: &str) -> bool {
        // Multiple patterns that indicate proper validation
        let patterns = [
            "vk_root != self.recursion_vk_root",
            "public_values.vk_root != self.recursion_vk_root",
            "vk_root mismatch",
            "if public_values.vk_root ==",
        ];
        
        patterns.iter().any(|pattern| verify_rs_content.contains(pattern))
    }

    /// Test the oracle function
    #[test]
    fn test_vk_root_validation_oracle() {
        let source = match read_verify_rs() {
            Ok(s) => s,
            Err(e) => {
                println!("⚠️  {}", e);
                return;
            }
        };

        println!("\n--- Oracle Test: vk_root Validation Detection ---");
        
        let has_validation = oracle_has_vk_root_validation(&source);
        
        println!("Oracle result: {}", if has_validation { "FIXED" } else { "VULNERABLE" });
        
        // At vulnerable commit ad212dd5, should return false
        assert!(!has_validation, 
                "Oracle should detect MISSING vk_root validation at vulnerable commit");
        
        // At fixed commit aa9a8e40, should return true
        // assert!(has_validation, "Oracle should detect PRESENT vk_root validation at fixed commit");
        
        println!("✓ Oracle correctly identifies vulnerable code");
    }

    /// Fuzzing seed: Minimal test input for the oracle
    #[test]
    fn test_oracle_with_synthetic_inputs() {
        println!("\n--- Oracle Fuzzing Seeds ---");
        
        // Seed 1: Vulnerable code (missing check)
        let vulnerable_code = r#"
            pub fn verify_compressed(...) {
                if public_values.is_complete != BabyBear::one() {
                    return Err(...);
                }
                // Missing vk_root check!
            }
        "#;
        
        assert!(!oracle_has_vk_root_validation(vulnerable_code),
                "Oracle should detect missing validation");
        println!("✓ Seed 1 (vulnerable): Oracle correctly returns false");
        
        // Seed 2: Fixed code (has check)
        let fixed_code = r#"
            pub fn verify_compressed(...) {
                if public_values.vk_root != self.recursion_vk_root {
                    return Err(MachineVerificationError::InvalidPublicValues("vk_root mismatch"));
                }
            }
        "#;
        
        assert!(oracle_has_vk_root_validation(fixed_code),
                "Oracle should detect present validation");
        println!("✓ Seed 2 (fixed): Oracle correctly returns true");
        
        // Seed 3: Edge case - vk_root mentioned but not validated
        let edge_case_code = r#"
            pub fn verify_compressed(...) {
                // vk_root is part of public values
                let pv: &RecursionPublicValues = ...;
                // But we don't check it!
            }
        "#;
        
        assert!(!oracle_has_vk_root_validation(edge_case_code),
                "Oracle should detect that mere mention != validation");
        println!("✓ Seed 3 (edge case): Oracle correctly returns false");
    }
}

#[cfg(test)]
mod differential_analysis_tests {
    use super::*;

    /// Differential test: Compare what's checked in verify_compressed vs verify_shrink
    #[test]
    fn test_consistency_across_verify_functions() {
        let source = match read_verify_rs() {
            Ok(s) => s,
            Err(e) => {
                println!("⚠️  {}", e);
                return;
            }
        };

        println!("\n--- Differential Analysis: verify_compressed vs verify_shrink ---");
        
        // Extract both functions
        let compressed_start = source.find("pub fn verify_compressed").unwrap_or(0);
        let shrink_start = source.find("pub fn verify_shrink").unwrap_or(0);
        
        let compressed_body = &source[compressed_start..compressed_start+2000.min(source.len()-compressed_start)];
        let shrink_body = &source[shrink_start..shrink_start+2000.min(source.len()-shrink_start)];
        
        // Check what each validates
        let checks = [
            ("is_complete", "is_complete"),
            ("sp1_vk_digest", "sp1_vk_digest"),
            ("vk_root", "vk_root"),
        ];
        
        println!("\nValidation comparison:");
        println!("{:<20} | {:<15} | {:<15}", "Check", "verify_compressed", "verify_shrink");
        println!("{:-<20}-+-{:-<15}-+-{:-<15}", "", "", "");
        
        for (check_name, pattern) in checks.iter() {
            let in_compressed = compressed_body.contains(pattern);
            let in_shrink = shrink_body.contains(pattern);
            
            println!("{:<20} | {:<15} | {:<15}", 
                     check_name,
                     if in_compressed { "✓" } else { "✗" },
                     if in_shrink { "✓" } else { "✗" });
        }
        
        // Both should be missing vk_root check in vulnerable version
        let compressed_has_vk_root = compressed_body.contains("vk_root");
        let shrink_has_vk_root = shrink_body.contains("vk_root");
        
        println!("\n❌ Both verify_compressed AND verify_shrink lack vk_root validation!");
        assert!(!compressed_has_vk_root && !shrink_has_vk_root,
                "Both functions should lack vk_root check at vulnerable commit");
    }
}

fn main() {
    println!("==============================================");
    println!("SP1 vk_root Validation Unit Tests");
    println!("==============================================");
    println!("Vulnerability: Missing vk_root validation in Rust verifier");
    println!("Advisory: GHSA-6248-228x-mmvh Bug 1");
    println!("Vulnerable: ad212dd52bdf8f630ea47f2b58aa94d5b6e79904");
    println!("Fixed:      aa9a8e40b6527a06764ef0347d43ac9307d7bf63");
    println!("==============================================\n");
    
    println!("Run with: rustc --test unit_vk_root_validation.rs -o test_runner && ./test_runner");
    println!("Or:       cargo test --test unit_vk_root_validation\n");
}


//! Harness test for SP1 vk_root validation vulnerability
//!
//! This test provides a more sophisticated analysis of the verifier code,
//! checking multiple aspects of the vulnerability including:
//! - Presence of vk_root field in RecursionPublicValues
//! - Presence of recursion_vk_root in SP1Prover
//! - Validation logic in all three verify functions
//!
//! Test Strategy:
//! 1. Analyze source code structure at vulnerable commit
//! 2. Identify missing validation patterns
//! 3. Compare with expected fix patterns
//! 4. Generate detailed vulnerability report
//!
//! This serves as a harness for deeper static analysis and could be extended
//! to actual execution testing if SP1 SDK is available.

use std::path::Path;
use std::fs;

fn main() {
    println!("==============================================");
    println!("SP1 vk_root Validation Harness Test");
    println!("==============================================");
    println!("Advisory: GHSA-6248-228x-mmvh Bug 1");
    println!("==============================================\n");
    
    test_source_structure();
    test_verify_functions_comprehensive();
    test_public_values_structure();
    test_prover_structure();
    test_fix_completeness();
    
    println!("\n==============================================");
    println!("✅ Harness tests completed");
    println!("==============================================");
}

/// Test 1: Verify the source structure is as expected
fn test_source_structure() {
    println!("Test 1: Source Structure Validation");
    println!("---------------------------------------------");
    
    let paths_to_check = vec![
        ("verify.rs", "../sources/crates/prover/src/verify.rs"),
        ("public_values.rs", "../sources/crates/recursion/core/src/air/public_values.rs"),
        ("utils.rs", "../sources/crates/prover/src/utils.rs"),
    ];
    
    let mut all_exist = true;
    for (name, path) in paths_to_check {
        let exists = Path::new(path).exists();
        println!("  {} {}: {}", 
                 if exists { "✓" } else { "✗" }, 
                 name, 
                 if exists { "Found" } else { "Missing" });
        
        if !exists {
            all_exist = false;
        }
    }
    
    if !all_exist {
        println!("\n⚠️  Some source files not found. Run zkbugs_get_sources.sh first.");
        return;
    }
    
    println!("✓ All required source files present\n");
}

/// Test 2: Comprehensive analysis of all verify functions
fn test_verify_functions_comprehensive() {
    println!("Test 2: Comprehensive Verify Functions Analysis");
    println!("---------------------------------------------");
    
    let verify_rs_path = "../sources/crates/prover/src/verify.rs";
    
    if !Path::new(verify_rs_path).exists() {
        println!("⚠️  Source file not found: {}", verify_rs_path);
        return;
    }
    
    let source = match fs::read_to_string(verify_rs_path) {
        Ok(s) => s,
        Err(e) => {
            println!("⚠️  Failed to read source: {}", e);
            return;
        }
    };
    
    // Define functions to analyze
    let functions = vec![
        ("verify_compressed", "pub fn verify_compressed"),
        ("verify_shrink", "pub fn verify_shrink"),
        ("verify_deferred_proof", "fn verify_deferred_proof"),
        ("verify_plonk", "pub fn verify_plonk"),  // Check if this exists
    ];
    
    println!("\nFunction presence check:");
    let mut functions_found = Vec::new();
    
    for (name, signature) in &functions {
        let exists = source.contains(signature);
        if exists {
            println!("  ✓ {} found", name);
            functions_found.push(name);
        } else {
            println!("  ✗ {} not found", name);
        }
    }
    
    // For each verify function that involves recursion, check validations
    let recursion_functions = vec!["verify_compressed", "verify_shrink", "verify_deferred_proof"];
    
    println!("\nValidation analysis for recursion verifier functions:");
    println!("{:<25} | {:<12} | {:<12} | {:<12}", "Function", "is_complete", "vk_digest", "vk_root");
    println!("{:-<25}-+-{:-<12}-+-{:-<12}-+-{:-<12}", "", "", "", "");
    
    for func_name in recursion_functions.iter() {
        if !source.contains(&format!("fn {}", func_name)) && 
           !source.contains(&format!("pub fn {}", func_name)) {
            continue;
        }
        
        // Extract function body (approximate)
        let func_start = source.find(&format!("fn {}", func_name))
            .or_else(|| source.find(&format!("pub fn {}", func_name)))
            .unwrap();
        
        let remaining = &source[func_start..];
        let func_end = find_function_end(remaining).unwrap_or(2000);
        let func_body = &remaining[..func_end];
        
        // Check what's validated
        let checks_is_complete = func_body.contains("is_complete") && 
                                  (func_body.contains("!= ") || func_body.contains("== "));
        let checks_vk_digest = func_body.contains("vk.hash") || 
                              func_body.contains("sp1_vk_digest") ||
                              func_body.contains("compress_vk_digest");
        let checks_vk_root = func_body.contains("vk_root") && 
                            (func_body.contains("recursion_vk_root") ||
                             func_body.contains("vk_root mismatch"));
        
        println!("{:<25} | {:<12} | {:<12} | {:<12}",
                 func_name,
                 if checks_is_complete { "✓" } else { "✗" },
                 if checks_vk_digest { "✓" } else { "✗" },
                 if checks_vk_root { "✓" } else { "✗" });
    }
    
    // Count total vk_root mentions
    let vk_root_mentions = source.matches("vk_root").count();
    println!("\nTotal 'vk_root' mentions in verify.rs: {}", vk_root_mentions);
    
    if vk_root_mentions == 0 {
        println!("❌ VULNERABILITY CONFIRMED: Zero vk_root validation in verify.rs");
    } else {
        println!("Found {} vk_root mentions (checking if they're validations...)", vk_root_mentions);
        
        // Check if any are actual validation checks
        let has_validation = source.contains("vk_root !=") || 
                            source.contains("vk_root ==") ||
                            source.contains("vk_root mismatch");
        
        if !has_validation {
            println!("⚠️  vk_root mentioned but no validation logic found!");
        } else {
            println!("✓ vk_root validation logic found");
        }
    }
    
    println!();
}

/// Test 3: Analyze RecursionPublicValues structure
fn test_public_values_structure() {
    println!("Test 3: RecursionPublicValues Structure Analysis");
    println!("---------------------------------------------");
    
    let public_values_path = "../sources/crates/recursion/core/src/air/public_values.rs";
    
    if !Path::new(public_values_path).exists() {
        println!("⚠️  Source file not found: {}", public_values_path);
        return;
    }
    
    let source = match fs::read_to_string(public_values_path) {
        Ok(s) => s,
        Err(e) => {
            println!("⚠️  Failed to read source: {}", e);
            return;
        }
    };
    
    // Find RecursionPublicValues struct
    if let Some(start) = source.find("pub struct RecursionPublicValues") {
        let remaining = &source[start..];
        let end = remaining.find("\n}\n").unwrap_or(remaining.len().min(5000));
        let struct_def = &remaining[..end];
        
        println!("RecursionPublicValues struct analysis:");
        
        // Expected fields
        let expected_fields = vec![
            ("committed_value_digest", true),   // Should exist
            ("deferred_proofs_digest", true),  // Should exist
            ("start_pc", true),                // Should exist
            ("next_pc", true),                 // Should exist
            ("is_complete", true),             // Should exist
            ("vk_root", false),                // Should NOT exist in vulnerable version
        ];
        
        println!("\nField presence:");
        for (field_name, _expected_in_vulnerable) in expected_fields {
            let field_pattern = format!("pub {}:", field_name);
            let exists = struct_def.contains(&field_pattern) || 
                        struct_def.contains(&format!("{}: ", field_name));
            
            println!("  {} {}: {}", 
                     if exists { "✓" } else { "✗" },
                     field_name,
                     if exists { "Present" } else { "Absent" });
        }
        
        // Check specifically for vk_root
        let has_vk_root = struct_def.contains("vk_root");
        
        if !has_vk_root {
            println!("\n❌ CONFIRMED: vk_root field does NOT exist in RecursionPublicValues");
            println!("   This field was added as part of the fix.");
        } else {
            println!("\n✅ vk_root field exists in RecursionPublicValues");
            println!("   (Field exists but may not be validated - check verify.rs)");
        }
    } else {
        println!("⚠️  Could not find RecursionPublicValues struct definition");
    }
    
    println!();
}

/// Test 4: Check SP1Prover for recursion_vk_root field
fn test_prover_structure() {
    println!("Test 4: SP1Prover Structure Analysis");
    println!("---------------------------------------------");
    
    let verify_rs_path = "../sources/crates/prover/src/verify.rs";
    
    if !Path::new(verify_rs_path).exists() {
        println!("⚠️  Source file not found");
        return;
    }
    
    let source = match fs::read_to_string(verify_rs_path) {
        Ok(s) => s,
        Err(e) => {
            println!("⚠️  Failed to read source: {}", e);
            return;
        }
    };
    
    // Look for SP1Prover or SP1Verifier struct
    let has_sp1_prover_struct = source.contains("pub struct SP1Prover") || 
                                source.contains("pub struct SP1Verifier");
    
    if has_sp1_prover_struct {
        println!("✓ SP1Prover/SP1Verifier struct found");
        
        // Check for recursion_vk_root field
        let has_recursion_vk_root_field = source.contains("recursion_vk_root:");
        let mentions_recursion_vk_root = source.contains("recursion_vk_root");
        
        println!("\nrecursion_vk_root analysis:");
        println!("  Field declaration: {}", if has_recursion_vk_root_field { "✓ Found" } else { "✗ Not found" });
        println!("  Any mentions:      {}", if mentions_recursion_vk_root { "✓ Found" } else { "✗ Not found" });
        
        if !mentions_recursion_vk_root {
            println!("\n❌ CONFIRMED: recursion_vk_root does NOT exist in prover");
            println!("   This field was added to store the expected vk_root for validation.");
        } else {
            let count = source.matches("recursion_vk_root").count();
            println!("\n✓ recursion_vk_root found ({} mentions)", count);
        }
    } else {
        println!("⚠️  Could not locate SP1Prover struct in verify.rs");
        println!("   It might be defined in a different file");
    }
    
    // Check for lib.rs or mod.rs that might have the struct
    let lib_rs_path = "../sources/crates/prover/src/lib.rs";
    if Path::new(lib_rs_path).exists() {
        if let Ok(lib_source) = fs::read_to_string(lib_rs_path) {
            if lib_source.contains("pub struct SP1Prover") {
                println!("\n✓ Found SP1Prover in lib.rs");
                
                let has_recursion_vk_root = lib_source.contains("recursion_vk_root");
                println!("  recursion_vk_root field: {}", 
                         if has_recursion_vk_root { "✓ Present" } else { "✗ Absent" });
            }
        }
    }
    
    println!();
}

/// Test 5: Assess fix completeness
fn test_fix_completeness() {
    println!("Test 5: Fix Completeness Assessment");
    println!("---------------------------------------------");
    
    println!("Checking if the fix would be complete...\n");
    
    println!("Fix Requirements (from advisory):");
    println!("  1. Add vk_root field to RecursionPublicValues");
    println!("  2. Add recursion_vk_root to SP1Prover/SP1Verifier");
    println!("  3. Add validation in verify_compressed");
    println!("  4. Add validation in verify_shrink");
    println!("  5. Add validation in verify_deferred_proof");
    
    // Check each requirement
    let mut requirements_met = 0;
    let total_requirements = 5;
    
    // Req 1: vk_root field
    let public_values_path = "../sources/crates/recursion/core/src/air/public_values.rs";
    if Path::new(public_values_path).exists() {
        if let Ok(source) = fs::read_to_string(public_values_path) {
            if !source.contains("pub vk_root") {
                println!("\n  ✗ Requirement 1: vk_root field NOT in RecursionPublicValues");
            } else {
                println!("\n  ✓ Requirement 1: vk_root field present");
                requirements_met += 1;
            }
        }
    }
    
    // Req 2: recursion_vk_root in prover
    let verify_rs_path = "../sources/crates/prover/src/verify.rs";
    if Path::new(verify_rs_path).exists() {
        if let Ok(source) = fs::read_to_string(verify_rs_path) {
            if !source.contains("recursion_vk_root") {
                println!("  ✗ Requirement 2: recursion_vk_root NOT in prover");
            } else {
                println!("  ✓ Requirement 2: recursion_vk_root present");
                requirements_met += 1;
            }
            
            // Req 3-5: Validations in verify functions
            let functions_to_check = vec![
                ("verify_compressed", 3),
                ("verify_shrink", 4),
                ("verify_deferred_proof", 5),
            ];
            
            for (func_name, req_num) in functions_to_check {
                if let Some(func_start) = source.find(&format!("fn {}", func_name)) {
                    let remaining = &source[func_start..];
                    let func_end = find_function_end(remaining).unwrap_or(2000);
                    let func_body = &remaining[..func_end];
                    
                    let has_vk_root_check = func_body.contains("vk_root") && 
                                           (func_body.contains("recursion_vk_root") ||
                                            func_body.contains("vk_root mismatch"));
                    
                    if !has_vk_root_check {
                        println!("  ✗ Requirement {}: vk_root validation NOT in {}", req_num, func_name);
                    } else {
                        println!("  ✓ Requirement {}: vk_root validation in {}", req_num, func_name);
                        requirements_met += 1;
                    }
                }
            }
        }
    }
    
    println!("\n---------------------------------------------");
    println!("Fix Completeness: {}/{} requirements met", requirements_met, total_requirements);
    
    if requirements_met == 0 {
        println!("❌ VULNERABLE: No fix requirements met (at vulnerable commit)");
    } else if requirements_met < total_requirements {
        println!("⚠️  PARTIAL: Some but not all requirements met");
    } else {
        println!("✅ FIXED: All requirements met");
    }
    
    println!();
}

/// Helper: Find approximate end of a function
fn find_function_end(source: &str) -> Option<usize> {
    let mut brace_count = 0;
    let mut found_first_open = false;
    
    for (i, c) in source.char_indices() {
        if c == '{' {
            found_first_open = true;
            brace_count += 1;
        } else if c == '}' {
            brace_count -= 1;
            if found_first_open && brace_count == 0 {
                return Some(i + 1);
            }
        }
    }
    
    None
}

/// Helper: Extract function body given its start position
fn _extract_function_body(source: &str, func_name: &str) -> Option<String> {
    let patterns = vec![
        format!("pub fn {}", func_name),
        format!("fn {}", func_name),
    ];
    
    for pattern in patterns {
        if let Some(start) = source.find(&pattern) {
            let remaining = &source[start..];
            if let Some(end) = find_function_end(remaining) {
                return Some(remaining[..end].to_string());
            }
        }
    }
    
    None
}


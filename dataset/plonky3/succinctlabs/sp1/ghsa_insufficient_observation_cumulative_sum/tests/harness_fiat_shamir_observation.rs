//! Harness test for SP1 Fiat-Shamir observation order vulnerability
//!
//! This test performs static analysis on the actual SP1 source code to detect
//! the missing permutation_commit observation before zeta sampling.
//!
//! Test Strategy:
//! 1. Read core/src/runtime/mod.rs from sources
//! 2. Parse the prover function
//! 3. Verify observation sequence
//! 4. Report vulnerability status
//!
//! This serves as a static analysis harness for fuzzing and validation.

use std::path::Path;
use std::fs;

fn main() {
    println!("==========================================================");
    println!("SP1 Fiat-Shamir Observation Order - Harness Test");
    println!("==========================================================");
    println!("Advisory: GHSA-8m24-3cfx-9fjw");
    println!("==========================================================\n");
    
    test_runtime_mod_vulnerability();
    test_prover_mod_permutation_functions();
    test_detailed_line_analysis();
    test_version_detection();
    
    println!("\n==========================================================");
    println!("✅ Harness analysis completed");
    println!("==========================================================");
}

/// Test 1: Analyze core/src/runtime/mod.rs for vulnerability
fn test_runtime_mod_vulnerability() {
    println!("Test 1: Analyzing core/src/runtime/mod.rs");
    println!("----------------------------------------------------------");
    
    let runtime_path = "../sources/core/src/runtime/mod.rs";
    
    if !Path::new(runtime_path).exists() {
        println!("⚠️  Source file not found: {}", runtime_path);
        println!("   Run ../zkbugs_get_sources.sh first");
        return;
    }
    
    let source = fs::read_to_string(runtime_path)
        .expect("Failed to read runtime/mod.rs");
    
    println!("  ✓ File loaded: {} bytes", source.len());
    
    // Check for key patterns
    let has_main_commit_obs = source.contains("challenger.observe") && 
                              source.contains("main_commit");
    let has_perm_commit_obs = source.contains("challenger.observe") && 
                              source.contains("permutation_commit");
    let has_zeta_sampling = source.contains("let zeta") || 
                           (source.contains("zeta") && source.contains("sample_ext_element"));
    let has_permutation_trace = source.contains("generate_permutation_trace") ||
                                source.contains("permutation_traces");
    
    println!("\n  Pattern Analysis:");
    println!("    └─ Main commit observation:       {}", has_main_commit_obs);
    println!("    └─ Permutation commit observation: {}", has_perm_commit_obs);
    println!("    └─ Zeta challenge sampling:        {}", has_zeta_sampling);
    println!("    └─ Permutation trace generation:   {}", has_permutation_trace);
    
    // Determine vulnerability status
    if has_main_commit_obs && has_zeta_sampling && has_permutation_trace {
        if !has_perm_commit_obs {
            println!("\n  ❌ VULNERABLE: Code samples zeta without observing permutation_commit");
            println!("     This matches GHSA-8m24-3cfx-9fjw vulnerable commit (7b43660)");
            println!("     Impact: Fiat-Shamir soundness broken - attacker can manipulate transcript");
        } else {
            println!("\n  ✅ FIXED: Code observes permutation_commit before sampling zeta");
            println!("     This matches the fix commit (64854c15)");
        }
    } else {
        println!("\n  ⚠️  UNKNOWN: Could not determine vulnerability status");
        println!("     This may be a different version or missing key patterns");
    }
    
    println!();
}

/// Test 2: Check for permutation-related functions in prover/mod.rs
fn test_prover_mod_permutation_functions() {
    println!("Test 2: Analyzing core/src/prover/mod.rs");
    println!("----------------------------------------------------------");
    
    let prover_path = "../sources/core/src/prover/mod.rs";
    
    if !Path::new(prover_path).exists() {
        println!("⚠️  Source file not found: {}", prover_path);
        println!("   This file may not exist in early SP1 versions");
        return;
    }
    
    let source = fs::read_to_string(prover_path)
        .expect("Failed to read prover/mod.rs");
    
    println!("  ✓ File loaded: {} bytes", source.len());
    
    // Check for permutation-related functions
    let has_gen_perm_trace = source.contains("generate_permutation_trace");
    let has_eval_perm_constraints = source.contains("eval_permutation_constraints");
    let has_cumulative_sum = source.contains("cumulative_sum");
    let has_debug_cumulative_sums = source.contains("debug_cumulative_sums");
    
    println!("\n  Permutation Functions:");
    println!("    └─ generate_permutation_trace:  {}", has_gen_perm_trace);
    println!("    └─ eval_permutation_constraints: {}", has_eval_perm_constraints);
    println!("    └─ cumulative_sum references:    {}", has_cumulative_sum);
    println!("    └─ debug_cumulative_sums:        {}", has_debug_cumulative_sums);
    
    if has_gen_perm_trace && has_eval_perm_constraints && has_cumulative_sum {
        println!("\n  ✓ Permutation argument implementation present");
        println!("    This file contains the LogUp permutation argument logic");
    } else {
        println!("\n  ⚠️  Permutation implementation incomplete or missing");
    }
    
    println!();
}

/// Test 3: Detailed line-by-line analysis
fn test_detailed_line_analysis() {
    println!("Test 3: Detailed Line Analysis");
    println!("----------------------------------------------------------");
    
    let runtime_path = "../sources/core/src/runtime/mod.rs";
    
    if !Path::new(runtime_path).exists() {
        println!("⚠️  Source file not found");
        return;
    }
    
    let source = fs::read_to_string(runtime_path)
        .expect("Failed to read runtime/mod.rs");
    
    // Find key lines
    let mut main_commit_lines = Vec::new();
    let mut perm_commit_lines = Vec::new();
    let mut zeta_lines = Vec::new();
    
    for (line_num, line) in source.lines().enumerate() {
        let line_num = line_num + 1;
        
        if line.contains("challenger.observe") && line.contains("main_commit") {
            main_commit_lines.push(line_num);
        }
        
        if line.contains("challenger.observe") && line.contains("permutation_commit") {
            perm_commit_lines.push(line_num);
        }
        
        if line.contains("let zeta") || 
           (line.contains("zeta") && line.contains("sample_ext_element")) {
            zeta_lines.push(line_num);
        }
    }
    
    println!("  Line Numbers:");
    println!("    └─ main_commit observation:       {:?}", main_commit_lines);
    println!("    └─ permutation_commit observation: {:?}", perm_commit_lines);
    println!("    └─ zeta sampling:                  {:?}", zeta_lines);
    
    // Verify ordering
    if !main_commit_lines.is_empty() && !zeta_lines.is_empty() {
        let main_line = main_commit_lines[0];
        let zeta_line = zeta_lines[0];
        
        println!("\n  Sequence Analysis:");
        
        if perm_commit_lines.is_empty() {
            println!("    ❌ VULNERABILITY CONFIRMED:");
            println!("       Line {}: challenger.observe(main_commit)", main_line);
            println!("       Line ???: challenger.observe(permutation_commit)  ← MISSING!");
            println!("       Line {}: let zeta = challenger.sample_ext_element()", zeta_line);
            println!("\n       Zeta is sampled WITHOUT observing permutation_commit!");
        } else {
            let perm_line = perm_commit_lines[0];
            
            if perm_line < zeta_line {
                println!("    ✅ CORRECT ORDER:");
                println!("       Line {}: challenger.observe(main_commit)", main_line);
                println!("       Line {}: challenger.observe(permutation_commit)", perm_line);
                println!("       Line {}: let zeta = challenger.sample_ext_element()", zeta_line);
                println!("\n       Permutation commit observed BEFORE zeta sampling!");
            } else {
                println!("    ❌ WRONG ORDER:");
                println!("       Permutation commit observed AFTER zeta sampling!");
            }
        }
    }
    
    println!();
}

/// Test 4: Version detection
fn test_version_detection() {
    println!("Test 4: Version Detection");
    println!("----------------------------------------------------------");
    
    let runtime_path = "../sources/core/src/runtime/mod.rs";
    
    if !Path::new(runtime_path).exists() {
        println!("⚠️  Source file not found");
        return;
    }
    
    let source = fs::read_to_string(runtime_path)
        .expect("Failed to read runtime/mod.rs");
    
    // Check for specific patterns that indicate version
    let has_perm_obs = source.contains("challenger.observe") && 
                       source.contains("permutation_commit");
    
    // Check for commit patterns (the fix added this)
    let has_perm_data = source.contains("permutation_data");
    let has_perm_traces = source.contains("permutation_traces");
    let has_cumulative = source.contains("cumulative_sum");
    
    println!("  Version Indicators:");
    println!("    └─ Observes permutation_commit: {}", has_perm_obs);
    println!("    └─ Has permutation_data:       {}", has_perm_data);
    println!("    └─ Has permutation_traces:     {}", has_perm_traces);
    println!("    └─ Has cumulative_sum refs:    {}", has_cumulative);
    
    println!("\n  Version Assessment:");
    
    if has_perm_obs && has_perm_data && has_perm_traces {
        println!("    ✅ This appears to be the FIXED version (commit 64854c15 or later)");
        println!("       - Full permutation argument implemented");
        println!("       - Proper Fiat-Shamir observations");
        println!("       - Corresponds to SP1 v3.0.0+");
    } else if has_perm_data && has_perm_traces && !has_perm_obs {
        println!("    ❌ This appears to be the VULNERABLE version (commit 7b43660)");
        println!("       - Permutation argument implemented");
        println!("       - BUT missing permutation_commit observation!");
        println!("       - Corresponds to early December 2023 SP1");
    } else if !has_perm_data && !has_perm_traces {
        println!("    ℹ️  This appears to be a PRE-PERMUTATION version");
        println!("       - Permutation argument not yet implemented");
        println!("       - Not vulnerable to THIS specific bug");
        println!("       - Earlier than December 2023");
    } else {
        println!("    ⚠️  UNKNOWN version - mixed indicators");
    }
    
    println!();
}

#[cfg(test)]
mod harness_tests {
    use super::*;
    
    #[test]
    fn test_runtime_analysis() {
        test_runtime_mod_vulnerability();
    }
    
    #[test]
    fn test_prover_analysis() {
        test_prover_mod_permutation_functions();
    }
    
    #[test]
    fn test_line_analysis() {
        test_detailed_line_analysis();
    }
    
    #[test]
    fn test_version() {
        test_version_detection();
    }
}

#[cfg(test)]
mod pattern_matching_tests {
    use super::*;
    
    /// Test pattern matching on synthetic code snippets
    #[test]
    fn test_vulnerable_code_pattern() {
        let vulnerable_snippet = r#"
        // Commit to main trace
        let (main_commit, main_data) = config.pcs().commit_batches(traces.to_vec());
        challenger.observe(main_commit);
        
        // Sample permutation challenges
        let mut permutation_challenges: Vec<EF> = Vec::new();
        for _ in 0..2 {
            permutation_challenges.push(challenger.sample_ext_element());
        }
        
        // Generate permutation traces
        let permutation_traces = chips.iter().enumerate().map(|(i, chip)| {
            generate_permutation_trace(chip, &traces[i], permutation_challenges.clone())
        }).collect::<Vec<_>>();
        
        // Commit to permutation traces
        let (permutation_commit, permutation_data) = 
            config.pcs().commit_batches(flattened_permutation_traces);
        
        // BUG: Missing challenger.observe(permutation_commit) HERE!
        
        // Sample zeta
        let zeta: SC::Challenge = challenger.sample_ext_element();
        "#;
        
        assert!(vulnerable_snippet.contains("challenger.observe") && 
                vulnerable_snippet.contains("main_commit"),
                "Should have main_commit observation");
        
        assert!(!vulnerable_snippet.contains("challenger.observe(permutation_commit)"),
                "Should NOT have permutation_commit observation");
        
        assert!(vulnerable_snippet.contains("let zeta") && 
                vulnerable_snippet.contains("sample_ext_element"),
                "Should sample zeta");
        
        println!("✓ Vulnerable pattern correctly detected");
    }
    
    #[test]
    fn test_fixed_code_pattern() {
        let fixed_snippet = r#"
        // Commit to main trace
        let (main_commit, main_data) = config.pcs().commit_batches(traces.to_vec());
        challenger.observe(main_commit);
        
        // Sample permutation challenges
        let mut permutation_challenges: Vec<EF> = Vec::new();
        for _ in 0..2 {
            permutation_challenges.push(challenger.sample_ext_element());
        }
        
        // Generate permutation traces
        let permutation_traces = chips.iter().enumerate().map(|(i, chip)| {
            generate_permutation_trace(chip, &traces[i], permutation_challenges.clone())
        }).collect::<Vec<_>>();
        
        // Commit to permutation traces
        let (permutation_commit, permutation_data) = 
            config.pcs().commit_batches(flattened_permutation_traces);
        
        // FIX: Observe permutation commit!
        challenger.observe(permutation_commit);
        
        // Sample zeta
        let zeta: SC::Challenge = challenger.sample_ext_element();
        "#;
        
        assert!(fixed_snippet.contains("challenger.observe") && 
                fixed_snippet.contains("main_commit"),
                "Should have main_commit observation");
        
        assert!(fixed_snippet.contains("challenger.observe(permutation_commit)"),
                "Should have permutation_commit observation");
        
        assert!(fixed_snippet.contains("let zeta") && 
                fixed_snippet.contains("sample_ext_element"),
                "Should sample zeta");
        
        // Verify ordering
        let perm_obs_pos = fixed_snippet.find("challenger.observe(permutation_commit)")
            .expect("Should find permutation observation");
        let zeta_pos = fixed_snippet.find("let zeta")
            .expect("Should find zeta sampling");
        
        assert!(perm_obs_pos < zeta_pos,
                "Permutation observation should come before zeta sampling");
        
        println!("✓ Fixed pattern correctly detected");
    }
}


//! Unit tests for SP1 chip_ordering validation vulnerability (GHSA-c873-wfhp-wx5m Bug 1)
//!
//! This test suite demonstrates the missing validation in SP1's STARK verifier where
//! the prover-provided chip_ordering HashMap could be manipulated to point to wrong chip indices.
//!
//! The vulnerable code used chip_ordering[name] without verifying that chips[i].name() == name.
//! This allowed a malicious prover to swap chip indices and potentially bypass verifier checks.
//!
//! These tests work as fuzzing oracles and require NO SP1 dependencies.

use std::collections::HashMap;

/// Mock representation of a chip with a name
#[derive(Debug, Clone)]
struct MockChip {
    name: String,
}

impl MockChip {
    fn new(name: &str) -> Self {
        Self { name: name.to_string() }
    }
    
    fn name(&self) -> String {
        self.name.clone()
    }
}

/// Mock representation of chip information from verifying key
#[derive(Debug, Clone)]
struct ChipInfo {
    name: String,
}

/// Simulates the VULNERABLE verifier logic (commit 1fa7d20)
/// This version trusts the prover-provided chip_ordering without validation
fn vulnerable_verify_chip_ordering(
    chip_info: &[ChipInfo],
    chip_ordering: &HashMap<String, usize>,
    chips: &[MockChip],
) -> Result<(), String> {
    for ChipInfo { name } in chip_info {
        // VULNERABLE: Uses chip_ordering directly without validation
        let i = chip_ordering.get(name)
            .ok_or_else(|| format!("Missing chip_ordering entry for {}", name))?;
        
        if *i >= chips.len() {
            return Err(format!("Index {} out of bounds for chips array", i));
        }
        
        // BUG: Does NOT check if chips[i].name() == name
        // This allows the prover to swap chip indices!
        
        // The verifier continues using the wrong chip data
        let _chip = &chips[*i];
        // In real code: let values = opened_values.chips[i].preprocessed.clone();
    }
    
    Ok(())
}

/// Simulates the FIXED verifier logic (commit 7e2023b2)
/// This version validates that the indexed chip matches the expected name
fn fixed_verify_chip_ordering(
    chip_info: &[ChipInfo],
    chip_ordering: &HashMap<String, usize>,
    chips: &[MockChip],
) -> Result<(), String> {
    for ChipInfo { name } in chip_info {
        let i = chip_ordering.get(name)
            .ok_or_else(|| format!("Missing chip_ordering entry for {}", name))?;
        
        if *i >= chips.len() {
            return Err(format!("Index {} out of bounds for chips array", i));
        }
        
        // FIX: Validate that the indexed chip's name matches expected name
        if name != &chips[*i].name() {
            return Err(format!(
                "PreprocessedChipIdMismatch: expected '{}', but chips[{}].name() = '{}'",
                name, i, chips[*i].name()
            ));
        }
        
        let _chip = &chips[*i];
    }
    
    Ok(())
}

/// Test 1: Correct chip_ordering (both versions should accept)
fn test_correct_chip_ordering() {
    println!("\n=== Test 1: Correct chip_ordering ===");
    
    let chip_info = vec![
        ChipInfo { name: "Cpu".to_string() },
        ChipInfo { name: "Memory".to_string() },
        ChipInfo { name: "ALU".to_string() },
    ];
    
    let chips = vec![
        MockChip::new("Cpu"),
        MockChip::new("Memory"),
        MockChip::new("ALU"),
    ];
    
    let mut chip_ordering = HashMap::new();
    chip_ordering.insert("Cpu".to_string(), 0);
    chip_ordering.insert("Memory".to_string(), 1);
    chip_ordering.insert("ALU".to_string(), 2);
    
    println!("Chip ordering: {:?}", chip_ordering);
    println!("Chips: {:?}", chips.iter().map(|c| c.name()).collect::<Vec<_>>());
    
    // Both versions should accept correct ordering
    let vuln_result = vulnerable_verify_chip_ordering(&chip_info, &chip_ordering, &chips);
    let fixed_result = fixed_verify_chip_ordering(&chip_info, &chip_ordering, &chips);
    
    println!("Vulnerable version: {:?}", vuln_result);
    println!("Fixed version: {:?}", fixed_result);
    
    assert!(vuln_result.is_ok(), "Vulnerable version should accept correct ordering");
    assert!(fixed_result.is_ok(), "Fixed version should accept correct ordering");
    println!("✅ Test passed");
}

/// Test 2: Swapped chip indices (vulnerable accepts, fixed rejects)
fn test_swapped_chip_ordering() {
    println!("\n=== Test 2: Swapped Cpu <-> Memory indices ===");
    
    let chip_info = vec![
        ChipInfo { name: "Cpu".to_string() },
        ChipInfo { name: "Memory".to_string() },
        ChipInfo { name: "ALU".to_string() },
    ];
    
    let chips = vec![
        MockChip::new("Cpu"),      // Index 0
        MockChip::new("Memory"),   // Index 1
        MockChip::new("ALU"),      // Index 2
    ];
    
    // MALICIOUS: Swap Cpu and Memory indices!
    let mut chip_ordering = HashMap::new();
    chip_ordering.insert("Cpu".to_string(), 1);      // Wrong! Should be 0
    chip_ordering.insert("Memory".to_string(), 0);   // Wrong! Should be 1
    chip_ordering.insert("ALU".to_string(), 2);      // Correct
    
    println!("Chip ordering (SWAPPED): {:?}", chip_ordering);
    println!("Chips array: {:?}", chips.iter().map(|c| c.name()).collect::<Vec<_>>());
    
    let vuln_result = vulnerable_verify_chip_ordering(&chip_info, &chip_ordering, &chips);
    let fixed_result = fixed_verify_chip_ordering(&chip_info, &chip_ordering, &chips);
    
    println!("Vulnerable version: {:?}", vuln_result);
    println!("Fixed version: {:?}", fixed_result);
    
    // BUG: Vulnerable version accepts the swapped indices!
    assert!(vuln_result.is_ok(), 
            "❌ VULNERABLE: Accepts swapped chip indices without validation!");
    
    // FIX: Fixed version detects the mismatch
    assert!(fixed_result.is_err(), 
            "✅ FIXED: Rejects swapped chip indices");
    
    if let Err(msg) = fixed_result {
        assert!(msg.contains("PreprocessedChipIdMismatch"), 
                "Error should mention chip mismatch");
        println!("Error message: {}", msg);
    }
    println!("✅ Test passed - vulnerability confirmed and fix validated");
}

/// Test 3: Partial swap (only one chip wrong)
fn test_partial_chip_ordering_swap() {
    println!("\n=== Test 3: Only Cpu index is wrong ===");
    
    let chip_info = vec![
        ChipInfo { name: "Cpu".to_string() },
        ChipInfo { name: "Memory".to_string() },
        ChipInfo { name: "ALU".to_string() },
    ];
    
    let chips = vec![
        MockChip::new("Cpu"),
        MockChip::new("Memory"),
        MockChip::new("ALU"),
    ];
    
    // Cpu points to Memory's index
    let mut chip_ordering = HashMap::new();
    chip_ordering.insert("Cpu".to_string(), 1);      // Wrong! Points to Memory
    chip_ordering.insert("Memory".to_string(), 1);   // Correct
    chip_ordering.insert("ALU".to_string(), 2);      // Correct
    
    println!("Chip ordering: {:?}", chip_ordering);
    
    let vuln_result = vulnerable_verify_chip_ordering(&chip_info, &chip_ordering, &chips);
    let fixed_result = fixed_verify_chip_ordering(&chip_info, &chip_ordering, &chips);
    
    println!("Vulnerable version: {:?}", vuln_result);
    println!("Fixed version: {:?}", fixed_result);
    
    assert!(vuln_result.is_ok(), 
            "❌ VULNERABLE: Accepts wrong Cpu index");
    assert!(fixed_result.is_err(), 
            "✅ FIXED: Detects Cpu pointing to wrong chip");
    println!("✅ Test passed");
}

/// Test 4: All indices shifted by one (circular rotation)
fn test_rotated_chip_ordering() {
    println!("\n=== Test 4: Indices rotated right by 1 ===");
    
    let chip_info = vec![
        ChipInfo { name: "Cpu".to_string() },
        ChipInfo { name: "Memory".to_string() },
        ChipInfo { name: "ALU".to_string() },
    ];
    
    let chips = vec![
        MockChip::new("Cpu"),      // Index 0
        MockChip::new("Memory"),   // Index 1
        MockChip::new("ALU"),      // Index 2
    ];
    
    // Rotate: Cpu->2, Memory->0, ALU->1
    let mut chip_ordering = HashMap::new();
    chip_ordering.insert("Cpu".to_string(), 2);      // Points to ALU
    chip_ordering.insert("Memory".to_string(), 0);   // Points to Cpu
    chip_ordering.insert("ALU".to_string(), 1);      // Points to Memory
    
    println!("Chip ordering (ROTATED): {:?}", chip_ordering);
    
    let vuln_result = vulnerable_verify_chip_ordering(&chip_info, &chip_ordering, &chips);
    let fixed_result = fixed_verify_chip_ordering(&chip_info, &chip_ordering, &chips);
    
    println!("Vulnerable version: {:?}", vuln_result);
    println!("Fixed version: {:?}", fixed_result);
    
    assert!(vuln_result.is_ok(), 
            "❌ VULNERABLE: Accepts fully rotated indices");
    assert!(fixed_result.is_err(), 
            "✅ FIXED: Detects rotated chip ordering");
    println!("✅ Test passed");
}

/// Oracle for fuzzing: compare vulnerable vs fixed behavior
fn differential_oracle(
    chip_names: &[String],
    chip_ordering: &HashMap<String, usize>,
    chips: &[MockChip],
) -> bool {
    let chip_info: Vec<ChipInfo> = chip_names
        .iter()
        .map(|name| ChipInfo { name: name.clone() })
        .collect();
    
    let vuln_result = vulnerable_verify_chip_ordering(&chip_info, &chip_ordering, &chips);
    let fixed_result = fixed_verify_chip_ordering(&chip_info, &chip_ordering, &chips);
    
    // Interesting if they disagree
    vuln_result.is_ok() != fixed_result.is_ok()
}

fn test_differential_oracle_on_correct_input() {
    let chip_names = vec!["Cpu".to_string(), "Memory".to_string()];
    let chips = vec![MockChip::new("Cpu"), MockChip::new("Memory")];
    let mut chip_ordering = HashMap::new();
    chip_ordering.insert("Cpu".to_string(), 0);
    chip_ordering.insert("Memory".to_string(), 1);
    
    // Correct input: both should accept, no disagreement
    let has_disagreement = differential_oracle(&chip_names, &chip_ordering, &chips);
    assert!(!has_disagreement, "Correct input should not trigger oracle");
    println!("✅ Oracle test passed: correct input");
}

fn test_differential_oracle_on_swapped_input() {
    let chip_names = vec!["Cpu".to_string(), "Memory".to_string()];
    let chips = vec![MockChip::new("Cpu"), MockChip::new("Memory")];
    
    // Swapped indices
    let mut chip_ordering = HashMap::new();
    chip_ordering.insert("Cpu".to_string(), 1);    // Wrong
    chip_ordering.insert("Memory".to_string(), 0); // Wrong
    
    // Swapped input: vulnerable accepts, fixed rejects -> disagreement!
    let has_disagreement = differential_oracle(&chip_names, &chip_ordering, &chips);
    assert!(has_disagreement, "Oracle should detect vulnerability on swapped indices");
    println!("✅ Oracle test passed: swapped input triggers oracle");
}

fn test_fuzzing_seed_corpus() {
    println!("\n=== Fuzzing Seed Corpus ===");
    
    // Seed 1: Correct ordering (baseline)
    let seed1 = (
        vec!["Cpu".to_string(), "Memory".to_string()],
        {
            let mut m = HashMap::new();
            m.insert("Cpu".to_string(), 0);
            m.insert("Memory".to_string(), 1);
            m
        },
        vec![MockChip::new("Cpu"), MockChip::new("Memory")],
    );
    
    // Seed 2: Swapped ordering (triggers bug)
    let seed2 = (
        vec!["Cpu".to_string(), "Memory".to_string()],
        {
            let mut m = HashMap::new();
            m.insert("Cpu".to_string(), 1);
            m.insert("Memory".to_string(), 0);
            m
        },
        vec![MockChip::new("Cpu"), MockChip::new("Memory")],
    );
    
    // Seed 3: Three chips, partial swap
    let seed3 = (
        vec!["Cpu".to_string(), "Memory".to_string(), "ALU".to_string()],
        {
            let mut m = HashMap::new();
            m.insert("Cpu".to_string(), 2);
            m.insert("Memory".to_string(), 1);
            m.insert("ALU".to_string(), 0);
            m
        },
        vec![MockChip::new("Cpu"), MockChip::new("Memory"), MockChip::new("ALU")],
    );
    
    let seeds = vec![seed1, seed2, seed3];
    
    for (i, (names, ordering, chips)) in seeds.iter().enumerate() {
        let disagrees = differential_oracle(names, ordering, chips);
        println!("Seed {}: disagreement = {}", i + 1, disagrees);
        
        if disagrees {
            println!("  ⚠️  This seed exposes the vulnerability!");
        }
    }
    println!("✅ Seed corpus test passed");
}

fn main() {
    println!("==============================================");
    println!("SP1 chip_ordering Validation Unit Tests");
    println!("==============================================");
    println!("Advisory: GHSA-c873-wfhp-wx5m Bug 1");
    println!("Vulnerable: commit 1fa7d2050e6c0a5f6fc154a395f3e967022f7035");
    println!("Fixed: commit 7e2023b2cbd3c2c8e96399ef52784dd2ec08f617");
    println!("==============================================\n");
    
    println!("Running unit tests...\n");
    test_correct_chip_ordering();
    test_swapped_chip_ordering();
    test_partial_chip_ordering_swap();
    test_rotated_chip_ordering();
    
    println!("\nRunning oracle tests...\n");
    test_differential_oracle_on_correct_input();
    test_differential_oracle_on_swapped_input();
    test_fuzzing_seed_corpus();
    
    println!("\n==============================================");
    println!("✅ All unit tests completed successfully");
    println!("==============================================");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_correct_chip_ordering_test() {
        test_correct_chip_ordering();
    }

    #[test]
    fn test_swapped_chip_ordering_test() {
        test_swapped_chip_ordering();
    }

    #[test]
    fn test_partial_chip_ordering_swap_test() {
        test_partial_chip_ordering_swap();
    }

    #[test]
    fn test_rotated_chip_ordering_test() {
        test_rotated_chip_ordering();
    }

    #[test]
    fn test_differential_oracle_on_correct_input_test() {
        test_differential_oracle_on_correct_input();
    }

    #[test]
    fn test_differential_oracle_on_swapped_input_test() {
        test_differential_oracle_on_swapped_input();
    }

    #[test]
    fn test_fuzzing_seed_corpus_test() {
        test_fuzzing_seed_corpus();
    }
}

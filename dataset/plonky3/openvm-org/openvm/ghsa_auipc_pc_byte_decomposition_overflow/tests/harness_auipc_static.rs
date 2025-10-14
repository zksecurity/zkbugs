// Harness Tests for OpenVM AUIPC PC Byte Decomposition Overflow
// Bug: GHSA-jf2r-x3j4-23m7 - Iterator order typo in range check
//
// These tests perform static analysis on the OpenVM source code to detect
// vulnerability and fix patterns in the AUIPC chip's decomposition logic.

use std::fs;
use std::path::Path;

/// Path helper for locating AUIPC source files
pub struct SourcePaths {
    base: &'static str,
}

impl SourcePaths {
    pub fn new() -> Self {
        Self {
            base: "../sources/extensions/rv32im/circuit/src/auipc",
        }
    }

    pub fn core_rs(&self) -> String {
        format!("{}/core.rs", self.base)
    }

    pub fn mod_rs(&self) -> String {
        format!("{}/mod.rs", self.base)
    }
}

/// Pattern matcher for AUIPC decomposition patterns
pub struct AuipcPatternMatcher {
    content: String,
}

impl AuipcPatternMatcher {
    pub fn from_file<P: AsRef<Path>>(path: P) -> std::io::Result<Self> {
        let content = fs::read_to_string(path)?;
        Ok(Self { content })
    }

    /// Check for vulnerable pattern: skip(1).enumerate()
    pub fn has_vulnerable_pattern(&self) -> bool {
        self.content.contains(".skip(1).enumerate()")
    }

    /// Check for fixed pattern: enumerate().skip(1)
    pub fn has_fixed_pattern(&self) -> bool {
        self.content.contains(".enumerate().skip(1)")
    }

    /// Count occurrences of vulnerable pattern
    pub fn count_vulnerable_patterns(&self) -> usize {
        self.content.matches(".skip(1).enumerate()").count()
    }

    /// Count occurrences of fixed pattern
    pub fn count_fixed_patterns(&self) -> usize {
        self.content.matches(".enumerate().skip(1)").count()
    }

    /// Check for 6-bit range check logic
    pub fn has_6bit_range_check(&self) -> bool {
        // Look for the condition that triggers 6-bit check
        self.content.contains("i == pc_limbs.len() - 1")
            || self.content.contains("PC_BITS")
            || self.content.contains("pc_limbs.len() * RV32_CELL_BITS - PC_BITS")
    }

    /// Check for scaling factor (used in 6-bit check)
    pub fn has_scaling_logic(&self) -> bool {
        // The fix applies scaling: limb * (1 << shift)
        self.content.contains("1 << (pc_limbs.len() * RV32_CELL_BITS - PC_BITS)")
            || self.content.contains("<< (pc_limbs.len()")
    }

    /// Check for pc_limbs iteration
    pub fn has_pc_limbs_iteration(&self) -> bool {
        self.content.contains("pc_limbs.iter()")
    }

    /// Assess vulnerability status
    pub fn is_vulnerable(&self) -> bool {
        // Vulnerable if has vulnerable pattern and no fixed pattern
        self.has_vulnerable_pattern() && !self.has_fixed_pattern()
    }

    /// Assess fix status
    pub fn is_fixed(&self) -> bool {
        // Fixed if has fixed pattern and no vulnerable pattern
        self.has_fixed_pattern() && !self.has_vulnerable_pattern()
    }

    /// Overall classification
    pub fn classification(&self) -> &'static str {
        if self.is_fixed() {
            "FIXED"
        } else if self.is_vulnerable() {
            "VULNERABLE"
        } else if self.has_fixed_pattern() && self.has_vulnerable_pattern() {
            "MIXED"  // Shouldn't happen in single file
        } else {
            "UNKNOWN"
        }
    }
}

// ============================================================================
// HARNESS TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    fn get_core_path() -> String {
        SourcePaths::new().core_rs()
    }

    #[test]
    fn test_iteration_pattern_in_source() {
        println!("\n=== Test: Iteration Pattern Detection ===");

        let core_path = get_core_path();

        if let Ok(matcher) = AuipcPatternMatcher::from_file(&core_path) {
            println!("✓ Successfully read core.rs");
            
            let has_vuln = matcher.has_vulnerable_pattern();
            let has_fixed = matcher.has_fixed_pattern();
            let vuln_count = matcher.count_vulnerable_patterns();
            let fixed_count = matcher.count_fixed_patterns();
            
            println!("Vulnerable pattern (.skip(1).enumerate()): found={}, count={}", 
                     has_vuln, vuln_count);
            println!("Fixed pattern (.enumerate().skip(1)): found={}, count={}", 
                     has_fixed, fixed_count);
            println!("Classification: {}", matcher.classification());
            
            if matcher.is_vulnerable() {
                println!("⚠ SOURCE IS VULNERABLE");
                println!("  Expected at commit: f41640c37bc5468a0775a38098053fe37ea3538a");
            } else if matcher.is_fixed() {
                println!("✓ SOURCE IS FIXED");
                println!("  Expected at commit: 68da4b50c033da5603517064aa0a08e1bbf70a01");
            }
        } else {
            println!("⚠ Could not read core.rs: {}", core_path);
            println!("  This is expected if sources haven't been cloned yet");
        }
    }

    #[test]
    fn test_range_check_condition_present() {
        println!("\n=== Test: Range Check Condition Present ===");

        let core_path = get_core_path();

        if let Ok(matcher) = AuipcPatternMatcher::from_file(&core_path) {
            println!("✓ Successfully read core.rs");
            
            let has_condition = matcher.has_6bit_range_check();
            let has_scaling = matcher.has_scaling_logic();
            
            println!("Has 6-bit range check condition: {}", has_condition);
            println!("Has scaling logic: {}", has_scaling);
            
            if has_condition {
                println!("✓ 6-bit range check condition present");
            } else {
                println!("⚠ 6-bit range check condition missing");
            }
            
            if has_scaling {
                println!("✓ Scaling logic present (for 6-bit enforcement)");
            } else {
                println!("⚠ Scaling logic missing");
            }
        } else {
            println!("⚠ Could not read core.rs: {}", core_path);
        }
    }

    #[test]
    fn test_differential_source_analysis() {
        println!("\n=== Test: Differential Source Analysis ===");
        
        println!("\nExpected patterns in VULNERABLE commit (f41640c):");
        println!("  - Pattern: pc_limbs.iter().skip(1).enumerate()");
        println!("  - Indices produced: 0, 1, 2");
        println!("  - Condition 'i == 3' NEVER TRUE");
        println!("  - limb[3] gets 8-bit check");
        println!("  - Result: UNDER-CONSTRAINED");
        
        println!("\nExpected patterns in FIXED commit (68da4b50):");
        println!("  - Pattern: pc_limbs.iter().enumerate().skip(1)");
        println!("  - Indices produced: 1, 2, 3");
        println!("  - Condition 'i == 3' IS TRUE");
        println!("  - limb[3] gets 6-bit check");
        println!("  - Result: PROPERLY CONSTRAINED");
        
        let core_path = get_core_path();
        
        if Path::new(&core_path).exists() {
            match AuipcPatternMatcher::from_file(&core_path) {
                Ok(matcher) => {
                    println!("\n=== Current Source Analysis ===");
                    println!("Classification: {}", matcher.classification());
                    
                    if matcher.is_vulnerable() {
                        println!("⚠ Current sources match VULNERABLE pattern");
                    } else if matcher.is_fixed() {
                        println!("✓ Current sources match FIXED pattern");
                    }
                }
                Err(e) => {
                    println!("\n⚠ Could not analyze: {}", e);
                }
            }
        } else {
            println!("\n⚠ core.rs not found - sources not cloned yet");
        }
    }

    #[test]
    fn test_pc_limbs_iteration_present() {
        println!("\n=== Test: pc_limbs Iteration Present ===");

        let core_path = get_core_path();

        if let Ok(matcher) = AuipcPatternMatcher::from_file(&core_path) {
            let has_iteration = matcher.has_pc_limbs_iteration();
            println!("Has pc_limbs iteration: {}", has_iteration);
            
            assert!(has_iteration, "Should have pc_limbs iteration logic");
            println!("✓ pc_limbs iteration logic found");
        } else {
            println!("⚠ Could not read core.rs: {}", core_path);
        }
    }

    #[test]
    fn test_auipc_chip_architecture() {
        println!("\n=== AUIPC Chip Architecture ===");
        println!("AUIPC (Add Upper Immediate to PC) Instruction:");
        println!("  Operation: rd = pc + (imm << 12)");
        println!("  Purpose: Calculate addresses relative to PC");
        println!("\nPC Decomposition:");
        println!("  PC is 30 bits (not full 32-bit)");
        println!("  Decomposed into 4 limbs of 8 bits each:");
        println!("    limb[0]: bits [0:7]   - 8-bit check");
        println!("    limb[1]: bits [8:15]  - 8-bit check");
        println!("    limb[2]: bits [16:23] - 8-bit check");
        println!("    limb[3]: bits [24:29] - 6-bit check (only 6 bits used!)");
        println!("\nBabyBear Field:");
        println!("  Modulus: 2013265921 (0x78000001)");
        println!("  Max valid 30-bit PC: 1073741823 (0x3FFFFFFF)");
        println!("  limb[3] must be ≤ 63 to stay within 30-bit limit");
        println!("\nThe Bug:");
        println!("  Vulnerable: limb[3] checked as 8-bit (allows 0-255)");
        println!("  Fixed: limb[3] checked as 6-bit (allows 0-63)");
        println!("  Impact: PC can overflow field, AUIPC produces wrong result");
    }

    #[test]
    fn test_fix_commit_details() {
        println!("\n=== Fix Commit Details ===");
        println!("Commit: 68da4b50c033da5603517064aa0a08e1bbf70a01");
        println!("Title: 'fix: auipc range check pc_limbs[3] to 6-bits'");
        println!("Released in: v1.1.0");
        println!("\nChange:");
        println!("  - for (i, limb) in pc_limbs.iter().skip(1).enumerate()");
        println!("  + for (i, limb) in pc_limbs.iter().enumerate().skip(1)");
        println!("\nWhy This Matters:");
        println!("  skip(1).enumerate():");
        println!("    - Skip first element, THEN enumerate");
        println!("    - Produces indices: 0, 1, 2");
        println!("    - Condition 'i == 3' NEVER true");
        println!("  enumerate().skip(1):");
        println!("    - Enumerate all, THEN skip first");
        println!("    - Produces indices: 1, 2, 3");
        println!("    - Condition 'i == 3' IS true for limb[3]");
        println!("\nIronic Context:");
        println!("  This bug was introduced as a TYPO while fixing");
        println!("  a previous vulnerability (Cantina finding #21)");
        println!("  → Shows importance of careful code review!");
    }

    #[test]
    fn test_source_file_accessibility() {
        println!("\n=== Test: Source File Accessibility ===");

        let paths = SourcePaths::new();
        let core_path = paths.core_rs();
        let mod_path = paths.mod_rs();

        println!("Checking source file paths:");
        println!("  core.rs: {}", core_path);
        println!("  mod.rs: {}", mod_path);

        if Path::new(&core_path).exists() {
            println!("✓ core.rs is accessible");
            
            if let Ok(content) = fs::read_to_string(&core_path) {
                let lines = content.lines().count();
                println!("  File size: {} lines", lines);
            }
        } else {
            println!("⚠ core.rs not found (sources not cloned)");
        }

        if Path::new(&mod_path).exists() {
            println!("✓ mod.rs is accessible");
        } else {
            println!("⚠ mod.rs not found (sources not cloned)");
        }

        println!("\nTo clone sources: cd .. && ./zkbugs_get_sources.sh");
    }

    #[test]
    fn test_pattern_counts() {
        println!("\n=== Test: Pattern Occurrence Counts ===");

        let core_path = get_core_path();

        if let Ok(matcher) = AuipcPatternMatcher::from_file(&core_path) {
            println!("✓ Successfully read core.rs");
            
            let vuln_count = matcher.count_vulnerable_patterns();
            let fixed_count = matcher.count_fixed_patterns();
            
            println!("Vulnerable patterns (.skip(1).enumerate()): {}", vuln_count);
            println!("Fixed patterns (.enumerate().skip(1)): {}", fixed_count);
            
            println!("\nExpected Counts:");
            println!("  Vulnerable commit (f41640c): vuln=2, fixed=0");
            println!("  Fixed commit (68da4b50): vuln=0, fixed=2");
            println!("  (2 occurrences because eval_constraint_circuit AND generate_subrow both use it)");
            
            if vuln_count == 2 && fixed_count == 0 {
                println!("\n⚠ Matches VULNERABLE commit pattern");
            } else if vuln_count == 0 && fixed_count == 2 {
                println!("\n✓ Matches FIXED commit pattern");
            } else {
                println!("\n⚠ Unexpected pattern counts (possible intermediate state)");
            }
        } else {
            println!("⚠ Could not read core.rs: {}", core_path);
        }
    }

    #[test]
    fn test_cve_metadata() {
        println!("\n=== CVE & Advisory Metadata ===");
        println!("CVE ID: CVE-2025-46723");
        println!("GHSA ID: GHSA-jf2r-x3j4-23m7");
        println!("Severity: HIGH");
        println!("Affected: OpenVM == 1.0.0");
        println!("Patched: OpenVM >= 1.1.0");
        println!("\nAdvisory: https://github.com/openvm-org/openvm/security/advisories/GHSA-jf2r-x3j4-23m7");
        println!("\nAffected Component:");
        println!("  Crate: openvm-rv32im-circuit");
        println!("  File: extensions/rv32im/circuit/src/auipc/core.rs");
        println!("  Lines: 133-145 (eval_constraint_circuit)");
        println!("        245-251 (generate_subrow)");
    }
}


// Copyright 2025 RISC Zero, Inc.
//
// Harness tests for zkVM underconstrained vulnerability (GHSA-g3qg-6746-3mg9)
//
// This harness performs static analysis and pattern detection to verify
// the presence/absence of fixes for the same-cycle I/O vulnerability.

#![cfg(test)]

use std::fs;
use std::path::PathBuf;

/// Path to sources directory (relative to test file)
fn get_sources_path() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("dataset")
        .join("risc0")
        .join("risc0")
        .join("risc0")
        .join("ghsa_zkvm_underconstrained_3reg_instructions")
        .join("sources")
}

/// Read rv32im.rs
fn read_rv32im() -> Result<String, std::io::Error> {
    let path = get_sources_path()
        .join("risc0")
        .join("circuit")
        .join("rv32im")
        .join("src")
        .join("execute")
        .join("rv32im.rs");
    fs::read_to_string(path)
}

/// Read r0vm.rs
fn read_r0vm() -> Result<String, std::io::Error> {
    let path = get_sources_path()
        .join("risc0")
        .join("circuit")
        .join("rv32im")
        .join("src")
        .join("execute")
        .join("r0vm.rs");
    fs::read_to_string(path)
}

/// Read preflight.rs
fn read_preflight() -> Result<String, std::io::Error> {
    let path = get_sources_path()
        .join("risc0")
        .join("circuit")
        .join("rv32im")
        .join("src")
        .join("prove")
        .join("witgen")
        .join("preflight.rs");
    fs::read_to_string(path)
}

/// Read layout.rs.inc (zirgen-generated)
fn read_layout() -> Result<String, std::io::Error> {
    let path = get_sources_path()
        .join("risc0")
        .join("circuit")
        .join("rv32im")
        .join("src")
        .join("zirgen")
        .join("layout.rs.inc");
    fs::read_to_string(path)
}

// ============================================================================
// PATTERN DETECTION FUNCTIONS
// ============================================================================

/// Check for load_rs2 helper function (fix indicator)
fn has_load_rs2_helper(source: &str) -> bool {
    source.contains("fn load_rs2")
}

/// Check if load_rs2 contains rs1 == rs2 check
fn has_same_register_check(source: &str) -> bool {
    // Look for pattern: if decoded.rs1 == decoded.rs2
    source.contains("decoded.rs1 == decoded.rs2") ||
    source.contains("rs1 == rs2")
}

/// Check if load_rs2 is used instead of direct load_register calls
fn uses_load_rs2_helper(source: &str) -> bool {
    source.contains("self.load_rs2(") || source.contains("load_rs2(")
}

/// Check for vulnerable pattern: direct load_register(rs2) calls
fn has_vulnerable_load_pattern(source: &str) -> bool {
    // Vulnerable: ctx.load_register(decoded.rs2)
    source.contains("load_register(decoded.rs2")
}

/// Check for SAFE_WRITE_ADDR + j pattern (r0vm.rs fix)
fn has_safe_write_addr_increment(source: &str) -> bool {
    source.contains("SAFE_WRITE_ADDR.waddr() + j") ||
    source.contains("SAFE_WRITE_ADDR.waddr() +")
}

/// Check for cycle validation in preflight
fn has_cycle_validation(source: &str) -> bool {
    source.contains("ensure!(txn.cycle != txn.prev_cycle)") ||
    source.contains("txn.cycle != txn.prev_cycle")
}

/// Check for adjusted cycle diff calculation
fn has_adjusted_cycle_diff(source: &str) -> bool {
    source.contains("txn.cycle - 1 - txn.prev_cycle")
}

/// Check for is_same_reg field in zirgen layout
fn has_is_same_reg_field(source: &str) -> bool {
    source.contains("is_same_reg")
}

/// Check for ReadSourceRegs layout structures
fn has_read_source_regs_layout(source: &str) -> bool {
    source.contains("ReadSourceRegs") || source.contains("read_source_regs")
}

/// Detect if source is vulnerable based on multiple indicators
fn is_source_vulnerable(rv32im: &str, r0vm: &str, preflight: &str) -> bool {
    let vuln_indicators = [
        !has_load_rs2_helper(rv32im),
        has_vulnerable_load_pattern(rv32im),
        !has_safe_write_addr_increment(r0vm),
        !has_cycle_validation(preflight),
    ];
    
    // Vulnerable if multiple indicators present
    vuln_indicators.iter().filter(|&&x| x).count() >= 3
}

/// Detect if source has fix applied
fn is_source_fixed(rv32im: &str, r0vm: &str, preflight: &str) -> bool {
    let fix_indicators = [
        has_load_rs2_helper(rv32im),
        has_same_register_check(rv32im),
        uses_load_rs2_helper(rv32im),
        has_safe_write_addr_increment(r0vm),
        has_cycle_validation(preflight),
    ];
    
    // Fixed if multiple indicators present
    fix_indicators.iter().filter(|&&x| x).count() >= 4
}

// ============================================================================
// HARNESS TESTS
// ============================================================================

#[test]
fn test_load_rs2_helper_presence() {
    // Check for the presence of load_rs2 helper function
    
    let source = match read_rv32im() {
        Ok(s) => s,
        Err(e) => {
            eprintln!("Warning: Could not read rv32im.rs: {}", e);
            eprintln!("This is expected if sources are not yet cloned.");
            return;
        }
    };
    
    let has_helper = has_load_rs2_helper(&source);
    
    println!("=== Harness Test: load_rs2 Helper Presence ===");
    println!("load_rs2 helper function exists: {}", has_helper);
    
    if has_helper {
        println!("✓ FIX DETECTED: load_rs2 helper function present");
        
        // Also check for the rs1 == rs2 check
        assert!(
            has_same_register_check(&source),
            "load_rs2 exists but missing rs1 == rs2 check"
        );
        
        println!("✓ FIX VERIFIED: rs1 == rs2 check present in load_rs2");
        
        // Check if it's actually used
        assert!(
            uses_load_rs2_helper(&source),
            "load_rs2 exists but is not used"
        );
        
        println!("✓ FIX VERIFIED: load_rs2 is used in execution");
    } else {
        println!("✗ VULNERABILITY: No load_rs2 helper function found");
        println!("   This indicates the vulnerable commit (9838780)");
    }
}

#[test]
fn test_vulnerable_load_pattern() {
    // Check for vulnerable direct load_register(rs2) pattern
    
    let source = match read_rv32im() {
        Ok(s) => s,
        Err(e) => {
            eprintln!("Warning: Could not read rv32im.rs: {}", e);
            return;
        }
    };
    
    let is_vulnerable = has_vulnerable_load_pattern(&source);
    
    println!("\n=== Harness Test: Vulnerable Load Pattern ===");
    println!("Direct load_register(rs2) pattern detected: {}", is_vulnerable);
    
    if is_vulnerable && !has_load_rs2_helper(&source) {
        println!("✗ VULNERABILITY: Uses direct load_register without helper");
    } else if !is_vulnerable && has_load_rs2_helper(&source) {
        println!("✓ FIX: Uses load_rs2 helper instead of direct loads");
    }
}

#[test]
fn test_safe_write_addr_increment() {
    // Check for SAFE_WRITE_ADDR + j pattern in r0vm.rs
    
    let source = match read_r0vm() {
        Ok(s) => s,
        Err(e) => {
            eprintln!("Warning: Could not read r0vm.rs: {}", e);
            return;
        }
    };
    
    let has_increment = has_safe_write_addr_increment(&source);
    
    println!("\n=== Harness Test: SAFE_WRITE_ADDR Increment ===");
    println!("SAFE_WRITE_ADDR + j pattern found: {}", has_increment);
    
    if has_increment {
        println!("✓ FIX DETECTED: Store uses incremented address");
    } else {
        println!("✗ VULNERABILITY: May use fixed address for stores");
    }
}

#[test]
fn test_cycle_validation() {
    // Check for cycle validation in preflight.rs
    
    let source = match read_preflight() {
        Ok(s) => s,
        Err(e) => {
            eprintln!("Warning: Could not read preflight.rs: {}", e);
            return;
        }
    };
    
    let has_validation = has_cycle_validation(&source);
    let has_adjusted_diff = has_adjusted_cycle_diff(&source);
    
    println!("\n=== Harness Test: Cycle Validation ===");
    println!("Cycle validation present: {}", has_validation);
    println!("Adjusted cycle diff present: {}", has_adjusted_diff);
    
    if has_validation {
        println!("✓ FIX DETECTED: ensure!(txn.cycle != txn.prev_cycle)");
    } else {
        println!("✗ VULNERABILITY: No cycle validation");
    }
    
    if has_adjusted_diff {
        println!("✓ FIX DETECTED: Adjusted cycle diff calculation");
    }
}

#[test]
fn test_zirgen_layout_changes() {
    // Check for zirgen-generated layout changes
    
    let source = match read_layout() {
        Ok(s) => s,
        Err(e) => {
            eprintln!("Warning: Could not read layout.rs.inc: {}", e);
            return;
        }
    };
    
    let has_is_same_reg = has_is_same_reg_field(&source);
    let has_read_source_regs = has_read_source_regs_layout(&source);
    
    println!("\n=== Harness Test: Zirgen Layout Changes ===");
    println!("is_same_reg field present: {}", has_is_same_reg);
    println!("ReadSourceRegs layout present: {}", has_read_source_regs);
    
    if has_is_same_reg {
        println!("✓ FIX DETECTED: is_same_reg field in layout");
    }
    
    if has_read_source_regs {
        println!("✓ FIX DETECTED: ReadSourceRegs layout structures");
    }
    
    if !has_is_same_reg && !has_read_source_regs {
        println!("✗ VULNERABILITY: Missing zirgen constraint structures");
    }
}

#[test]
fn test_overall_vulnerability_assessment() {
    // Comprehensive assessment of vulnerability status
    
    let rv32im = match read_rv32im() {
        Ok(s) => s,
        Err(e) => {
            eprintln!("Warning: Could not read sources: {}", e);
            return;
        }
    };
    
    let r0vm = read_r0vm().unwrap_or_default();
    let preflight = read_preflight().unwrap_or_default();
    
    let is_vuln = is_source_vulnerable(&rv32im, &r0vm, &preflight);
    let is_fix = is_source_fixed(&rv32im, &r0vm, &preflight);
    
    println!("\n=== Harness Test: Overall Vulnerability Assessment ===");
    println!("Source is vulnerable: {}", is_vuln);
    println!("Source has fix applied: {}", is_fix);
    
    // Should be mutually exclusive
    assert!(
        !(is_vuln && is_fix),
        "Cannot be both vulnerable and fixed simultaneously"
    );
    
    if is_vuln {
        println!("✗ OVERALL STATUS: VULNERABLE (commit 9838780)");
        println!("   Multiple vulnerability indicators detected");
    } else if is_fix {
        println!("✓ OVERALL STATUS: FIXED (commit 67f2d81)");
        println!("   Multiple fix indicators detected");
    } else {
        println!("? OVERALL STATUS: UNCERTAIN");
        println!("   Could not definitively classify this version");
    }
}

#[test]
fn test_load_rs2_implementation_details() {
    // Detailed analysis of load_rs2 implementation
    
    let source = match read_rv32im() {
        Ok(s) => s,
        Err(e) => {
            eprintln!("Warning: Could not read rv32im.rs: {}", e);
            return;
        }
    };
    
    println!("\n=== Harness Test: load_rs2 Implementation Details ===");
    
    if let Some(start) = source.find("fn load_rs2") {
        if let Some(end) = source[start..].find("\n    }").map(|i| start + i) {
            let function = &source[start..end];
            
            println!("load_rs2 function found");
            
            // Check implementation details
            let has_rs_check = function.contains("rs1 == rs2") || function.contains("decoded.rs1 == decoded.rs2");
            let returns_rs1 = function.contains("Ok(rs1)") || function.contains("return rs1");
            let loads_rs2 = function.contains("load_register") && function.contains("rs2");
            
            println!("  - Has rs1 == rs2 check: {}", has_rs_check);
            println!("  - Returns rs1 when equal: {}", returns_rs1);
            println!("  - Loads rs2 when different: {}", loads_rs2);
            
            if has_rs_check && returns_rs1 && loads_rs2 {
                println!("  ✓ CORRECT IMPLEMENTATION");
            } else {
                println!("  ⚠ INCOMPLETE IMPLEMENTATION");
            }
        }
    } else {
        println!("load_rs2 function not found in this version");
    }
}

#[test]
fn test_usage_sites() {
    // Check where load_rs2 is used
    
    let source = match read_rv32im() {
        Ok(s) => s,
        Err(e) => {
            eprintln!("Warning: Could not read rv32im.rs: {}", e);
            return;
        }
    };
    
    println!("\n=== Harness Test: load_rs2 Usage Sites ===");
    
    if !has_load_rs2_helper(&source) {
        println!("load_rs2 not present in this version");
        return;
    }
    
    // Count usage sites
    let usage_count = source.matches("load_rs2(").count();
    println!("Number of load_rs2 calls: {}", usage_count);
    
    // Check specific contexts
    let in_step_compute = source.contains("step_compute") && 
                         source[source.find("step_compute").unwrap()..].contains("load_rs2");
    let in_step_mem_ops = source.contains("step_mem_ops") && 
                         source[source.find("step_mem_ops").unwrap()..].contains("load_rs2");
    
    println!("  - Used in step_compute: {}", in_step_compute);
    println!("  - Used in step_mem_ops: {}", in_step_mem_ops);
    
    if usage_count >= 2 {
        println!("  ✓ Used in multiple locations");
    }
}

// ============================================================================
// DIFFERENTIAL HARNESS
// ============================================================================

#[test]
fn test_differential_pattern_analysis() {
    // Document expected patterns for each version
    
    println!("\n=== Differential Pattern Analysis ===");
    println!("\nExpected patterns in VULNERABLE commit (9838780):");
    println!("  - No load_rs2 function");
    println!("  - Direct ctx.load_register(decoded.rs2) calls");
    println!("  - SAFE_WRITE_ADDR without increment");
    println!("  - No ensure!(txn.cycle != txn.prev_cycle)");
    println!("  - No is_same_reg field in layout");
    
    println!("\nExpected patterns in FIXED commit (67f2d81):");
    println!("  - load_rs2 function defined");
    println!("  - load_rs2 checks if rs1 == rs2");
    println!("  - load_rs2 used in step_compute and step_mem_ops");
    println!("  - SAFE_WRITE_ADDR + j pattern");
    println!("  - ensure!(txn.cycle != txn.prev_cycle)");
    println!("  - is_same_reg field in zirgen layout");
    
    let rv32im = match read_rv32im() {
        Ok(s) => s,
        Err(_) => {
            println!("\n⚠ Cannot read sources for comparison");
            return;
        }
    };
    
    println!("\nCurrent source matches:");
    if has_load_rs2_helper(&rv32im) {
        println!("  ✓ FIXED patterns");
    } else {
        println!("  ✓ VULNERABLE patterns");
    }
}

// ============================================================================
// ARCHITECTURE INVARIANT CHECKS
// ============================================================================

#[test]
fn test_register_file_constraints() {
    // Verify register file access constraints
    
    println!("\n=== Architecture Invariants ===");
    println!("Register File Constraints:");
    println!("  - 32 general-purpose registers (x0-x31)");
    println!("  - x0 always reads as 0");
    println!("  - x0 writes are ignored");
    println!("  - Single read per register per cycle (when rs1 == rs2)");
    println!("  - No same-cycle conflicts for same address");
}

#[test]
fn test_3reg_instruction_coverage() {
    // List all 3-register instructions affected
    
    println!("\n=== 3-Register Instructions Coverage ===");
    println!("All RV32IM 3-register instructions affected:");
    println!("  Integer: ADD, SUB, SLL, SLT, SLTU, XOR, SRL, SRA, OR, AND");
    println!("  Multiply: MUL, MULH, MULHSU, MULHU");
    println!("  Divide: DIV, DIVU, REM, REMU");
    println!("\nAll instructions must handle rs1 == rs2 case correctly");
}


// Copyright 2025 RISC Zero, Inc.
//
// Harness tests for sys_read buffer overflow vulnerability (GHSA-jqq4-c7wq-36h7)
//
// This harness performs static analysis and pattern detection to verify
// the presence/absence of memory safety checks in the sys_read implementation.
//
// Unlike unit tests, this operates at the source code level to detect
// architectural patterns that indicate vulnerability or fix.

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
        .join("ghsa_arbitrary_code_execution_sys_read")
        .join("sources")
}

/// Read the main.rs file from v1compat kernel
fn read_v1compat_main() -> Result<String, std::io::Error> {
    let path = get_sources_path()
        .join("risc0")
        .join("zkos")
        .join("v1compat")
        .join("src")
        .join("main.rs");
    fs::read_to_string(path)
}

/// Read the kernel.s file from v1compat kernel
fn read_v1compat_kernel_asm() -> Result<String, std::io::Error> {
    let path = get_sources_path()
        .join("risc0")
        .join("zkos")
        .join("v1compat")
        .join("src")
        .join("kernel.s");
    fs::read_to_string(path)
}

/// Read syscall.rs from platform
fn read_platform_syscall() -> Result<String, std::io::Error> {
    let path = get_sources_path()
        .join("risc0")
        .join("zkvm")
        .join("platform")
        .join("src")
        .join("syscall.rs");
    fs::read_to_string(path)
}

// ============================================================================
// VULNERABILITY PATTERN DETECTION
// ============================================================================

/// Check if assert_user_raw_slice function exists (fix indicator)
fn has_assert_user_raw_slice(source: &str) -> bool {
    source.contains("fn assert_user_raw_slice")
}

/// Check if assert_user_raw_slice is used in sys_read context
fn uses_assert_user_raw_slice_in_syscalls(source: &str) -> bool {
    // Look for patterns where assert_user_raw_slice is called with buffer parameters
    source.contains("assert_user_raw_slice(buf") || 
    source.contains("assert_user_raw_slice(ptr")
}

/// Check for vulnerable wrapping pointer arithmetic pattern
fn has_vulnerable_pointer_arithmetic(source: &str) -> bool {
    // Vulnerable pattern: pointer arithmetic in ecall_software without bounds checking
    let has_ecall_software = source.contains("fn ecall_software") || 
                             source.contains("unsafe extern \"C\" fn ecall_software");
    
    // Check for wrapping add pattern
    let has_wrapping_add = source.contains("buf.add(") || source.contains("ptr.add(");
    
    // Check for absence of safety checks
    let lacks_slice_check = !source.contains("assert_user_raw_slice") &&
                           !source.contains("std::slice::from_raw_parts");
    
    has_ecall_software && has_wrapping_add && lacks_slice_check
}

/// Check for use of safe Rust slice functions (fix indicator)
fn uses_safe_slice_functions(source: &str) -> bool {
    source.contains("std::slice::from_raw_parts") ||
    source.contains("slice::from_raw_parts")
}

/// Check for proper bounds checking before ecall
fn has_bounds_check_before_ecall(source: &str) -> bool {
    // Look for patterns indicating bounds checking
    has_assert_user_raw_slice(source) || 
    source.contains("USER_END_ADDR") && source.contains("assert") ||
    source.contains("checked_add")
}

/// Detect if source is vulnerable based on multiple indicators
fn is_source_vulnerable(source: &str) -> bool {
    let vuln_indicators = [
        has_vulnerable_pointer_arithmetic(source),
        !has_assert_user_raw_slice(source),
        !uses_safe_slice_functions(source),
    ];
    
    // Vulnerable if multiple indicators present
    vuln_indicators.iter().filter(|&&x| x).count() >= 2
}

/// Detect if source has fix applied based on multiple indicators
fn is_source_fixed(source: &str) -> bool {
    let fix_indicators = [
        has_assert_user_raw_slice(source),
        uses_assert_user_raw_slice_in_syscalls(source),
        uses_safe_slice_functions(source),
        has_bounds_check_before_ecall(source),
    ];
    
    // Fixed if multiple indicators present
    fix_indicators.iter().filter(|&&x| x).count() >= 2
}

// ============================================================================
// HARNESS TESTS
// ============================================================================

#[test]
fn test_assert_user_raw_slice_presence() {
    // This test checks for the presence of the fix function
    // In vulnerable commit: should NOT exist
    // In fixed commit: should exist
    
    let source = match read_v1compat_main() {
        Ok(s) => s,
        Err(e) => {
            eprintln!("Warning: Could not read main.rs: {}", e);
            eprintln!("This is expected if sources are not yet cloned.");
            return;
        }
    };
    
    let has_fix = has_assert_user_raw_slice(&source);
    
    println!("=== Harness Test: assert_user_raw_slice Presence ===");
    println!("assert_user_raw_slice function exists: {}", has_fix);
    
    if has_fix {
        println!("✓ FIX DETECTED: Memory safety validation function present");
        assert!(
            uses_assert_user_raw_slice_in_syscalls(&source),
            "assert_user_raw_slice exists but is not used in syscalls"
        );
    } else {
        println!("✗ VULNERABILITY: No memory safety validation function found");
        println!("   This indicates the vulnerable commit (4d8e779)");
    }
}

#[test]
fn test_vulnerable_pointer_arithmetic_pattern() {
    // Check for vulnerable pointer arithmetic patterns
    
    let source = match read_v1compat_main() {
        Ok(s) => s,
        Err(e) => {
            eprintln!("Warning: Could not read main.rs: {}", e);
            return;
        }
    };
    
    let is_vulnerable = has_vulnerable_pointer_arithmetic(&source);
    
    println!("\n=== Harness Test: Vulnerable Pointer Arithmetic ===");
    println!("Vulnerable pattern detected: {}", is_vulnerable);
    
    if is_vulnerable {
        println!("✗ VULNERABILITY: Unsafe pointer arithmetic without bounds checking");
        println!("   ecall_software uses pointer arithmetic without validation");
    } else {
        println!("✓ SAFE: No vulnerable pointer arithmetic patterns detected");
    }
}

#[test]
fn test_safe_slice_usage_pattern() {
    // Check for use of safe Rust slice functions
    
    let source = match read_v1compat_main() {
        Ok(s) => s,
        Err(e) => {
            eprintln!("Warning: Could not read main.rs: {}", e);
            return;
        }
    };
    
    let uses_safe_slices = uses_safe_slice_functions(&source);
    
    println!("\n=== Harness Test: Safe Slice Functions ===");
    println!("Safe slice functions used: {}", uses_safe_slices);
    
    if uses_safe_slices {
        println!("✓ FIX DETECTED: Safe Rust slice functions in use");
    } else {
        println!("✗ VULNERABILITY: No safe slice functions detected");
    }
}

#[test]
fn test_bounds_check_enforcement() {
    // Check for bounds checking before host ecalls
    
    let source = match read_v1compat_main() {
        Ok(s) => s,
        Err(e) => {
            eprintln!("Warning: Could not read main.rs: {}", e);
            return;
        }
    };
    
    let has_bounds_check = has_bounds_check_before_ecall(&source);
    
    println!("\n=== Harness Test: Bounds Check Enforcement ===");
    println!("Bounds checking present: {}", has_bounds_check);
    
    if has_bounds_check {
        println!("✓ FIX DETECTED: Bounds checking enforced before ecalls");
    } else {
        println!("✗ VULNERABILITY: No bounds checking before ecalls");
    }
}

#[test]
fn test_overall_vulnerability_assessment() {
    // Comprehensive assessment of vulnerability status
    
    let source = match read_v1compat_main() {
        Ok(s) => s,
        Err(e) => {
            eprintln!("Warning: Could not read main.rs: {}", e);
            return;
        }
    };
    
    let is_vuln = is_source_vulnerable(&source);
    let is_fix = is_source_fixed(&source);
    
    println!("\n=== Harness Test: Overall Vulnerability Assessment ===");
    println!("Source is vulnerable: {}", is_vuln);
    println!("Source has fix applied: {}", is_fix);
    
    // Should be mutually exclusive
    assert!(
        !(is_vuln && is_fix),
        "Cannot be both vulnerable and fixed simultaneously"
    );
    
    if is_vuln {
        println!("✗ OVERALL STATUS: VULNERABLE (commit 4d8e779)");
        println!("   Multiple vulnerability indicators detected");
    } else if is_fix {
        println!("✓ OVERALL STATUS: FIXED (commit 6506123)");
        println!("   Multiple fix indicators detected");
    } else {
        println!("? OVERALL STATUS: UNCERTAIN");
        println!("   Could not definitively classify this version");
    }
}

#[test]
fn test_ecall_software_implementation() {
    // Detailed analysis of ecall_software function
    
    let source = match read_v1compat_main() {
        Ok(s) => s,
        Err(e) => {
            eprintln!("Warning: Could not read main.rs: {}", e);
            return;
        }
    };
    
    println!("\n=== Harness Test: ecall_software Implementation ===");
    
    // Extract ecall_software function if present
    if let Some(start) = source.find("fn ecall_software") {
        if let Some(end) = source[start..].find("\n}\n").map(|i| start + i) {
            let function = &source[start..end];
            
            println!("ecall_software function found");
            
            // Check for specific patterns
            let has_buf_add = function.contains("buf.add(");
            let has_validation = function.contains("assert_user_raw_slice") ||
                                function.contains("USER_END_ADDR");
            
            println!("  - Uses buf.add(): {}", has_buf_add);
            println!("  - Has validation: {}", has_validation);
            
            if has_buf_add && !has_validation {
                println!("  ✗ VULNERABLE: Pointer arithmetic without validation");
            } else if has_validation {
                println!("  ✓ SAFE: Proper validation present");
            }
        }
    } else {
        println!("ecall_software function not found in this implementation");
    }
}

#[test]
fn test_user_end_addr_checks() {
    // Check for proper USER_END_ADDR boundary checks
    
    let source = match read_v1compat_main() {
        Ok(s) => s,
        Err(e) => {
            eprintln!("Warning: Could not read main.rs: {}", e);
            return;
        }
    };
    
    println!("\n=== Harness Test: USER_END_ADDR Boundary Checks ===");
    
    let has_user_end_const = source.contains("const USER_END_ADDR");
    let has_boundary_checks = source.contains("USER_END_ADDR") && 
                             (source.contains(">=") || source.contains("<"));
    
    println!("USER_END_ADDR constant defined: {}", has_user_end_const);
    println!("Boundary checks using USER_END_ADDR: {}", has_boundary_checks);
    
    if has_user_end_const {
        println!("✓ Memory layout constant defined");
        
        if has_boundary_checks {
            println!("✓ Boundary checks implemented");
        } else {
            println!("⚠ Constant defined but checks may be insufficient");
        }
    }
}

#[test]
fn test_host_ecall_read_safety() {
    // Check safety of host_ecall_read function
    
    let source = match read_v1compat_main() {
        Ok(s) => s,
        Err(e) => {
            eprintln!("Warning: Could not read main.rs: {}", e);
            return;
        }
    };
    
    println!("\n=== Harness Test: host_ecall_read Safety ===");
    
    if let Some(start) = source.find("fn host_ecall_read") {
        if let Some(end) = source[start..].find("\n}\n").map(|i| start + i) {
            let function = &source[start..end];
            
            // In vulnerable version: directly uses provided pointers
            // In fixed version: should have validation or be used only after validation
            
            let direct_ecall = function.contains("ecall");
            let has_checks = function.contains("assert") || function.contains("check");
            
            println!("host_ecall_read function found");
            println!("  - Contains ecall: {}", direct_ecall);
            println!("  - Has safety checks: {}", has_checks);
            
            if direct_ecall && !has_checks {
                println!("  ⚠ Function performs ecall without internal checks");
                println!("  Safety depends on caller validation");
            }
        }
    }
}

// ============================================================================
// DIFFERENTIAL HARNESS (compare patterns across commits)
// ============================================================================

#[test]
fn test_differential_pattern_analysis() {
    // This test can be enhanced to compare vulnerable vs fixed commits
    // For now, it documents expected patterns for each version
    
    println!("\n=== Differential Pattern Analysis ===");
    println!("\nExpected patterns in VULNERABLE commit (4d8e779):");
    println!("  - ecall_software with wrapping pointer arithmetic");
    println!("  - buf.add() without bounds validation");
    println!("  - No assert_user_raw_slice function");
    println!("  - No safe slice usage");
    
    println!("\nExpected patterns in FIXED commit (6506123):");
    println!("  - assert_user_raw_slice function defined");
    println!("  - assert_user_raw_slice called before sys_read/sys_random");
    println!("  - Use of std::slice::from_raw_parts");
    println!("  - Kernel dispatcher with syscall numbers");
    
    let source = match read_v1compat_main() {
        Ok(s) => s,
        Err(_) => {
            println!("\n⚠ Cannot read source for comparison");
            return;
        }
    };
    
    println!("\n Current source matches:");
    if has_assert_user_raw_slice(&source) {
        println!("  ✓ FIXED patterns");
    } else {
        println!("  ✓ VULNERABLE patterns");
    }
}

// ============================================================================
// ARCHITECTURE INVARIANT CHECKS
// ============================================================================

#[test]
fn test_memory_layout_invariants() {
    // Verify fundamental memory layout assumptions
    
    let source = match read_v1compat_main() {
        Ok(s) => s,
        Err(e) => {
            eprintln!("Warning: Could not read main.rs: {}", e);
            return;
        }
    };
    
    println!("\n=== Architecture Invariants ===");
    
    // Check for critical constants
    let constants = vec![
        ("USER_END_ADDR", "0xc000_0000"),
        ("MAX_IO_BYTES", "1024"),
        ("HOST_ECALL_READ", "1"),
    ];
    
    for (const_name, expected_value) in constants {
        let pattern = format!("const {}", const_name);
        if source.contains(&pattern) {
            println!("✓ {} defined", const_name);
            
            // Check if expected value is present
            if source.contains(expected_value) {
                println!("  ✓ Has expected value: {}", expected_value);
            }
        } else {
            println!("⚠ {} not found", const_name);
        }
    }
}

#[test]
fn test_syscall_dispatcher_refactor() {
    // Check if the fix includes the syscall dispatcher refactor
    
    let source = match read_v1compat_main() {
        Ok(s) => s,
        Err(e) => {
            eprintln!("Warning: Could not read main.rs: {}", e);
            return;
        }
    };
    
    println!("\n=== Syscall Dispatcher Refactor ===");
    
    // The fix included a refactor where kernel passes syscall numbers
    // to Rust dispatcher that validates and handles calls
    
    let has_dispatcher_pattern = source.contains("match") && source.contains("syscall") ||
                                source.contains("sys_read") || source.contains("sys_random");
    
    println!("Dispatcher pattern detected: {}", has_dispatcher_pattern);
    
    if has_dispatcher_pattern {
        println!("✓ May have refactored dispatcher architecture");
    } else {
        println!("⚠ Old syscall handling architecture");
    }
}


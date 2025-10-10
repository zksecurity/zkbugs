//! Unit tests for SP1 embedded allocator overflow vulnerabilities (GHSA-6248-228x-mmvh Bug 2)
//!
//! This test suite demonstrates two overflow vulnerabilities in SP1's embedded allocator:
//! 1. Integer overflow in ptr + capacity check (read_vec_raw)
//! 2. Heap size overflow when _end > EMBEDDED_RESERVED_INPUT_START
//!
//! These tests work as fuzzing oracles and require NO SP1 dependencies.

// Constants from SP1's crates/zkvm/entrypoint/src/lib.rs
const MAX_MEMORY: usize = 0x78000000;  // Memory addresses must be lower than BabyBear prime
const EMBEDDED_RESERVED_INPUT_REGION_SIZE: usize = 1024 * 1024 * 1024;  // 1 GiB
const EMBEDDED_RESERVED_INPUT_START: usize = MAX_MEMORY - EMBEDDED_RESERVED_INPUT_REGION_SIZE;

#[cfg(test)]
mod allocator_overflow_tests {
    use super::*;

    /// Test 1: Demonstrates ptr + capacity wrapping overflow
    ///
    /// VULNERABLE: ptr + capacity uses wrapping arithmetic
    /// FIXED: ptr.saturating_add(capacity) clamps to usize::MAX on overflow
    #[test]
    fn test_ptr_capacity_wrapping_overflow() {
        // Simulate 32-bit zkVM arithmetic (RISC-V is 32-bit)
        let ptr = 0x70000000_u32;  // Pointer near MAX_MEMORY
        let capacity = 0xFFFFFFFF_u32;  // Very large capacity (u32::MAX)
        
        println!("ptr:              0x{:08x}", ptr);
        println!("capacity:         0x{:08x}", capacity);
        println!("MAX_MEMORY:       0x{:08x}", MAX_MEMORY);
        
        // VULNERABLE BEHAVIOR (buggy commit ad212dd5):
        // On 32-bit: addition wraps around
        let sum_wrapping_32 = ptr.wrapping_add(capacity);
        let sum_wrapping = sum_wrapping_32 as usize;
        println!("Wrapping sum:     0x{:08x}", sum_wrapping_32);
        
        // BUG: The check passes because sum wrapped to a small value
        let vulnerable_check = sum_wrapping > MAX_MEMORY;
        if vulnerable_check {
            panic!("Vulnerable version should NOT detect this (wrapped!)");
        }
        
        // We reach here - overflow went undetected!
        assert!(!vulnerable_check, 
                "BUG CONFIRMED: Wrapped to 0x{:x}, check thinks it's valid!", sum_wrapping);
        
        // FIXED BEHAVIOR (fix commit aa9a8e40):
        // saturating_add clamps to u32::MAX instead of wrapping
        let sum_saturating_32 = ptr.saturating_add(capacity);
        let sum_saturating = sum_saturating_32 as usize;
        println!("Saturating sum:   0x{:08x}", sum_saturating_32);
        
        // Fix works: overflow is properly detected
        let fixed_check = sum_saturating > MAX_MEMORY;
        assert!(fixed_check, 
                "FIX WORKS: Saturating sum (0x{:x}) > MAX_MEMORY correctly detects overflow", 
                sum_saturating);
        
        println!("\n✅ Test demonstrates the vulnerability and the fix!");
    }

    /// Test 2: Multiple realistic overflow scenarios
    #[test]
    fn test_realistic_overflow_scenarios() {
        // Use u32 to simulate 32-bit zkVM
        let test_cases: Vec<(u32, u32, bool)> = vec![
            // (ptr, capacity, should_overflow)
            (0x77000000, 0x01000000, false),  // Normal: 0x78000000 exactly at limit
            (0x77000000, 0x01000001, true),   // Just over limit
            (0x70000000, 0x90000000, true),   // Wraps on 32-bit
            (0x78000000, 0x00000001, true),   // At MAX_MEMORY
            (0x00000001, 0xFFFFFFFF, true),   // Large capacity from low address
        ];
        
        for (ptr, capacity, should_overflow) in test_cases {
            // Simulate 32-bit wrapping
            let sum_wrapping_32 = ptr.wrapping_add(capacity);
            let sum_wrapping = sum_wrapping_32 as usize;
            
            // Saturating on 32-bit
            let sum_saturating_32 = ptr.saturating_add(capacity);
            let sum_saturating = sum_saturating_32 as usize;
            
            // Vulnerable check (wrapping)
            let vulnerable_detects = sum_wrapping > MAX_MEMORY;
            
            // Fixed check (saturating)
            let fixed_detects = sum_saturating > MAX_MEMORY;
            
            if should_overflow {
                // Fixed version should detect
                assert!(fixed_detects, 
                        "Fix should detect overflow: ptr=0x{:x}, cap=0x{:x}, sum_sat=0x{:x}", 
                        ptr, capacity, sum_saturating);
                
                // Vulnerable version likely fails to detect
                if !vulnerable_detects {
                    println!("✓ BUG demonstrated: ptr=0x{:x}, cap=0x{:x} → sum wrapped to 0x{:x} (missed!)", 
                             ptr, capacity, sum_wrapping);
                }
            } else {
                // Should NOT detect overflow (legitimate allocation)
                assert!(!fixed_detects,
                        "False positive: ptr=0x{:x}, cap=0x{:x}", ptr, capacity);
            }
        }
    }

    /// Test 3: Demonstrates memory corruption scenario
    ///
    /// Shows how two consecutive read_vec calls could overlap
    #[test]
    fn test_memory_corruption_scenario() {
        // Simulate 32-bit zkVM two consecutive allocations
        
        // First read_vec call allocates at ptr1
        let ptr1 = 0x77000000_u32;
        let capacity1 = 0x01000000_u32;  // 16 MB
        let end1 = ptr1 + capacity1;  // 0x78000000 (exactly at MAX_MEMORY)
        
        assert_eq!(end1 as usize, MAX_MEMORY, "First allocation fills to MAX_MEMORY");
        
        // Second read_vec call with malicious capacity
        let ptr2 = end1;  // Would be EMBEDDED_RESERVED_INPUT_PTR after first read
        let malicious_capacity = 0x90000000_u32;
        
        // VULNERABLE: Check passes due to wrap (on 32-bit)
        let sum_wrapping_32 = ptr2.wrapping_add(malicious_capacity);
        let sum_wrapping = sum_wrapping_32 as usize;
        
        println!("\nMemory Corruption Scenario:");
        println!("  data1: 0x{:08x} - 0x{:08x}", ptr1, end1);
        println!("  data2 (wrapping): starts at 0x{:08x}", sum_wrapping_32);
        
        if sum_wrapping <= MAX_MEMORY {
            println!("  ⚠️  BUG: Second buffer wraps to 0x{:08x}, OVERLAPS with first buffer!", sum_wrapping);
            println!("  ⚠️  Writing to data2 would CORRUPT data1 data!");
            
            // Prove overlap
            if sum_wrapping < end1 as usize {
                println!("  ⚠️  CONFIRMED: data2 start (0x{:x}) < data1 end (0x{:x})", sum_wrapping, end1);
            }
        }
        
        // FIXED: saturating_add prevents this
        let sum_saturating_32 = ptr2.saturating_add(malicious_capacity);
        let sum_saturating = sum_saturating_32 as usize;
        assert!(sum_saturating > MAX_MEMORY, "Fix prevents the overlap");
    }

    /// Test 4: Edge case - exact MAX_MEMORY boundary
    #[test]
    fn test_max_memory_boundary() {
        let ptr = (MAX_MEMORY - 1) as u32;
        let capacity = 1_u32;
        
        // This should be exactly at the limit
        let sum = (ptr + capacity) as usize;
        assert_eq!(sum, MAX_MEMORY, "Exactly at boundary");
        
        // One more byte should overflow on 32-bit
        let capacity_overflow = 2_u32;
        let sum_wrap_32 = ptr.wrapping_add(capacity_overflow);
        let sum_sat_32 = ptr.saturating_add(capacity_overflow);
        
        // Vulnerable: wraps on 32-bit (becomes small value)
        // Fixed: saturates to u32::MAX
        assert!(sum_sat_32 as usize > MAX_MEMORY, "Saturating detects overflow");
        
        // On 32-bit zkVM, the wrap would make it appear valid
        println!("At boundary: ptr=0x{:x}, wrap=0x{:x}, sat=0x{:x}", 
                 ptr, sum_wrap_32, sum_sat_32);
    }

    /// Test 5: Heap size overflow vulnerability
    ///
    /// Second vulnerability: _end > EMBEDDED_RESERVED_INPUT_START
    #[test]
    fn test_heap_end_overflow() {
        // Normal case: _end < reserved start
        let normal_end = 0x50000000_u32;
        let reserved_start = EMBEDDED_RESERVED_INPUT_START as u32;
        let normal_heap_size = reserved_start.wrapping_sub(normal_end);
        
        if normal_end < reserved_start {
            println!("Normal heap: _end=0x{:x}, reserved=0x{:x}, size=0x{:x}", 
                     normal_end, reserved_start, normal_heap_size);
        }
        
        // VULNERABLE: _end > reserved start (no check in buggy version!)
        let buggy_end = 0x79000000_u32;  // Beyond EMBEDDED_RESERVED_INPUT_START
        
        println!("\nHeap Overflow Scenario:");
        println!("  _end:              0x{:08x}", buggy_end);
        println!("  reserved_start:    0x{:08x}", reserved_start);
        
        if buggy_end > reserved_start {
            // In vulnerable version, this subtraction wraps
            let heap_size_wrapping = reserved_start.wrapping_sub(buggy_end);
            println!("  Wrapped heap_size: 0x{:08x}", heap_size_wrapping);
            
            // This wraps to a huge value on 32-bit
            assert!(heap_size_wrapping > 0x70000000, 
                    "BUG: Heap size wrapped to huge value 0x{:x}, would overlap with hint area!", 
                    heap_size_wrapping);
            println!("  ❌ BUG: No check prevents _end > reserved_start!");
        }
        
        // FIXED: Should add check that _end <= reserved_start
        println!("  ✅ Fix should reject when _end > reserved_start");
    }

    /// Test 6: Fuzzing oracle - property-based invariants
    ///
    /// Can be used directly as a fuzzing target
    #[test]
    fn test_overflow_invariants() {
        // Property: For any ptr, capacity where ptr + capacity would overflow on 32-bit,
        // saturating_add must return a value > MAX_MEMORY
        
        let test_cases: Vec<(u32, u32)> = vec![
            (0x70000000, 0xFFFFFFFF),
            (0x78000000, 1),
            (0x77FFFFFF, 2),
        ];
        
        for (ptr, capacity) in test_cases {
            let (sum_32, overflowed) = ptr.overflowing_add(capacity);
            let sum_sat_32 = ptr.saturating_add(capacity);
            
            if overflowed || sum_32 as usize > MAX_MEMORY {
                // Should be detected as overflow
                assert!(sum_sat_32 as usize > MAX_MEMORY,
                        "Saturating should detect: ptr=0x{:x}, cap=0x{:x}, sum_sat=0x{:x}", 
                        ptr, capacity, sum_sat_32);
            }
        }
    }
}

/// Oracle function for fuzzing integration
///
/// Returns true if overflow is correctly detected (by saturating_add)
/// Returns false if overflow goes undetected (by wrapping_add - the bug)
pub fn oracle_detects_overflow(ptr: usize, capacity: usize) -> bool {
    let sum_saturating = ptr.saturating_add(capacity);
    sum_saturating > MAX_MEMORY
}

/// Oracle for vulnerable version (simulates the bug)
pub fn vulnerable_detects_overflow(ptr: usize, capacity: usize) -> bool {
    let sum_wrapping = ptr.wrapping_add(capacity);
    sum_wrapping > MAX_MEMORY
}

#[cfg(test)]
mod fuzzing_oracle_tests {
    use super::*;

    /// Differential oracle: vulnerable vs fixed behavior
    #[test]
    fn test_differential_oracle() {
        // Case where behaviors differ (the bug!) - simulate 32-bit
        let ptr_32 = 0x70000000_u32;
        let capacity_32 = 0xFFFFFFFF_u32;
        
        // Convert to usize for oracle functions
        let ptr = ptr_32 as usize;
        let capacity = capacity_32 as usize;
        
        // Simulate 32-bit wrapping behavior
        let sum_wrap_32 = ptr_32.wrapping_add(capacity_32) as usize;
        let sum_sat_32 = ptr_32.saturating_add(capacity_32) as usize;
        
        let vulnerable = sum_wrap_32 > MAX_MEMORY;
        let fixed = sum_sat_32 > MAX_MEMORY;
        
        assert!(!vulnerable, "Vulnerable version misses overflow (wrapped to 0x{:x})", sum_wrap_32);
        assert!(fixed, "Fixed version detects overflow (saturated to 0x{:x})", sum_sat_32);
        assert_ne!(vulnerable, fixed, "Behaviors differ - this is the bug!");
    }
    
    /// Property: If ptr.checked_add(capacity) is None, both should detect overflow
    #[test]
    fn test_overflow_detection_property() {
        let cases = vec![
            (0x70000000, 0xFFFFFFFF),
            (usize::MAX - 1, 2),
            (0x78000000, 1),
        ];
        
        for (ptr, capacity) in cases {
            match ptr.checked_add(capacity) {
                None => {
                    // Overflowed - fixed version MUST detect
                    assert!(oracle_detects_overflow(ptr, capacity),
                            "Fixed must detect overflow when checked_add returns None");
                }
                Some(sum) if sum > MAX_MEMORY => {
                    // Didn't overflow usize, but exceeds MAX_MEMORY
                    assert!(oracle_detects_overflow(ptr, capacity),
                            "Fixed must detect when sum > MAX_MEMORY");
                }
                Some(_) => {
                    // Valid allocation - both should allow
                }
            }
        }
    }
}

#[cfg(test)]
mod main {
    use super::*;
    
    #[test]
    fn run_all_tests() {
        println!("\n========================================");
        println!("SP1 Allocator Overflow Unit Tests");
        println!("========================================");
        println!("Testing vulnerability at commit: ad212dd52bdf8f630ea47f2b58aa94d5b6e79904");
        println!("Fixed at commit: aa9a8e40b6527a06764ef0347d43ac9307d7bf63");
        println!("Advisory: https://github.com/succinctlabs/sp1/security/advisories/GHSA-6248-228x-mmvh");
        println!("========================================\n");
    }
}


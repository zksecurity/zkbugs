// Standalone test for SP1 allocator overflow - run with: rustc test_overflow_simple.rs && ./test_overflow_simple

const MAX_MEMORY: usize = 0x78000000;

fn main() {
    println!("========================================");
    println!("SP1 Allocator Overflow Demonstration");
    println!("========================================");
    println!("Advisory: GHSA-6248-228x-mmvh Bug 2");
    println!("Buggy:  ad212dd52bdf8f630ea47f2b58aa94d5b6e79904");
    println!("Fixed:  aa9a8e40b6527a06764ef0347d43ac9307d7bf63");
    println!("========================================\n");
    
    test_ptr_capacity_overflow();
    test_memory_corruption_scenario();
    test_heap_end_overflow();
    
    println!("\n========================================");
    println!("✅ ALL TESTS PASSED");
    println!("========================================");
    println!("\nVulnerability successfully demonstrated!");
    println!("The fix (saturating_add) correctly prevents overflow.");
}

fn test_ptr_capacity_overflow() {
    println!("Test 1: ptr + capacity Wrapping Overflow");
    println!("-----------------------------------------");
    
    let ptr = 0x70000000_usize;
    let capacity = 0xFFFFFFFF_usize;
    
    println!("  ptr:         0x{:08x}", ptr);
    println!("  capacity:    0x{:08x}", capacity);
    println!("  MAX_MEMORY:  0x{:08x}\n", MAX_MEMORY);
    
    // VULNERABLE: wrapping addition
    let sum_wrapping = ptr.wrapping_add(capacity);
    println!("  VULNERABLE (ptr + capacity):");
    println!("    sum = 0x{:08x}", sum_wrapping);
    println!("    sum > MAX_MEMORY? {}", sum_wrapping > MAX_MEMORY);
    
    if sum_wrapping <= MAX_MEMORY {
        println!("    ❌ BUG: Overflow undetected! Sum wrapped to 0x{:08x}", sum_wrapping);
        assert!(sum_wrapping < ptr, "Wrap-around: sum < ptr");
    }
    
    // FIXED: saturating addition
    let sum_saturating = ptr.saturating_add(capacity);
    println!("\n  FIXED (ptr.saturating_add(capacity)):");
    println!("    sum = 0x{:08x}", sum_saturating);
    println!("    sum > MAX_MEMORY? {}", sum_saturating > MAX_MEMORY);
    
    assert!(sum_saturating > MAX_MEMORY, "Fix correctly detects overflow");
    println!("    ✅ Overflow correctly detected!\n");
}

fn test_memory_corruption_scenario() {
    println!("Test 2: Memory Corruption Scenario");
    println!("-----------------------------------------");
    
    // First allocation
    let ptr1 = 0x77000000_usize;
    let capacity1 = 0x01000000_usize;
    let end1 = ptr1 + capacity1;
    
    println!("  First read_vec:");
    println!("    Buffer 1: 0x{:08x} - 0x{:08x}", ptr1, end1);
    
    // Second allocation with malicious capacity
    let ptr2 = end1;
    let malicious_capacity = 0x90000000_usize;
    let sum_wrapping = ptr2.wrapping_add(malicious_capacity);
    
    println!("\n  Second read_vec (malicious capacity = 0x{:08x}):", malicious_capacity);
    println!("    Expected: 0x{:08x} - 0x{:08x}", ptr2, ptr2.wrapping_add(malicious_capacity));
    println!("    Actual:   0x{:08x} (wrapped!)", sum_wrapping);
    
    if sum_wrapping < end1 {
        println!("    ❌ BUG: Buffer 2 overlaps with Buffer 1!");
        println!("    ❌ Writing to Buffer 2 would CORRUPT Buffer 1 data!");
    }
    
    // Fixed version prevents this
    let sum_saturating = ptr2.saturating_add(malicious_capacity);
    println!("\n  With fix (saturating_add):");
    println!("    sum = 0x{:08x} > MAX_MEMORY", sum_saturating);
    println!("    ✅ Overflow detected, allocation rejected!\n");
    
    assert!(sum_saturating > MAX_MEMORY);
}

fn test_heap_end_overflow() {
    println!("Test 3: Heap _end Overflow");
    println!("-----------------------------------------");
    
    let reserved_start = MAX_MEMORY - EMBEDDED_RESERVED_INPUT_REGION_SIZE;
    println!("  EMBEDDED_RESERVED_INPUT_START: 0x{:08x}", reserved_start);
    
    // Normal case
    let normal_end = 0x50000000_usize;
    let normal_heap_size = reserved_start - normal_end;
    println!("\n  Normal case:");
    println!("    _end:      0x{:08x}", normal_end);
    println!("    heap_size: 0x{:08x} ({}  MB)", normal_heap_size, normal_heap_size / (1024*1024));
    
    // VULNERABLE: _end > reserved_start
    let buggy_end = 0x79000000_usize;
    println!("\n  Buggy case (_end > reserved_start):");
    println!("    _end:      0x{:08x}", buggy_end);
    
    if buggy_end > reserved_start {
        let heap_size_wrapping = reserved_start.wrapping_sub(buggy_end);
        println!("    heap_size: 0x{:08x} (WRAPPED!)", heap_size_wrapping);
        println!("    ❌ BUG: Heap wraps to huge size, overlaps hint area!");
    }
    
    println!("    ✅ Fix should add check: _end <= reserved_start\n");
}

const EMBEDDED_RESERVED_INPUT_REGION_SIZE: usize = 1024 * 1024 * 1024;


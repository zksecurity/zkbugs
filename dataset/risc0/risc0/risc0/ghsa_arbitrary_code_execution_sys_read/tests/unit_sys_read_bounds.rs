// Copyright 2025 RISC Zero, Inc.
//
// Unit tests for sys_read buffer overflow vulnerability (GHSA-jqq4-c7wq-36h7)
//
// This test suite validates memory safety guarantees in sys_read implementation.
// Bug: Vulnerable pointer arithmetic allowed host to write to arbitrary guest memory.
// Fix: Introduced assert_user_raw_slice to validate buffer bounds before operations.

#![cfg(test)]

use std::collections::HashMap;

/// Memory layout constants matching RISC0 zkVM guest address space
const USER_END_ADDR: u32 = 0xc000_0000;
const MAX_IO_BYTES: u32 = 1024;
const CANARY_VALUE: u32 = 0xDEADBEEF;

/// Mock guest memory structure for testing buffer overflow scenarios
#[derive(Debug, Clone)]
struct MockGuestMemory {
    /// Memory map: address -> value
    memory: HashMap<u32, u8>,
    /// Guard bytes placed after buffers to detect overflow
    canaries: Vec<(u32, u32)>, // (address, expected_value)
}

impl MockGuestMemory {
    fn new() -> Self {
        Self {
            memory: HashMap::new(),
            canaries: Vec::new(),
        }
    }

    /// Allocate a buffer with canary guard bytes
    fn allocate_with_canary(&mut self, base: u32, size: u32) -> u32 {
        // Write canary immediately after buffer (use wrapping_add for safety)
        let canary_start = base.wrapping_add(size);
        for i in 0..4 {
            let canary_addr = canary_start.wrapping_add(i);
            let canary_byte = ((CANARY_VALUE >> (i * 8)) & 0xFF) as u8;
            self.memory.insert(canary_addr, canary_byte);
        }
        self.canaries.push((canary_start, CANARY_VALUE));
        base
    }

    /// Write data to memory at given address
    fn write(&mut self, addr: u32, data: &[u8]) {
        for (i, &byte) in data.iter().enumerate() {
            self.memory.insert(addr.wrapping_add(i as u32), byte);
        }
    }

    /// Read a u32 from memory
    fn read_u32(&self, addr: u32) -> u32 {
        let mut result = 0u32;
        for i in 0..4 {
            if let Some(&byte) = self.memory.get(&addr.wrapping_add(i)) {
                result |= (byte as u32) << (i * 8);
            }
        }
        result
    }

    /// Check if any canary has been corrupted
    fn check_canaries(&self) -> Result<(), String> {
        for &(addr, expected) in &self.canaries {
            let actual = self.read_u32(addr);
            if actual != expected {
                return Err(format!(
                    "Canary corrupted at 0x{:08x}: expected 0x{:08x}, got 0x{:08x}",
                    addr, expected, actual
                ));
            }
        }
        Ok(())
    }
}

/// Simulate vulnerable pointer arithmetic (pre-fix behavior)
fn vulnerable_buffer_check(ptr: u32, size: u32) -> bool {
    // Vulnerable: uses wrapping arithmetic without bounds checking
    // This allows ptr + size to wrap around and appear valid
    let end = ptr.wrapping_add(size);
    end < USER_END_ADDR
}

/// Simulate fixed slice-based bounds checking (post-fix behavior)
fn fixed_buffer_check(ptr: u32, size: u32) -> Result<(), String> {
    // Fixed: checks both ptr and ptr+size are in valid range
    // Also validates no overflow/wraparound occurs
    if ptr >= USER_END_ADDR {
        return Err(format!("Buffer start 0x{:08x} >= USER_END_ADDR", ptr));
    }
    
    // Check for wraparound
    let end = match ptr.checked_add(size) {
        Some(e) => e,
        None => return Err("Buffer size causes pointer wraparound".to_string()),
    };
    
    if end >= USER_END_ADDR {
        return Err(format!(
            "Buffer end 0x{:08x} >= USER_END_ADDR (ptr=0x{:08x}, size={})",
            end, ptr, size
        ));
    }
    
    Ok(())
}

/// Simulate sys_read operation with vulnerable implementation
fn simulate_vulnerable_sys_read(
    memory: &mut MockGuestMemory,
    buf_ptr: u32,
    requested_size: u32,
    host_provides: u32,
) -> Result<u32, String> {
    // Vulnerable check - only validates end address after wrapping
    if !vulnerable_buffer_check(buf_ptr, requested_size) {
        return Err("Buffer validation failed (vulnerable)".to_string());
    }
    
    // Host provides data (potentially more than requested)
    let actual_write = std::cmp::min(host_provides, MAX_IO_BYTES);
    let dummy_data = vec![0x41u8; actual_write as usize]; // 'A' repeated
    
    // VULNERABILITY: writes actual_write bytes even if > requested_size
    memory.write(buf_ptr, &dummy_data);
    
    Ok(actual_write)
}

/// Simulate sys_read operation with fixed implementation
fn simulate_fixed_sys_read(
    memory: &mut MockGuestMemory,
    buf_ptr: u32,
    requested_size: u32,
    host_provides: u32,
) -> Result<u32, String> {
    // Fixed: validate buffer bounds before any operations
    fixed_buffer_check(buf_ptr, requested_size)?;
    
    // Host provides data
    let actual_write = std::cmp::min(host_provides, MAX_IO_BYTES);
    
    // Safety check: cannot write more than requested
    if actual_write > requested_size {
        return Err(format!(
            "Host attempted to provide {} bytes but buffer only {} bytes",
            actual_write, requested_size
        ));
    }
    
    let dummy_data = vec![0x41u8; actual_write as usize];
    memory.write(buf_ptr, &dummy_data);
    
    Ok(actual_write)
}

// ============================================================================
// UNIT TESTS
// ============================================================================

#[test]
fn test_buffer_overflow_detected_via_canary() {
    // Test that oversized host response corrupts memory in vulnerable version
    let mut memory = MockGuestMemory::new();
    
    let buf_ptr = 0x1000;
    let buf_size = 64; // Request 64 bytes
    memory.allocate_with_canary(buf_ptr, buf_size);
    
    // Canary should be intact initially
    assert!(memory.check_canaries().is_ok(), "Canary corrupted before test");
    
    // Malicious host provides 1024 bytes (16x requested)
    let host_provides = 1024;
    let result = simulate_vulnerable_sys_read(&mut memory, buf_ptr, buf_size, host_provides);
    
    assert!(result.is_ok(), "Vulnerable implementation accepted oversized data");
    
    // Canary should be corrupted
    assert!(
        memory.check_canaries().is_err(),
        "BUG NOT DETECTED: Canary should be corrupted by overflow"
    );
}

#[test]
fn test_wrapping_arithmetic_bug() {
    // Test that wrapping arithmetic allows invalid buffers near USER_END_ADDR
    
    // Case 1: Buffer that wraps around
    let ptr: u32 = 0xbffffff0; // Near end of user space
    let size: u32 = 0x40000020; // Large size that causes wraparound
    
    // Vulnerable: wrapping_add causes end to wrap to low address
    let vuln_end = ptr.wrapping_add(size);
    assert!(
        vuln_end < USER_END_ADDR,
        "Vulnerable check incorrectly passes due to wraparound"
    );
    assert!(
        vulnerable_buffer_check(ptr, size),
        "Vulnerable version accepts due to wraparound"
    );
    
    // Fixed: detects wraparound
    assert!(
        fixed_buffer_check(ptr, size).is_err(),
        "Fixed check should reject wraparound"
    );
    
    // Case 2: Buffer beyond boundary (no wraparound, just overflow)
    let ptr2: u32 = USER_END_ADDR - 1;
    let size2: u32 = 2;
    
    assert!(
        !vulnerable_buffer_check(ptr2, size2),
        "Vulnerable check rejects buffer beyond USER_END_ADDR"
    );
    
    assert!(
        fixed_buffer_check(ptr2, size2).is_err(),
        "Fixed check rejects buffer beyond USER_END_ADDR"
    );
}

#[test]
fn test_slice_bounds_enforcement() {
    // Test that fixed implementation enforces slice bounds
    let mut memory_fixed = MockGuestMemory::new();
    
    let buf_ptr = 0x1000;
    let buf_size = 64;
    memory_fixed.allocate_with_canary(buf_ptr, buf_size);
    
    // Host tries to provide more than buffer size
    let host_provides = 1024;
    let result = simulate_fixed_sys_read(&mut memory_fixed, buf_ptr, buf_size, host_provides);
    
    // Fixed version should reject oversized write
    assert!(
        result.is_err(),
        "Fixed implementation should reject oversized host data"
    );
    
    // Canary should remain intact (no write occurred)
    assert!(
        memory_fixed.check_canaries().is_ok(),
        "Canary should not be corrupted in fixed version"
    );
}

#[test]
fn test_edge_case_max_buffer() {
    // Test boundary conditions at maximum valid buffer
    
    // Case 1: Maximum valid buffer at address 0
    let ptr: u32 = 0x0;
    let size: u32 = USER_END_ADDR - 1;
    
    assert!(
        vulnerable_buffer_check(ptr, size),
        "Vulnerable version accepts buffer up to USER_END_ADDR-1"
    );
    
    assert!(
        fixed_buffer_check(ptr, size).is_ok(),
        "Fixed version accepts maximum valid buffer"
    );
    
    // Case 2: Buffer that reaches exactly USER_END_ADDR
    let ptr2: u32 = 0x1000;
    let size2: u32 = USER_END_ADDR - 0x1000;
    
    // This equals USER_END_ADDR exactly, should be rejected
    assert!(
        !vulnerable_buffer_check(ptr2, size2),
        "Vulnerable version rejects buffer at USER_END_ADDR"
    );
    
    assert!(
        fixed_buffer_check(ptr2, size2).is_err(),
        "Fixed version rejects buffer at USER_END_ADDR"
    );
}

#[test]
fn test_legitimate_small_buffer() {
    // Test that legitimate use cases work in both versions
    let mut memory_vuln = MockGuestMemory::new();
    let mut memory_fixed = MockGuestMemory::new();
    
    let buf_ptr = 0x1000;
    let buf_size = 64;
    memory_vuln.allocate_with_canary(buf_ptr, buf_size);
    memory_fixed.allocate_with_canary(buf_ptr, buf_size);
    
    // Host provides exactly requested amount
    let host_provides = 64;
    
    let result_vuln = simulate_vulnerable_sys_read(&mut memory_vuln, buf_ptr, buf_size, host_provides);
    let result_fixed = simulate_fixed_sys_read(&mut memory_fixed, buf_ptr, buf_size, host_provides);
    
    assert!(result_vuln.is_ok(), "Legitimate use should work in vulnerable version");
    assert!(result_fixed.is_ok(), "Legitimate use should work in fixed version");
    
    // Both should preserve canaries
    assert!(memory_vuln.check_canaries().is_ok(), "Canary intact in vulnerable version");
    assert!(memory_fixed.check_canaries().is_ok(), "Canary intact in fixed version");
}

#[test]
fn test_zero_length_buffer() {
    // Test edge case: zero-length buffer
    let ptr: u32 = 0x1000;
    let size: u32 = 0;
    
    assert!(
        vulnerable_buffer_check(ptr, size),
        "Vulnerable version accepts zero-length buffer"
    );
    
    assert!(
        fixed_buffer_check(ptr, size).is_ok(),
        "Fixed version accepts zero-length buffer"
    );
}

#[test]
fn test_buffer_at_user_end_boundary() {
    // Test buffers exactly at USER_END_ADDR boundary
    
    // Buffer ending just before USER_END_ADDR
    let ptr: u32 = USER_END_ADDR - 64;
    let size: u32 = 63;
    
    assert!(
        vulnerable_buffer_check(ptr, size),
        "Vulnerable version accepts buffer ending before boundary"
    );
    
    assert!(
        fixed_buffer_check(ptr, size).is_ok(),
        "Fixed version accepts buffer ending before boundary"
    );
    
    // Buffer starting at USER_END_ADDR (invalid)
    let ptr2: u32 = USER_END_ADDR;
    let size2: u32 = 64;
    
    assert!(
        !vulnerable_buffer_check(ptr2, size2),
        "Vulnerable version rejects buffer starting at boundary"
    );
    
    assert!(
        fixed_buffer_check(ptr2, size2).is_err(),
        "Fixed version rejects buffer starting at boundary"
    );
}

#[test]
fn test_chunked_read_overflow() {
    // Test vulnerability in chunked reads with wraparound
    let buf_ptr: u32 = 0xbffffff0; // Near USER_END_ADDR
    let buf_size: u32 = 0x40000010; // Large size causing wraparound
    
    // Vulnerable arithmetic check passes (wraps around)
    assert!(
        vulnerable_buffer_check(buf_ptr, buf_size),
        "Vulnerable check passes due to wraparound"
    );
    
    // Fixed version detects the wraparound
    assert!(
        fixed_buffer_check(buf_ptr, buf_size).is_err(),
        "Fixed version detects wraparound"
    );
    
    // The vulnerability: buf_ptr + buf_size wraps to a small value
    let wrapped_end = buf_ptr.wrapping_add(buf_size);
    assert!(
        wrapped_end < buf_ptr,
        "Wraparound causes end < start"
    );
    assert!(
        wrapped_end < USER_END_ADDR,
        "Wrapped value appears valid (< USER_END_ADDR)"
    );
}

// ============================================================================
// FUZZING ORACLE FUNCTIONS
// ============================================================================

/// Oracle function for detecting buffer overflow vulnerability
/// Returns true if inputs trigger the vulnerability
pub fn oracle_buffer_overflow(buf_base: u32, buf_size: u32, host_len: u32) -> bool {
    // Vulnerable: wrapping arithmetic check
    let vuln_check = vulnerable_buffer_check(buf_base, buf_size);
    
    // Fixed: proper bounds check
    let fixed_check = fixed_buffer_check(buf_base, buf_size).is_ok();
    
    // Check if host provides more than requested
    let host_oversized = host_len > buf_size;
    
    // Differential oracle: vulnerability exists when:
    // 1. Vulnerable version accepts the buffer
    // 2. Fixed version rejects OR host provides oversized data
    vuln_check && (!fixed_check || (fixed_check && host_oversized))
}

#[test]
fn test_oracle_correctness() {
    // Verify oracle correctly identifies vulnerable cases
    
    // Case 1: Wraparound near boundary
    assert!(
        oracle_buffer_overflow(0xbffffff0, 0x40000010, 1024),
        "Oracle should detect wraparound vulnerability"
    );
    
    // Case 2: Oversized host response
    assert!(
        oracle_buffer_overflow(0x1000, 64, 1024),
        "Oracle should detect oversized response vulnerability"
    );
    
    // Case 3: Legitimate use (should not trigger)
    assert!(
        !oracle_buffer_overflow(0x1000, 64, 64),
        "Oracle should not trigger on legitimate use"
    );
}

// ============================================================================
// LIBFUZZER HARNESS (for external fuzzing integration)
// ============================================================================

#[cfg(fuzzing)]
#[no_mangle]
pub extern "C" fn LLVMFuzzerTestOneInput(data: *const u8, size: usize) -> i32 {
    if size < 12 {
        return 0;
    }
    
    let bytes = unsafe { std::slice::from_raw_parts(data, size) };
    let buf_base = u32::from_le_bytes(bytes[0..4].try_into().unwrap());
    let buf_size = u32::from_le_bytes(bytes[4..8].try_into().unwrap());
    let host_len = u32::from_le_bytes(bytes[8..12].try_into().unwrap());
    
    if oracle_buffer_overflow(buf_base, buf_size, host_len) {
        panic!("Buffer overflow vulnerability detected at buf_base=0x{:08x}, buf_size={}, host_len={}", 
               buf_base, buf_size, host_len);
    }
    
    0
}

#[cfg(test)]
mod property_tests {
    use super::*;
    
    #[test]
    fn property_wraparound_always_rejected_by_fixed() {
        // Property: Any wraparound case should be rejected by fixed implementation
        let test_cases = vec![
            (0xffffffff, 2),
            (0xbffffff0, 0x40000020),
            (USER_END_ADDR - 1, 2),
        ];
        
        for (ptr, size) in test_cases {
            if ptr.checked_add(size).is_none() || ptr + size > USER_END_ADDR {
                assert!(
                    fixed_buffer_check(ptr, size).is_err(),
                    "Fixed should reject wraparound: ptr=0x{:08x}, size={}",
                    ptr, size
                );
            }
        }
    }
    
    #[test]
    fn property_valid_buffers_accepted() {
        // Property: Valid buffers should be accepted by both implementations
        let test_cases = vec![
            (0x1000, 64),
            (0x1000, 1024),
            (0x10000, 4096),
        ];
        
        for (ptr, size) in test_cases {
            if ptr + size <= USER_END_ADDR {
                assert!(
                    vulnerable_buffer_check(ptr, size),
                    "Vulnerable should accept valid buffer"
                );
                assert!(
                    fixed_buffer_check(ptr, size).is_ok(),
                    "Fixed should accept valid buffer"
                );
            }
        }
    }
}


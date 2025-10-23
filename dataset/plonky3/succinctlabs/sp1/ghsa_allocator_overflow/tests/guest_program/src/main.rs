//! Guest program to test allocator overflow vulnerability
//! 
//! This program performs multiple read_vec operations to test memory allocation.
//! In the vulnerable version, overlapping allocations could occur due to 
//! ptr + capacity overflow not being detected.

#![no_main]
sp1_zkvm::entrypoint!(main);

pub fn main() {
    // Test 1: Two normal reads (should work in both versions)
    let data1 = sp1_zkvm::io::read::<Vec<u8>>();
    let data2 = sp1_zkvm::io::read::<Vec<u8>>();
    
    // Verify data integrity
    let len1 = data1.len();
    let len2 = data2.len();
    
    // Get pointer addresses to check for overlap
    let ptr1 = data1.as_ptr() as usize;
    let ptr2 = data2.as_ptr() as usize;
    
    // Check for memory corruption indicator
    // If ptr2 < ptr1 + len1, buffers overlap!
    let overlaps = ptr2 < ptr1 + len1;
    
    // Commit results to public values
    sp1_zkvm::io::commit(&len1);
    sp1_zkvm::io::commit(&len2);
    sp1_zkvm::io::commit(&ptr1);
    sp1_zkvm::io::commit(&ptr2);
    sp1_zkvm::io::commit(&overlaps);
    
    // In vulnerable version with malicious input: this would be true!
    if overlaps {
        // This indicates the overflow bug was triggered
        sp1_zkvm::io::commit(&0xDEADBEEF_u32); // Corruption marker
    } else {
        sp1_zkvm::io::commit(&0xC0FFEE_u32); // No corruption marker
    }
}


// Unit Tests for OpenVM AUIPC PC Byte Decomposition Overflow
// Bug: GHSA-jf2r-x3j4-23m7 - Iterator order typo in range check
//
// Vulnerability: The AUIPC chip uses `.skip(1).enumerate()` instead of `.enumerate().skip(1)`,
// causing the MSB limb pc_limbs[3] to be range-checked as 8-bit instead of 6-bit.
//
// Impact: Allows field overflow in BabyBear, enabling arbitrary incorrect AUIPC results.
//
// Commits:
//   Vulnerable: f41640c37bc5468a0775a38098053fe37ea3538a
//   Fixed:      68da4b50c033da5603517064aa0a08e1bbf70a01

// Constants for AUIPC decomposition
const RV32_CELL_BITS: usize = 8;  // 8 bits per limb
const RV32_REGISTER_NUM_LIMBS: usize = 4;  // 4 limbs per register
const BABY_BEAR_MODULUS: u32 = 2013265921;  // BabyBear field modulus

/// PC limbs: [limb0, limb1, limb2, limb3] where each limb is 8 bits
/// pc = limb0 + limb1*2^8 + limb2*2^16 + limb3*2^24
pub type PcLimbs = [u8; RV32_REGISTER_NUM_LIMBS];

/// Result of range check validation
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RangeCheckResult {
    Pass,
    Fail,
}

/// Emulator for vulnerable AUIPC decomposition (wrong iterator order)
pub struct VulnerableDecomposition;

impl VulnerableDecomposition {
    /// Vulnerable: skip(1).enumerate() produces indices 0,1,2 (not 1,2,3)
    pub fn check_pc_limbs(pc_limbs: &PcLimbs) -> Vec<(usize, u8, RangeCheckResult)> {
        let mut results = Vec::new();
        
        // limb[0] is assumed already checked (through rd_data[0])
        // Check limbs[1..4] but with WRONG indices
        for (i, &limb) in pc_limbs.iter().skip(1).enumerate() {
            // BUG: i is now 0, 1, 2 instead of 1, 2, 3
            if i == pc_limbs.len() - 1 {  // i == 3? NEVER TRUE!
                // 6-bit check: limb should be in [0, 63]
                // But this condition NEVER triggers!
                let result = if limb < 64 {
                    RangeCheckResult::Pass
                } else {
                    RangeCheckResult::Fail
                };
                results.push((i, limb, result));
            } else {
                // 8-bit check: limb should be in [0, 255]
                // This is where limb[3] incorrectly ends up
                // u8 always passes 8-bit check
                results.push((i, limb, RangeCheckResult::Pass));
            }
        }
        
        results
    }
    
    /// Check if MSB limb gets 6-bit check (it shouldn't in vulnerable version)
    pub fn msb_limb_gets_6bit_check(pc_limbs: &PcLimbs) -> bool {
        let results = Self::check_pc_limbs(pc_limbs);
        // In vulnerable version, limb[3] is checked at index 2 with 8-bit check
        // The 6-bit check never happens (index never equals 3)
        results.iter().any(|(idx, limb, _)| {
            *idx == pc_limbs.len() - 1 && *limb == pc_limbs[3]
        })
    }
}

/// Emulator for fixed AUIPC decomposition (correct iterator order)
pub struct FixedDecomposition;

impl FixedDecomposition {
    /// Fixed: enumerate().skip(1) produces indices 1,2,3 (correct)
    pub fn check_pc_limbs(pc_limbs: &PcLimbs) -> Vec<(usize, u8, RangeCheckResult)> {
        let mut results = Vec::new();
        
        // limb[0] is assumed already checked
        // Check limbs[1..4] with CORRECT indices
        for (i, &limb) in pc_limbs.iter().enumerate().skip(1) {
            // FIXED: i is now 1, 2, 3 (correct!)
            if i == pc_limbs.len() - 1 {  // i == 3? TRUE when checking limb[3]!
                // 6-bit check for MSB limb
                // Scale factor: 1 << (4*8 - 30) = 1 << 2 = 4
                let scaled = limb as u32 * 4;  // Equivalent to the circuit scaling
                let result = if scaled <= 255 {
                    // After scaling, must fit in 8-bit range
                    // This means limb must be in [0, 63]
                    RangeCheckResult::Pass
                } else {
                    RangeCheckResult::Fail
                };
                results.push((i, limb, result));
            } else {
                // 8-bit check for other limbs
                let result = RangeCheckResult::Pass;  // u8 always passes 8-bit
                results.push((i, limb, result));
            }
        }
        
        results
    }
    
    /// Check if MSB limb gets 6-bit check (it should in fixed version)
    pub fn msb_limb_gets_6bit_check(pc_limbs: &PcLimbs) -> bool {
        let results = Self::check_pc_limbs(pc_limbs);
        // In fixed version, limb[3] should be checked at index 3 with 6-bit check
        results.iter().any(|(idx, limb, _)| {
            *idx == 3 && *limb == pc_limbs[3]
        })
    }
}

/// Reconstruct PC from limbs
pub fn reconstruct_pc(limbs: &PcLimbs) -> u32 {
    limbs[0] as u32
        + (limbs[1] as u32) * (1 << RV32_CELL_BITS)
        + (limbs[2] as u32) * (1 << (2 * RV32_CELL_BITS))
        + (limbs[3] as u32) * (1 << (3 * RV32_CELL_BITS))
}

/// Check if PC value causes BabyBear field overflow
pub fn causes_field_overflow(pc: u32) -> bool {
    pc >= BABY_BEAR_MODULUS
}

/// Oracle: Returns true if decomposition is under-constrained (vulnerable)
pub fn oracle_decomposition_underconstrained(pc_limbs: &PcLimbs) -> bool {
    // Check if limb[3] > 63 (would violate 6-bit constraint)
    if pc_limbs[3] > 63 {
        // Vulnerable version accepts this (8-bit check)
        let vuln_results = VulnerableDecomposition::check_pc_limbs(pc_limbs);
        let vuln_passes = vuln_results.iter().all(|(_, _, result)| *result == RangeCheckResult::Pass);
        
        // Fixed version rejects this (6-bit check fails)
        let fixed_results = FixedDecomposition::check_pc_limbs(pc_limbs);
        let fixed_passes = fixed_results.iter().all(|(_, _, result)| *result == RangeCheckResult::Pass);
        
        // If vulnerable passes but fixed fails, it's under-constrained
        return vuln_passes && !fixed_passes;
    }
    
    false
}

// ============================================================================
// UNIT TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    // ========================================================================
    // CORE BUG DEMONSTRATIONS
    // ========================================================================

    #[test]
    fn test_enumerate_order_vulnerable() {
        println!("\n=== Test: Vulnerable Iterator Order ===");
        
        let pc_limbs: PcLimbs = [0, 1, 2, 3];
        
        // Demonstrate that skip(1).enumerate() produces wrong indices
        let indices: Vec<usize> = pc_limbs.iter()
            .skip(1)
            .enumerate()
            .map(|(i, _)| i)
            .collect();
        
        println!("skip(1).enumerate() produces indices: {:?}", indices);
        assert_eq!(indices, vec![0, 1, 2], "Should be 0,1,2 not 1,2,3");
        
        // The condition `i == 3` never triggers
        let triggers_6bit_check = indices.contains(&3);
        println!("Does index 3 appear? {}", triggers_6bit_check);
        assert!(!triggers_6bit_check, "Index 3 never appears - 6-bit check never triggers!");
        
        println!("✓ Vulnerable: 6-bit check condition NEVER TRUE");
    }

    #[test]
    fn test_enumerate_order_fixed() {
        println!("\n=== Test: Fixed Iterator Order ===");
        
        let pc_limbs: PcLimbs = [0, 1, 2, 3];
        
        // Demonstrate that enumerate().skip(1) produces correct indices
        let indices: Vec<usize> = pc_limbs.iter()
            .enumerate()
            .skip(1)
            .map(|(i, _)| i)
            .collect();
        
        println!("enumerate().skip(1) produces indices: {:?}", indices);
        assert_eq!(indices, vec![1, 2, 3], "Should be 1,2,3");
        
        // The condition `i == 3` DOES trigger
        let triggers_6bit_check = indices.contains(&3);
        println!("Does index 3 appear? {}", triggers_6bit_check);
        assert!(triggers_6bit_check, "Index 3 appears - 6-bit check triggers!");
        
        println!("✓ Fixed: 6-bit check condition IS TRUE for limb[3]");
    }

    #[test]
    fn test_pc_limb_decomposition_vulnerable() {
        println!("\n=== Test: Vulnerable Decomposition (limb[3] = 64) ===");
        
        // limb[3] = 64 is INVALID for 6-bit (should be ≤63)
        // but VALID for 8-bit
        let pc_limbs: PcLimbs = [0, 0, 0, 64];
        
        let results = VulnerableDecomposition::check_pc_limbs(&pc_limbs);
        
        println!("Check results:");
        for (idx, limb, result) in &results {
            println!("  Index {}: limb={}, result={:?}", idx, limb, result);
        }
        
        // In vulnerable version, limb[3] is checked at index 2 with 8-bit check
        let all_pass = results.iter().all(|(_, _, r)| *r == RangeCheckResult::Pass);
        assert!(all_pass, "Vulnerable: limb[3]=64 PASSES (wrong!)");
        
        // Verify limb[3] did NOT get 6-bit check
        let got_6bit = VulnerableDecomposition::msb_limb_gets_6bit_check(&pc_limbs);
        assert!(!got_6bit, "Vulnerable: limb[3] did NOT get 6-bit check");
        
        println!("✓ Vulnerable accepts limb[3]=64 (under-constrained!)");
    }

    #[test]
    fn test_pc_limb_decomposition_fixed() {
        println!("\n=== Test: Fixed Decomposition (limb[3] = 64) ===");
        
        let pc_limbs: PcLimbs = [0, 0, 0, 64];
        
        let results = FixedDecomposition::check_pc_limbs(&pc_limbs);
        
        println!("Check results:");
        for (idx, limb, result) in &results {
            println!("  Index {}: limb={}, result={:?}", idx, limb, result);
        }
        
        // In fixed version, limb[3] gets 6-bit check and FAILS
        let any_fail = results.iter().any(|(_, _, r)| *r == RangeCheckResult::Fail);
        assert!(any_fail, "Fixed: limb[3]=64 FAILS (correct!)");
        
        // Verify limb[3] DID get 6-bit check
        let got_6bit = FixedDecomposition::msb_limb_gets_6bit_check(&pc_limbs);
        assert!(got_6bit, "Fixed: limb[3] got 6-bit check");
        
        println!("✓ Fixed rejects limb[3]=64 (properly constrained!)");
    }

    #[test]
    fn test_all_valid_6bit_values() {
        println!("\n=== Test: All Valid 6-bit Values [0, 63] ===");
        
        let mut pass_count = 0;
        let mut fail_count = 0;
        
        for limb3 in 0..=63u8 {
            let pc_limbs: PcLimbs = [0, 0, 0, limb3];
            
            let results = FixedDecomposition::check_pc_limbs(&pc_limbs);
            let all_pass = results.iter().all(|(_, _, r)| *r == RangeCheckResult::Pass);
            
            if all_pass {
                pass_count += 1;
            } else {
                fail_count += 1;
                println!("  UNEXPECTED FAIL for limb[3]={}", limb3);
            }
        }
        
        println!("Tested 64 valid 6-bit values:");
        println!("  Pass: {}", pass_count);
        println!("  Fail: {}", fail_count);
        
        assert_eq!(pass_count, 64, "All values [0,63] should pass");
        assert_eq!(fail_count, 0, "No valid 6-bit value should fail");
        
        println!("✓ All 64 valid 6-bit values pass in fixed version");
    }

    #[test]
    fn test_all_invalid_values_above_6bit() {
        println!("\n=== Test: All Invalid Values [64, 255] ===");
        
        let mut vuln_pass = 0;
        let mut vuln_fail = 0;
        let mut fixed_pass = 0;
        let mut fixed_fail = 0;
        
        for limb3 in 64..=255u8 {
            let pc_limbs: PcLimbs = [0, 0, 0, limb3];
            
            // Vulnerable version
            let vuln_results = VulnerableDecomposition::check_pc_limbs(&pc_limbs);
            if vuln_results.iter().all(|(_, _, r)| *r == RangeCheckResult::Pass) {
                vuln_pass += 1;
            } else {
                vuln_fail += 1;
            }
            
            // Fixed version
            let fixed_results = FixedDecomposition::check_pc_limbs(&pc_limbs);
            if fixed_results.iter().all(|(_, _, r)| *r == RangeCheckResult::Pass) {
                fixed_pass += 1;
            } else {
                fixed_fail += 1;
            }
        }
        
        println!("Tested 192 invalid values [64,255]:");
        println!("  Vulnerable: {} pass, {} fail", vuln_pass, vuln_fail);
        println!("  Fixed:      {} pass, {} fail", fixed_pass, fixed_fail);
        
        assert_eq!(vuln_pass, 192, "Vulnerable: ALL invalid values pass (BUG!)");
        assert_eq!(fixed_fail, 192, "Fixed: ALL invalid values fail (correct!)");
        
        println!("✓ Differential behavior confirmed for all 192 invalid values");
    }

    #[test]
    fn test_field_overflow_scenario() {
        println!("\n=== Test: BabyBear Field Overflow ===");
        
        // BabyBear modulus: 2013265921 = 0x78000001
        // In binary: 0111 1000 0000 0000 0000 0000 0000 0001
        // Limbs: [0x01, 0x00, 0x00, 0x78]
        
        // Construct PC that overflows BabyBear field
        // limb[3] = 0x78 = 120 (valid for 8-bit, INVALID for 6-bit)
        let pc_limbs: PcLimbs = [0x01, 0x00, 0x00, 0x78];
        let pc = reconstruct_pc(&pc_limbs);
        
        println!("PC value: 0x{:08x} = {}", pc, pc);
        println!("BabyBear modulus: 0x{:08x} = {}", BABY_BEAR_MODULUS, BABY_BEAR_MODULUS);
        println!("Causes overflow? {}", causes_field_overflow(pc));
        
        assert!(causes_field_overflow(pc), "This PC overflows BabyBear field");
        
        // In vulnerable version, this passes (limb[3] gets 8-bit check)
        let vuln_results = VulnerableDecomposition::check_pc_limbs(&pc_limbs);
        let vuln_pass = vuln_results.iter().all(|(_, _, r)| *r == RangeCheckResult::Pass);
        println!("Vulnerable accepts? {}", vuln_pass);
        assert!(vuln_pass, "Vulnerable accepts field-overflowing PC");
        
        // In fixed version, this fails (limb[3] gets 6-bit check, 120 > 63)
        let fixed_results = FixedDecomposition::check_pc_limbs(&pc_limbs);
        let fixed_pass = fixed_results.iter().all(|(_, _, r)| *r == RangeCheckResult::Pass);
        println!("Fixed accepts? {}", fixed_pass);
        assert!(!fixed_pass, "Fixed rejects field-overflowing PC");
        
        println!("✓ Field overflow vulnerability demonstrated");
    }

    #[test]
    fn test_oracle_correctness() {
        println!("\n=== Test: Oracle Correctness ===");
        
        // Oracle should trigger for limb[3] > 63
        let vuln_case1 = oracle_decomposition_underconstrained(&[0, 0, 0, 64]);
        let vuln_case2 = oracle_decomposition_underconstrained(&[0, 0, 0, 255]);
        let vuln_case3 = oracle_decomposition_underconstrained(&[0, 0, 0, 128]);
        
        println!("Oracle on [0,0,0,64]: {} (true = vuln)", vuln_case1);
        println!("Oracle on [0,0,0,255]: {} (true = vuln)", vuln_case2);
        println!("Oracle on [0,0,0,128]: {} (true = vuln)", vuln_case3);
        
        assert!(vuln_case1, "Oracle should detect limb[3]=64");
        assert!(vuln_case2, "Oracle should detect limb[3]=255");
        assert!(vuln_case3, "Oracle should detect limb[3]=128");
        
        // Oracle should NOT trigger for limb[3] ≤ 63
        let safe_case1 = oracle_decomposition_underconstrained(&[0, 0, 0, 0]);
        let safe_case2 = oracle_decomposition_underconstrained(&[0, 0, 0, 63]);
        let safe_case3 = oracle_decomposition_underconstrained(&[0, 0, 0, 32]);
        
        println!("Oracle on [0,0,0,0]: {} (false = safe)", safe_case1);
        println!("Oracle on [0,0,0,63]: {} (false = safe)", safe_case2);
        println!("Oracle on [0,0,0,32]: {} (false = safe)", safe_case3);
        
        assert!(!safe_case1, "Oracle should not trigger for limb[3]=0");
        assert!(!safe_case2, "Oracle should not trigger for limb[3]=63");
        assert!(!safe_case3, "Oracle should not trigger for limb[3]=32");
        
        println!("✓ Oracle correctly identifies under-constrained cases");
    }

    #[test]
    fn test_boundary_values() {
        println!("\n=== Test: Boundary Values ===");
        
        let boundaries = [0u8, 1, 63, 64, 127, 128, 254, 255];
        
        for &limb3 in &boundaries {
            let pc_limbs: PcLimbs = [0, 0, 0, limb3];
            let pc = reconstruct_pc(&pc_limbs);
            let overflow = causes_field_overflow(pc);
            let oracle = oracle_decomposition_underconstrained(&pc_limbs);
            
            let expected_vuln = limb3 > 63;
            
            println!("limb[3]={:3}: PC=0x{:08x}, overflow={}, oracle={}, expected_vuln={}",
                     limb3, pc, overflow, oracle, expected_vuln);
            
            assert_eq!(oracle, expected_vuln,
                      "Oracle should match expected for limb[3]={}", limb3);
        }
        
        println!("✓ All boundary values tested");
    }

    #[test]
    fn test_various_limb_combinations() {
        println!("\n=== Test: Various Limb Combinations ===");
        
        let test_cases = [
            ([0, 0, 0, 64], true, "MSB=64, others=0"),
            ([255, 255, 255, 64], true, "MSB=64, others=255"),
            ([0, 0, 0, 63], false, "MSB=63 (boundary valid)"),
            ([255, 255, 255, 63], false, "MSB=63, others=255"),
            ([128, 128, 128, 128], true, "All=128"),
            ([0, 0, 0, 0], false, "All=0"),
            ([255, 255, 255, 255], true, "All=255"),
        ];
        
        for (limbs, expected_vuln, desc) in &test_cases {
            let oracle = oracle_decomposition_underconstrained(limbs);
            println!("{:?}: {} - oracle={}, expected={}",
                     limbs, desc, oracle, expected_vuln);
            assert_eq!(oracle, *expected_vuln, "Failed for {}", desc);
        }
        
        println!("✓ Various limb combinations tested");
    }

    #[test]
    fn test_reconstruction_correctness() {
        println!("\n=== Test: PC Reconstruction ===");
        
        let test_cases = [
            ([0, 0, 0, 0], 0x00000000),
            ([255, 0, 0, 0], 0x000000FF),
            ([0, 255, 0, 0], 0x0000FF00),
            ([0, 0, 255, 0], 0x00FF0000),
            ([0, 0, 0, 255], 0xFF000000),
            ([255, 255, 255, 255], 0xFFFFFFFF),
            ([1, 2, 3, 4], 0x04030201),
        ];
        
        for (limbs, expected_pc) in &test_cases {
            let pc = reconstruct_pc(limbs);
            println!("{:?} -> 0x{:08x} (expected 0x{:08x})",
                     limbs, pc, expected_pc);
            assert_eq!(pc, *expected_pc, "Reconstruction failed for {:?}", limbs);
        }
        
        println!("✓ PC reconstruction correct");
    }
}


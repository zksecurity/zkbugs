// Copyright 2025 RISC Zero, Inc.
//
// Unit tests for zkVM underconstrained vulnerability in 3-register instructions (GHSA-g3qg-6746-3mg9)
//
// This test suite validates that same-cycle register reads are properly constrained.
// Bug: When rs1 == rs2, the vulnerable version reads the same register twice in the same cycle.
// Fix: Added load_rs2() helper that detects rs1 == rs2 and reuses the value.

#![cfg(test)]

use std::collections::HashMap;

/// Track memory/register access patterns
#[derive(Debug, Clone)]
struct MemoryAccessTracker {
    /// Map: (cycle, address) -> read count
    reads: HashMap<(u32, u32), u32>,
    /// Map: (cycle, address) -> write count  
    writes: HashMap<(u32, u32), u32>,
    /// Current cycle
    cycle: u32,
}

impl MemoryAccessTracker {
    fn new() -> Self {
        Self {
            reads: HashMap::new(),
            writes: HashMap::new(),
            cycle: 0,
        }
    }
    
    fn next_cycle(&mut self) {
        self.cycle += 1;
    }
    
    fn read_register(&mut self, reg: u32) {
        let key = (self.cycle, reg);
        *self.reads.entry(key).or_insert(0) += 1;
    }
    
    fn write_register(&mut self, reg: u32) {
        let key = (self.cycle, reg);
        *self.writes.entry(key).or_insert(0) += 1;
    }
    
    /// Get read count for register in current cycle
    fn read_count_current(&self, reg: u32) -> u32 {
        *self.reads.get(&(self.cycle, reg)).unwrap_or(&0)
    }
    
    /// Get write count for register in current cycle
    fn write_count_current(&self, reg: u32) -> u32 {
        *self.writes.get(&(self.cycle, reg)).unwrap_or(&0)
    }
    
    /// Check if same address accessed twice in same cycle
    fn has_same_cycle_conflict(&self) -> bool {
        // Check reads
        for count in self.reads.values() {
            if *count > 1 {
                return true;
            }
        }
        // Check writes
        for count in self.writes.values() {
            if *count > 1 {
                return true;
            }
        }
        false
    }
    
    fn reset(&mut self) {
        self.reads.clear();
        self.writes.clear();
        self.cycle = 0;
    }
}

/// Simulated RV32 instruction types (3-register operations)
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum RV32Opcode {
    ADD,
    SUB,
    XOR,
    OR,
    AND,
    SLL,
    SRL,
    SRA,
    SLT,
    SLTU,
    MUL,
    MULH,
    MULHSU,
    MULHU,
    DIV,
    DIVU,
    REM,
    REMU,
}

/// Decoded RV32 instruction
#[derive(Debug, Clone)]
struct RV32Instruction {
    opcode: RV32Opcode,
    rd: u32,   // Destination register
    rs1: u32,  // Source register 1
    rs2: u32,  // Source register 2
}

/// Vulnerable emulator (reads rs2 separately every time)
struct VulnerableEmulator {
    registers: Vec<u32>,
}

impl VulnerableEmulator {
    fn new() -> Self {
        Self {
            registers: vec![0; 32],
        }
    }
    
    fn execute(&mut self, inst: &RV32Instruction, tracker: &mut MemoryAccessTracker) {
        // Read rs1
        tracker.read_register(inst.rs1);
        let val1 = self.registers[inst.rs1 as usize];
        
        // BUG: Always read rs2, even if rs2 == rs1
        tracker.read_register(inst.rs2);
        let val2 = self.registers[inst.rs2 as usize];
        
        // Perform operation
        let result = match inst.opcode {
            RV32Opcode::ADD => val1.wrapping_add(val2),
            RV32Opcode::SUB => val1.wrapping_sub(val2),
            RV32Opcode::XOR => val1 ^ val2,
            RV32Opcode::OR => val1 | val2,
            RV32Opcode::AND => val1 & val2,
            RV32Opcode::SLL => val1.wrapping_shl(val2 & 0x1f),
            RV32Opcode::SRL => val1.wrapping_shr(val2 & 0x1f),
            RV32Opcode::SRA => (val1 as i32).wrapping_shr(val2 & 0x1f) as u32,
            RV32Opcode::SLT => if (val1 as i32) < (val2 as i32) { 1 } else { 0 },
            RV32Opcode::SLTU => if val1 < val2 { 1 } else { 0 },
            RV32Opcode::MUL => val1.wrapping_mul(val2),
            RV32Opcode::MULH => ((val1 as i64 * val2 as i64) >> 32) as u32,
            RV32Opcode::MULHSU => ((val1 as i64 * val2 as u64 as i64) >> 32) as u32,
            RV32Opcode::MULHU => ((val1 as u64 * val2 as u64) >> 32) as u32,
            RV32Opcode::DIV => if val2 == 0 { u32::MAX } else { (val1 as i32).wrapping_div(val2 as i32) as u32 },
            RV32Opcode::DIVU => if val2 == 0 { u32::MAX } else { val1.wrapping_div(val2) },
            RV32Opcode::REM => if val2 == 0 { val1 } else { (val1 as i32).wrapping_rem(val2 as i32) as u32 },
            RV32Opcode::REMU => if val2 == 0 { val1 } else { val1.wrapping_rem(val2) },
        };
        
        // Write rd (skip if rd == x0)
        if inst.rd != 0 {
            tracker.write_register(inst.rd);
            self.registers[inst.rd as usize] = result;
        }
    }
}

/// Fixed emulator (implements load_rs2 helper)
struct FixedEmulator {
    registers: Vec<u32>,
}

impl FixedEmulator {
    fn new() -> Self {
        Self {
            registers: vec![0; 32],
        }
    }
    
    /// FIX: load_rs2 helper - reuses rs1 value if rs1 == rs2
    fn load_rs2(&self, inst: &RV32Instruction, rs1_val: u32, tracker: &mut MemoryAccessTracker) -> u32 {
        if inst.rs1 == inst.rs2 {
            // Reuse rs1 value, no additional read
            rs1_val
        } else {
            // Different registers, read rs2
            tracker.read_register(inst.rs2);
            self.registers[inst.rs2 as usize]
        }
    }
    
    fn execute(&mut self, inst: &RV32Instruction, tracker: &mut MemoryAccessTracker) {
        // Read rs1
        tracker.read_register(inst.rs1);
        let val1 = self.registers[inst.rs1 as usize];
        
        // FIX: Use load_rs2 helper
        let val2 = self.load_rs2(inst, val1, tracker);
        
        // Perform operation (same as vulnerable)
        let result = match inst.opcode {
            RV32Opcode::ADD => val1.wrapping_add(val2),
            RV32Opcode::SUB => val1.wrapping_sub(val2),
            RV32Opcode::XOR => val1 ^ val2,
            RV32Opcode::OR => val1 | val2,
            RV32Opcode::AND => val1 & val2,
            RV32Opcode::SLL => val1.wrapping_shl(val2 & 0x1f),
            RV32Opcode::SRL => val1.wrapping_shr(val2 & 0x1f),
            RV32Opcode::SRA => (val1 as i32).wrapping_shr(val2 & 0x1f) as u32,
            RV32Opcode::SLT => if (val1 as i32) < (val2 as i32) { 1 } else { 0 },
            RV32Opcode::SLTU => if val1 < val2 { 1 } else { 0 },
            RV32Opcode::MUL => val1.wrapping_mul(val2),
            RV32Opcode::MULH => ((val1 as i64 * val2 as i64) >> 32) as u32,
            RV32Opcode::MULHSU => ((val1 as i64 * val2 as u64 as i64) >> 32) as u32,
            RV32Opcode::MULHU => ((val1 as u64 * val2 as u64) >> 32) as u32,
            RV32Opcode::DIV => if val2 == 0 { u32::MAX } else { (val1 as i32).wrapping_div(val2 as i32) as u32 },
            RV32Opcode::DIVU => if val2 == 0 { u32::MAX } else { val1.wrapping_div(val2) },
            RV32Opcode::REM => if val2 == 0 { val1 } else { (val1 as i32).wrapping_rem(val2 as i32) as u32 },
            RV32Opcode::REMU => if val2 == 0 { val1 } else { val1.wrapping_rem(val2) },
        };
        
        // Write rd
        if inst.rd != 0 {
            tracker.write_register(inst.rd);
            self.registers[inst.rd as usize] = result;
        }
    }
}

// ============================================================================
// UNIT TESTS
// ============================================================================

#[test]
fn test_rs1_equals_rs2_single_read() {
    // PRIMARY TEST: When rs1 == rs2, should only do ONE register read
    
    let inst = RV32Instruction {
        opcode: RV32Opcode::ADD,
        rd: 10,
        rs1: 5,
        rs2: 5,  // Same as rs1
    };
    
    let mut vuln_emu = VulnerableEmulator::new();
    let mut fixed_emu = FixedEmulator::new();
    
    vuln_emu.registers[5] = 100;
    fixed_emu.registers[5] = 100;
    
    // Test vulnerable version
    let mut tracker_vuln = MemoryAccessTracker::new();
    vuln_emu.execute(&inst, &mut tracker_vuln);
    
    assert_eq!(
        tracker_vuln.read_count_current(5),
        2,
        "BUG: Vulnerable version reads register 5 twice in same cycle"
    );
    
    assert!(
        tracker_vuln.has_same_cycle_conflict(),
        "BUG: Same-cycle conflict detected in vulnerable version"
    );
    
    // Test fixed version
    let mut tracker_fixed = MemoryAccessTracker::new();
    fixed_emu.execute(&inst, &mut tracker_fixed);
    
    assert_eq!(
        tracker_fixed.read_count_current(5),
        1,
        "FIX: Fixed version reads register 5 only once"
    );
    
    assert!(
        !tracker_fixed.has_same_cycle_conflict(),
        "FIX: No same-cycle conflict in fixed version"
    );
}

#[test]
fn test_rs1_differs_rs2_two_reads() {
    // When rs1 != rs2, BOTH versions should do two reads
    
    let inst = RV32Instruction {
        opcode: RV32Opcode::ADD,
        rd: 10,
        rs1: 5,
        rs2: 6,  // Different from rs1
    };
    
    let mut vuln_emu = VulnerableEmulator::new();
    let mut fixed_emu = FixedEmulator::new();
    
    vuln_emu.registers[5] = 100;
    vuln_emu.registers[6] = 200;
    fixed_emu.registers[5] = 100;
    fixed_emu.registers[6] = 200;
    
    // Test vulnerable version
    let mut tracker_vuln = MemoryAccessTracker::new();
    vuln_emu.execute(&inst, &mut tracker_vuln);
    
    assert_eq!(tracker_vuln.read_count_current(5), 1);
    assert_eq!(tracker_vuln.read_count_current(6), 1);
    assert!(!tracker_vuln.has_same_cycle_conflict());
    
    // Test fixed version
    let mut tracker_fixed = MemoryAccessTracker::new();
    fixed_emu.execute(&inst, &mut tracker_fixed);
    
    assert_eq!(tracker_fixed.read_count_current(5), 1);
    assert_eq!(tracker_fixed.read_count_current(6), 1);
    assert!(!tracker_fixed.has_same_cycle_conflict());
    
    // Both should compute same result
    assert_eq!(vuln_emu.registers[10], 300);
    assert_eq!(fixed_emu.registers[10], 300);
}

#[test]
fn test_all_3reg_opcodes_same_register() {
    // Test all 3-register opcodes with rs1 == rs2
    
    let opcodes = vec![
        RV32Opcode::ADD, RV32Opcode::SUB, RV32Opcode::XOR,
        RV32Opcode::OR, RV32Opcode::AND, RV32Opcode::SLL,
        RV32Opcode::SRL, RV32Opcode::SRA, RV32Opcode::SLT,
        RV32Opcode::SLTU, RV32Opcode::MUL, RV32Opcode::MULH,
        RV32Opcode::MULHSU, RV32Opcode::MULHU, RV32Opcode::DIV,
        RV32Opcode::DIVU, RV32Opcode::REM, RV32Opcode::REMU,
    ];
    
    for opcode in opcodes {
        let inst = RV32Instruction {
            opcode,
            rd: 10,
            rs1: 5,
            rs2: 5,
        };
        
        let mut fixed_emu = FixedEmulator::new();
        fixed_emu.registers[5] = 42;
        
        let mut tracker = MemoryAccessTracker::new();
        fixed_emu.execute(&inst, &mut tracker);
        
        assert_eq!(
            tracker.read_count_current(5),
            1,
            "Opcode {:?}: Fixed version should read register 5 only once",
            opcode
        );
    }
}

#[test]
fn test_register_zero_handling() {
    // x0 is always 0 and writes are ignored
    
    let inst = RV32Instruction {
        opcode: RV32Opcode::ADD,
        rd: 0,  // x0
        rs1: 5,
        rs2: 5,
    };
    
    let mut fixed_emu = FixedEmulator::new();
    fixed_emu.registers[5] = 100;
    
    let mut tracker = MemoryAccessTracker::new();
    fixed_emu.execute(&inst, &mut tracker);
    
    assert_eq!(tracker.read_count_current(5), 1);
    assert_eq!(tracker.write_count_current(0), 0, "No write to x0");
    assert_eq!(fixed_emu.registers[0], 0, "x0 always remains 0");
}

#[test]
fn test_boundary_registers() {
    // Test with boundary register values
    
    let test_cases = vec![
        (0, 0),   // x0 == x0
        (0, 1),   // x0 != x1
        (31, 31), // x31 == x31
        (30, 31), // x30 != x31
    ];
    
    for (rs1, rs2) in test_cases {
        let inst = RV32Instruction {
            opcode: RV32Opcode::ADD,
            rd: 10,
            rs1,
            rs2,
        };
        
        let mut fixed_emu = FixedEmulator::new();
        fixed_emu.registers[rs1 as usize] = 100;
        fixed_emu.registers[rs2 as usize] = 200;
        
        let mut tracker = MemoryAccessTracker::new();
        fixed_emu.execute(&inst, &mut tracker);
        
        if rs1 == rs2 {
            assert_eq!(
                tracker.read_count_current(rs1),
                1,
                "Same register ({}, {}): should read once",
                rs1, rs2
            );
        } else {
            // Different registers may have different read counts depending on values
            // Just ensure no same-cycle conflict
            assert!(!tracker.has_same_cycle_conflict());
        }
    }
}

#[test]
fn test_computational_correctness() {
    // Ensure fix doesn't change computational results
    
    let test_values = vec![
        (100, 200),
        (0, 0),
        (u32::MAX, 1),
        (42, 42),
    ];
    
    for (val1, val2) in test_values {
        let inst_diff = RV32Instruction {
            opcode: RV32Opcode::MUL,
            rd: 10,
            rs1: 5,
            rs2: 6,
        };
        
        let inst_same = RV32Instruction {
            opcode: RV32Opcode::MUL,
            rd: 11,
            rs1: 7,
            rs2: 7,
        };
        
        let mut vuln_emu = VulnerableEmulator::new();
        let mut fixed_emu = FixedEmulator::new();
        
        vuln_emu.registers[5] = val1;
        vuln_emu.registers[6] = val2;
        vuln_emu.registers[7] = val1;
        
        fixed_emu.registers[5] = val1;
        fixed_emu.registers[6] = val2;
        fixed_emu.registers[7] = val1;
        
        let mut tracker = MemoryAccessTracker::new();
        vuln_emu.execute(&inst_diff, &mut tracker);
        vuln_emu.execute(&inst_same, &mut tracker);
        
        tracker.reset();
        fixed_emu.execute(&inst_diff, &mut tracker);
        fixed_emu.execute(&inst_same, &mut tracker);
        
        assert_eq!(
            vuln_emu.registers[10],
            fixed_emu.registers[10],
            "Different result for different registers"
        );
        
        assert_eq!(
            vuln_emu.registers[11],
            fixed_emu.registers[11],
            "Different result for same register"
        );
    }
}

// ============================================================================
// FUZZING ORACLE
// ============================================================================

/// Oracle for detecting same-cycle register reads
pub fn oracle_same_register_reads(opcode: RV32Opcode, rs1: u32, rs2: u32) -> bool {
    // Only interesting when rs1 == rs2
    if rs1 != rs2 || rs1 >= 32 || rs2 >= 32 {
        return false;
    }
    
    let inst = RV32Instruction {
        opcode,
        rd: 10,
        rs1,
        rs2,
    };
    
    let mut vuln_emu = VulnerableEmulator::new();
    let mut fixed_emu = FixedEmulator::new();
    
    vuln_emu.registers[rs1 as usize] = 42;
    fixed_emu.registers[rs1 as usize] = 42;
    
    let mut tracker_vuln = MemoryAccessTracker::new();
    let mut tracker_fixed = MemoryAccessTracker::new();
    
    vuln_emu.execute(&inst, &mut tracker_vuln);
    fixed_emu.execute(&inst, &mut tracker_fixed);
    
    // Differential oracle: vuln has conflict, fixed doesn't
    tracker_vuln.has_same_cycle_conflict() && !tracker_fixed.has_same_cycle_conflict()
}

#[test]
fn test_oracle_correctness() {
    // Verify oracle correctly identifies vulnerable cases
    
    // Case 1: Same register (should trigger)
    assert!(
        oracle_same_register_reads(RV32Opcode::ADD, 5, 5),
        "Oracle should detect same-register vulnerability"
    );
    
    // Case 2: Different registers (should not trigger)
    assert!(
        !oracle_same_register_reads(RV32Opcode::ADD, 5, 6),
        "Oracle should not trigger on different registers"
    );
    
    // Case 3: All opcodes with same register should trigger
    let opcodes = vec![
        RV32Opcode::REMU, RV32Opcode::DIVU, RV32Opcode::MUL, RV32Opcode::XOR,
    ];
    
    for opcode in opcodes {
        assert!(
            oracle_same_register_reads(opcode, 10, 10),
            "Oracle should trigger for opcode {:?}",
            opcode
        );
    }
}

#[cfg(test)]
mod property_tests {
    use super::*;
    
    #[test]
    fn property_same_register_always_one_read() {
        // Property: When rs1 == rs2, fixed version always does exactly 1 read
        
        let opcodes = vec![
            RV32Opcode::ADD, RV32Opcode::MUL, RV32Opcode::XOR,
            RV32Opcode::OR, RV32Opcode::AND,
        ];
        
        for opcode in opcodes {
            for reg in 1..32 {
                let inst = RV32Instruction {
                    opcode,
                    rd: 0,
                    rs1: reg,
                    rs2: reg,
                };
                
                let mut fixed_emu = FixedEmulator::new();
                let mut tracker = MemoryAccessTracker::new();
                
                fixed_emu.execute(&inst, &mut tracker);
                
                assert_eq!(
                    tracker.read_count_current(reg),
                    1,
                    "Opcode {:?}, reg {}: should read once",
                    opcode, reg
                );
            }
        }
    }
    
    #[test]
    fn property_different_registers_no_conflict() {
        // Property: When rs1 != rs2, no same-cycle conflict
        
        for rs1 in 1..16 {
            for rs2 in (rs1 + 1)..16 {
                let inst = RV32Instruction {
                    opcode: RV32Opcode::ADD,
                    rd: 20,
                    rs1,
                    rs2,
                };
                
                let mut fixed_emu = FixedEmulator::new();
                let mut tracker = MemoryAccessTracker::new();
                
                fixed_emu.execute(&inst, &mut tracker);
                
                assert!(
                    !tracker.has_same_cycle_conflict(),
                    "Different registers ({}, {}) should not conflict",
                    rs1, rs2
                );
            }
        }
    }
}


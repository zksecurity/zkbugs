# zkVM 3-Register Instructions Oracle & Tests

## Vulnerability Summary
RISC0's zkVM circuit lacked constraints to properly handle 3-register RISC-V instructions when `rs1 == rs2`. The vulnerable version reads the same register twice in the same memory cycle, violating circuit constraints and allowing malicious provers to exploit the under-constrained circuit.

**CVE:** None  
**Advisory:** [GHSA-g3qg-6746-3mg9](https://github.com/risc0/risc0/security/advisories/GHSA-g3qg-6746-3mg9)  
**Vulnerable Commit:** `98387806fe8348d87e32974468c6f35853356ad5`  
**Fix Commit:** `67f2d81c638bff5f4fcfe11a084ebb34799b7a89`

## Invariant
**Same-cycle register reads must be constrained:** When `rs1 == rs2` in any 3-register RISC-V instruction, the circuit must enforce a single register read per cycle, not multiple reads to the same address.

## Oracle
**Differential Oracle:** Compare register read counts between vulnerable and fixed implementations.

```rust
fn oracle_same_register_reads(opcode: RV32Opcode, rs1: u32, rs2: u32) -> bool {
    if rs1 != rs2 { return false; } // Only interesting when equal
    
    // Count reads in both versions
    let vuln_reads = execute_vulnerable(opcode, rs1, rs2).read_count(rs1);
    let fixed_reads = execute_fixed(opcode, rs1, rs2).read_count(rs1);
    
    vuln_reads > fixed_reads  // Vulnerable: 2 reads, Fixed: 1 read
}
```

## Seed Values
**Critical test cases:**
- `opcode = REMU, rs1 = 15, rs2 = 15`
  - **Vulnerable:** Reads register 15 twice in same cycle ❌ (constraint violation)
  - **Fixed:** Reads register 15 once, reuses value ✅ (properly constrained)
- `opcode = ADD, rs1 = 5, rs2 = 5`
  - **Vulnerable:** 2 reads ❌
  - **Fixed:** 1 read ✅
- **All 18 3-register instructions** affected: ADD, SUB, XOR, OR, AND, SLL, SRL, SRA, SLT, SLTU, MUL, MULH, MULHSU, MULHU, DIV, DIVU, REM, REMU

## Running Tests

### Unit Tests (No dependencies)
```bash
cd tests/
./run_unit_tests.sh
```

**Expected Output:**
```
test test_rs1_equals_rs2_single_read ... ok
test test_all_3reg_opcodes_same_register ... ok
test test_oracle_correctness ... ok
... 13 tests total ...
```

### Harness Tests (Static analysis)
```bash
cd tests/
./run_harness.sh
```

**Expected Output:**
```
test test_load_rs2_helper_presence ... ok
test test_cycle_validation ... ok
... 10 tests total ...
```

## Outcomes

| Version | Test Result | Behavior |
|---------|-------------|----------|
| **Vulnerable** (`9838780`) | 2 reads to same register | Violates same-cycle constraint, reads register twice |
| **Fixed** (`67f2d81`) | 1 read to same register | Properly constrained, reuses value via load_rs2 helper |

## Detailed Documentation

- **[UNIT_TESTS_REPORT.md](UNIT_TESTS_REPORT.md)** - Complete unit test documentation with oracle design
- **[HARNESS_TESTS_REPORT.md](HARNESS_TESTS_REPORT.md)** - Harness test documentation and pattern detection

## Test Structure

```
tests/
├── README.md                           # This file
├── unit_same_cycle_io.rs              # 13 unit tests (fast, pure Rust)
├── harness_same_cycle_io.rs           # 10 harness tests (static analysis)
├── run_unit_tests.sh                  # Automated unit test runner
├── run_harness.sh                     # Automated harness test runner
├── UNIT_TESTS_REPORT.md               # Detailed unit test documentation
└── HARNESS_TESTS_REPORT.md            # Detailed harness documentation
```

## Quick Verification

### Verify the vulnerability exists (on vulnerable commit):
```rust
let inst = RV32Instruction { opcode: ADD, rd: 10, rs1: 5, rs2: 5 };
let mut tracker = MemoryAccessTracker::new();
vulnerable_emulator.execute(&inst, &mut tracker);
assert_eq!(tracker.read_count(5), 2);  // BUG: Reads twice!
```

### Verify the fix works (on fixed commit):
```rust
let inst = RV32Instruction { opcode: ADD, rd: 10, rs1: 5, rs2: 5 };
let mut tracker = MemoryAccessTracker::new();
fixed_emulator.execute(&inst, &mut tracker);
assert_eq!(tracker.read_count(5), 1);  // FIX: Only one read!
```


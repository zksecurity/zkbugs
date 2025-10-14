# OpenVM AUIPC Decomposition Overflow - Harness Tests Report

## Test Execution Summary

**Date:** Mon Oct 13 17:37:21 RST 2025
**Vulnerability:** Iterator order typo causing under-constrained range check  
**Commits Tested:**
- Vulnerable: f41640c37bc5468a0775a38098053fe37ea3538a
- Fixed: 68da4b50c033da5603517064aa0a08e1bbf70a01

## Harness Test Approach

The harness tests perform **static analysis** and **pattern detection** on the OpenVM AUIPC source code to identify vulnerability and fix indicators without executing the full zkVM.

This approach:
- ✓ Faster than full execution (<1s vs minutes)
- ✓ Works across different commits
- ✓ Detects implementation patterns
- ✓ Suitable for CI/CD integration

## Test Results

    
    running 9 tests
    test tests::test_auipc_chip_architecture ... ok
    test tests::test_cve_metadata ... ok
    test tests::test_fix_commit_details ... ok
    test tests::test_range_check_condition_present ... ok
    test tests::test_pattern_counts ... ok
    test tests::test_pc_limbs_iteration_present ... ok
    test tests::test_source_file_accessibility ... ok
    test tests::test_differential_source_analysis ... ok
    test tests::test_iteration_pattern_in_source ... ok
    
    test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
    

## Pattern Detection Methodology

### Vulnerability Indicators
1. **Wrong iterator order:** `.skip(1).enumerate()`
2. **Wrong indices:** Produces 0, 1, 2 instead of 1, 2, 3
3. **Condition never triggers:** `i == 3` never true
4. **MSB limb under-constrained:** Gets 8-bit check instead of 6-bit

### Fix Indicators
1. **Correct iterator order:** `.enumerate().skip(1)`
2. **Correct indices:** Produces 1, 2, 3
3. **Condition triggers:** `i == 3` is true for limb[3]
4. **MSB limb properly constrained:** Gets 6-bit check

## Harness Test Categories

### 1. Pattern Detection (`test_iteration_pattern_in_source`)
- Searches for `.skip(1).enumerate()` (VULNERABLE)
- Searches for `.enumerate().skip(1)` (FIXED)
- Classifies source as VULNERABLE, FIXED, or UNKNOWN

### 2. Range Check Logic (`test_range_check_condition_present`)
- Verifies `i == pc_limbs.len() - 1` condition exists
- Checks for scaling logic (6-bit enforcement)
- Confirms PC_BITS constant usage

### 3. Differential Analysis (`test_differential_source_analysis`)
- Documents expected patterns per commit
- Compares vulnerable vs fixed versions
- Provides classification guidance

### 4. Iteration Verification (`test_pc_limbs_iteration_present`)
- Confirms `pc_limbs.iter()` logic exists
- Required for any range checking to happen

### 5. Architecture Documentation (`test_auipc_chip_architecture`)
- Documents AUIPC instruction semantics
- Explains 30-bit PC limitation
- Describes BabyBear field constraints

### 6. Fix Metadata (`test_fix_commit_details`)
- Documents commit SHA and details
- Explains the typo and fix
- Notes ironic context (typo while fixing previous bug)

### 7. Source Accessibility (`test_source_file_accessibility`)
- Verifies source files can be read
- Provides path information
- Checks file sizes

### 8. Pattern Counts (`test_pattern_counts`)
- Counts vulnerable pattern occurrences
- Counts fixed pattern occurrences
- Expected: 2 occurrences (two functions use the logic)

### 9. CVE Metadata (`test_cve_metadata`)
- Documents CVE-2025-46723
- Links to advisory
- Lists affected components

## Key Findings

### Vulnerable Commit (f41640c) Patterns

```rust
// Line 133 in core.rs (eval_constraint_circuit)
for (i, limb) in pc_limbs.iter().skip(1).enumerate() {
    if i == pc_limbs.len() - 1 {  // NEVER TRUE!
        // 6-bit check
    } else {
        // 8-bit check (limb[3] ends up here)
    }
}

// Line 245 in core.rs (generate_subrow)
for (i, limb) in pc_limbs.iter().skip(1).enumerate() {
    if i == pc_limbs.len() - 1 {  // NEVER TRUE!
        // 6-bit check
    } else {
        // 8-bit check (limb[3] ends up here)
    }
}
```

**Indicators:**
- ✗ `.skip(1).enumerate()` pattern (2 occurrences)
- ✗ Produces indices 0, 1, 2
- ✗ Condition `i == 3` never triggers
- ✗ limb[3] gets 8-bit check

### Fixed Commit (68da4b50) Patterns

```rust
// Line 134 in core.rs (eval_constraint_circuit)
for (i, limb) in pc_limbs.iter().enumerate().skip(1) {
    if i == pc_limbs.len() - 1 {  // TRUE when i == 3!
        // 6-bit check for limb[3]
    } else {
        // 8-bit check for limb[1], limb[2]
    }
}

// Line 246 in core.rs (generate_subrow)
for (i, limb) in pc_limbs.iter().enumerate().skip(1) {
    if i == pc_limbs.len() - 1 {  // TRUE when i == 3!
        // 6-bit check for limb[3]
    } else {
        // 8-bit check for limb[1], limb[2]
    }
}
```

**Indicators:**
- ✓ `.enumerate().skip(1)` pattern (2 occurrences)
- ✓ Produces indices 1, 2, 3
- ✓ Condition `i == 3` triggers for limb[3]
- ✓ limb[3] gets 6-bit check

## Comparison Matrix

| Feature | Vulnerable (f41640c) | Fixed (68da4b50) |
|---------|----------------------|------------------|
| **Iterator pattern** | .skip(1).enumerate() | .enumerate().skip(1) |
| **Indices produced** | 0, 1, 2 | 1, 2, 3 |
| **Condition triggers** | Never (i never equals 3) | Yes (when i == 3) |
| **limb[3] check** | 8-bit (0-255) | 6-bit (0-63) |
| **Invalid values accepted** | 192 ([64-255]) | 0 |
| **Field overflow risk** | Yes | No |

## AUIPC Architecture

### Instruction Semantics
```
AUIPC rd, imm
rd = pc + (imm << 12)
```
- **Purpose:** Calculate addresses relative to program counter
- **Usage:** Position-independent code, function tables

### PC Representation
- **Total bits:** 30 (not full 32-bit)
- **Why 30?** BabyBear field constraint: modulus = 2^31 - 2^27 + 1
- **Decomposition:** 4 limbs of 8 bits each (32 bits total, but only 30 used)

### Limb Constraints
```
limb[0]: 8-bit check (bits 0-7)
limb[1]: 8-bit check (bits 8-15)
limb[2]: 8-bit check (bits 16-23)
limb[3]: 6-bit check (bits 24-29) ← Only 6 bits used!
```

**Critical:** limb[3] must be ≤ 63 to ensure PC fits in 30 bits.

## Fuzzing Integration

The harness tests inform fuzzing strategy:

### Static Pattern Fuzzing
- **Target:** Mutate source code patterns
- **Oracle:** Check for `.skip(1).enumerate()` presence
- **Mutation:** Swap iterator method order
- **Detection:** Immediate (text pattern matching)

### Commit-Range Fuzzing
- **Strategy:** Binary search through git history
- **Oracle:** Run harness on each commit
- **Detection:** Identify when bug was introduced/fixed
- **Expected:** Bug in f41640c, fixed in 68da4b50

### Expected Oracle Behavior
```rust
// At vulnerable commit
harness("f41640c sources") → VULNERABLE

// At fixed commit
harness("68da4b50 sources") → FIXED
```

### Performance Characteristics
- **Harness execution:** <1 second per test
- **Full test suite:** <5 seconds
- **Pattern detection:** Suitable for CI/CD
- **No circuit execution:** Fast static analysis only

## Conclusions

The harness tests successfully:
- ✓ Detect vulnerability pattern (.skip(1).enumerate())
- ✓ Identify fix pattern (.enumerate().skip(1))
- ✓ Provide fast, reproducible validation
- ✓ Enable differential analysis across commits
- ✓ Document AUIPC architecture and constraints

### Recommendations

1. **CI/CD Integration:** Add pattern checks to prevent regression
2. **Code Review:** Flag any `.skip().enumerate()` patterns
3. **Testing:** Use exhaustive testing for similar bugs
4. **Fuzzing:** Run property-based tests on decomposition logic


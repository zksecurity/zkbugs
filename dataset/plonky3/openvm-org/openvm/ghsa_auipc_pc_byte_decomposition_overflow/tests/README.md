# OpenVM AUIPC PC Byte Decomposition Overflow Tests

**Bug ID:** GHSA-jf2r-x3j4-23m7  
**CVE ID:** CVE-2025-46723  
**Vulnerability:** Iterator order typo causing under-constrained range check  
**Impact:** Critical - Allows field overflow and arbitrary incorrect AUIPC results

## 🔍 Vulnerability Overview

The AUIPC (Add Upper Immediate to PC) chip in OpenVM contains a subtle but critical bug in its PC byte decomposition logic.

### The Bug: Iterator Method Order Typo

```rust
// VULNERABLE (f41640c)
for (i, limb) in pc_limbs.iter().skip(1).enumerate() {
    if i == pc_limbs.len() - 1 {  // i ∈ {0,1,2} so i==3 NEVER TRUE!
        // 6-bit range check for MSB limb (NEVER EXECUTED)
    } else {
        // 8-bit range check (ALWAYS EXECUTED for all limbs, including limb[3])
    }
}

// FIXED (68da4b50)
for (i, limb) in pc_limbs.iter().enumerate().skip(1) {
    if i == pc_limbs.len() - 1 {  // i ∈ {1,2,3} so i==3 IS TRUE!
        // 6-bit range check for MSB limb (CORRECTLY EXECUTED)
    } else {
        // 8-bit range check for limb[1], limb[2] (correct)
    }
}
```

### Why This Matters

**PC Representation in OpenVM:**
- PC is **30 bits** (not full 32-bit) due to BabyBear field constraints
- Decomposed into 4 limbs: `[limb0, limb1, limb2, limb3]`
- Each limb is 8 bits, but only 30 bits are used total

**Limb Constraints:**
```
limb[0]: 8-bit check (bits 0-7)   ✓
limb[1]: 8-bit check (bits 8-15)  ✓  
limb[2]: 8-bit check (bits 16-23) ✓
limb[3]: 6-bit check (bits 24-29) ← Only 6 bits used! Must be ≤ 63
```

**The Typo:**
- `.skip(1).enumerate()` produces indices: 0, 1, 2
- Condition `i == pc_limbs.len() - 1` checks `i == 3`
- **Never true!** So limb[3] never gets the 6-bit check
- Instead, limb[3] gets 8-bit check, allowing values 0-255

**Impact:**
- **192 invalid values** (64-255) are accepted
- PC can exceed 30-bit limit
- PC can overflow BabyBear field (modulus = 2,013,265,921)
- AUIPC instruction produces **arbitrary incorrect results**

**Vulnerable Commit:** `f41640c37bc5468a0775a38098053fe37ea3538a`  
**Fixed Commit:** `68da4b50c033da5603517064aa0a08e1bbf70a01`  
**Released in:** v1.1.0

---

## 🔐 Invariant

**The MSB limb of PC decomposition (pc_limbs[3]) MUST be range-checked to 6 bits (≤ 63) to ensure PC stays within 30-bit limit and doesn't overflow the BabyBear field.**

---

## 🎯 Oracle

### `oracle_decomposition_underconstrained(pc_limbs: [u8; 4]) -> bool`

**Type:** Behavioral differential oracle  
**Returns:** `true` if range check is under-constrained (vulnerable), `false` if properly constrained (fixed)  
**Performance:** <1μs per invocation (pure arithmetic)  
**Reliability:** HIGH (exact arithmetic, deterministic)

**Usage:**
```rust
// Vulnerable cases (limb[3] > 63)
assert!(oracle_decomposition_underconstrained(&[0, 0, 0, 64]));   // ✓ Returns true
assert!(oracle_decomposition_underconstrained(&[0, 0, 0, 255]));  // ✓ Returns true

// Safe cases (limb[3] ≤ 63)
assert!(!oracle_decomposition_underconstrained(&[0, 0, 0, 63]));  // ✓ Returns false
assert!(!oracle_decomposition_underconstrained(&[0, 0, 0, 0]));   // ✓ Returns false
```

**How It Works:**
1. Tests limb[3] value against 6-bit constraint
2. Compares vulnerable emulator (8-bit check) vs fixed emulator (6-bit check)
3. Returns true if behaviors differ (i.e., limb[3] > 63)

---

## 🌱 Seed Values

See `../seeds/auipc.json` for:
- **6 critical test cases** (boundary values, field overflow)
- **Edge case documentation** (6-bit max, 8-bit max)
- **Exhaustive testing guidance** (all 256 limb[3] values)
- **BabyBear field constraints**
- **Iterator order bug details**

**Key Test Cases:**
1. `limb[3] = 64` - Minimum invalid value (first above 6-bit max)
2. `limb[3] = 63` - Maximum valid value (6-bit boundary)
3. `limb[3] = 255` - Maximum 8-bit value (worst case)
4. `limb[3] = 120` - Causes BabyBear field overflow
5. `limb[3] = 128` - Midpoint of invalid range

---

## 🚀 Running Tests

### Unit Tests (11 tests, <20ms)

```bash
cd tests/
./run_unit_tests.sh
```

**Tests:**
1. `test_enumerate_order_vulnerable` - Iterator produces 0,1,2
2. `test_enumerate_order_fixed` - Iterator produces 1,2,3
3. `test_pc_limb_decomposition_vulnerable` - Accepts limb[3]=64
4. `test_pc_limb_decomposition_fixed` - Rejects limb[3]=64
5. `test_all_valid_6bit_values` - All [0,63] pass (64 cases)
6. `test_all_invalid_values_above_6bit` - All [64,255] rejected (192 cases)
7. `test_field_overflow_scenario` - BabyBear overflow demonstration
8. `test_oracle_correctness` - Oracle validation
9. `test_boundary_values` - Boundary value testing
10. `test_various_limb_combinations` - Multiple limb patterns
11. `test_reconstruction_correctness` - PC reconstruction accuracy

**Total Cases Tested:** ~300+ individual limb combinations

### Harness Tests (9 tests, <1s)

```bash
cd tests/
./run_harness.sh
```

**Tests:**
1. Pattern detection (vulnerable vs fixed)
2. Range check condition verification
3. Differential source analysis
4. pc_limbs iteration verification
5. AUIPC architecture documentation
6. Fix commit details
7. Source file accessibility
8. Pattern occurrence counts
9. CVE metadata validation

---

## 📊 Expected Results

### On Vulnerable Commit (f41640c)

**Unit Tests:**
- ✅ All tests pass
- Oracle returns `true` for limb[3] > 63
- Vulnerable emulator accepts all 192 invalid values
- Demonstrates field overflow risk

**Harness Tests:**
- ⚠ Detects `.skip(1).enumerate()` pattern (2 occurrences)
- ⚠ No `.enumerate().skip(1)` pattern found
- Classification: **VULNERABLE**

### On Fixed Commit (68da4b50)

**Unit Tests:**
- ✅ All tests pass
- Oracle returns `false` for limb[3] > 63
- Fixed emulator rejects all 192 invalid values
- Field overflow prevented

**Harness Tests:**
- ✅ Detects `.enumerate().skip(1)` pattern (2 occurrences)
- ✅ No `.skip(1).enumerate()` pattern found
- Classification: **FIXED**

---


## 📚 Additional Context

### Ironic Bug History

This bug was introduced as a **typo** while fixing a **previous vulnerability**:
- **Original bug:** Cantina audit finding #21
- **Fix attempt:** Refactored PC limb checking
- **Typo introduced:** `.skip(1).enumerate()` instead of `.enumerate().skip(1)`
- **Result:** New vulnerability introduced!

**Lesson:** Even "simple" fixes need careful review and testing.

### AUIPC Instruction Details

**AUIPC (Add Upper Immediate to PC):**
```
Operation: rd = pc + (imm << 12)
Purpose: Calculate addresses relative to program counter
Use case: Position-independent code, function tables
```

**Why PC is 30 bits:**
- BabyBear field modulus: `p = 2^31 - 2^27 + 1 = 2,013,265,921`
- To ensure safe arithmetic, PC limited to 30 bits
- Maximum valid PC: `2^30 - 1 = 1,073,741,823`

**Why limb[3] must be ≤ 63:**
- PC = limb[0] + limb[1]×2^8 + limb[2]×2^16 + limb[3]×2^24
- If limb[3] = 64: PC ≥ 64×2^24 = 1,073,741,824 (exceeds 30-bit limit)
- If limb[3] ≥ 120: PC ≥ 2,013,265,920 (approaches field modulus)

---

## ✅ Validation Checklist

- [x] Unit tests demonstrate iterator order bug
- [x] Harness tests detect source patterns
- [x] Oracle validated on all edge cases
- [x] Exhaustive testing covers all 256 values
- [x] Field overflow scenario demonstrated
- [x] Fast performance (<20ms for full suite)
- [x] Fuzzing guide comprehensive
- [x] Exhaustive vs fuzzing trade-offs explained
- [x] Seeds with critical test cases
- [x] CI/CD ready

---

## 🎯 Key Takeaways

1. **Not all bugs need fuzzing** - Sometimes exhaustive testing is better
2. **Small input spaces** (< 10K cases) should be tested exhaustively
3. **Fast oracles** (<1μs) enable complete testing in milliseconds
4. **Structure-aware analysis** - Bug only depends on 1 of 4 bytes
5. **Iterator order bugs are common** - This pattern applies to other decomposition logic

**For this specific bug:** ✅ **Exhaustive testing > Fuzzing** (faster, simpler, more complete)

---

## 📖 Additional Resources

- **Advisory:** https://github.com/openvm-org/openvm/security/advisories/GHSA-jf2r-x3j4-23m7
- **CVE:** CVE-2025-46723
- **Fix PR:** Included in v1.1.0 release
- **Related:** Cantina audit finding #21 (previous bug that led to this fix/typo)


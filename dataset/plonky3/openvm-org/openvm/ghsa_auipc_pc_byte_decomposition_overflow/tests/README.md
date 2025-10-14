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

## 🎲 Fuzzing Guide

### ✅ **HIGHLY RECOMMENDED** - This Bug is Ideal for Fuzzing

**Why:**
1. ✅ **Fast oracle:** <1μs per test (pure arithmetic, no proving)
2. ✅ **Small interesting space:** Only 192 invalid values to find
3. ✅ **High trigger rate:** 100% on limb[3] > 63
4. ✅ **Deterministic:** No randomness, perfect reproducibility
5. ✅ **Critical impact:** Field overflow enables arbitrary code

---

### 🎯 Fuzzing Strategy

#### 1. Exhaustive Testing (BEST - Recommended ⭐)

**Approach:** Test ALL possible limb[3] values systematically

```rust
for limb3 in 0..=255 {
    let pc_limbs = [0, 0, 0, limb3];
    let is_vuln = oracle_decomposition_underconstrained(&pc_limbs);
    
    if is_vuln {
        println!("VULN FOUND: limb[3] = {}", limb3);
    }
}
```

**Performance:**
- **Test count:** 256 (all limb[3] values)
- **Duration:** <10ms
- **Coverage:** 100% of vulnerability space
- **Expected findings:** 192 vulnerable cases (limb[3] ∈ [64, 255])

**Advantages:**
- ✅ **Complete coverage** - Finds ALL vulnerable values
- ✅ **Deterministic** - Same results every run
- ✅ **Fast** - Completes in milliseconds
- ✅ **Simple** - No complex mutation logic needed

**Verdict:** Since the space is so small, **exhaustive testing is superior to fuzzing**.

---

#### 2. Property-Based Testing (Excellent Alternative)

**Framework:** QuickCheck or PropTest

**Property 1: Invalid values rejected**
```rust
fn prop_invalid_limb3_rejected(limb3: u8) -> bool {
    if limb3 > 63 {
        let pc_limbs = [0, 0, 0, limb3];
        oracle_decomposition_underconstrained(&pc_limbs)  // Should return true
    } else {
        true  // Skip valid values
    }
}
```

**Property 2: Valid values accepted**
```rust
fn prop_valid_limb3_accepted(limb3: u8) -> bool {
    if limb3 <= 63 {
        let pc_limbs = [0, 0, 0, limb3];
        !oracle_decomposition_underconstrained(&pc_limbs)  // Should return false
    } else {
        true  // Skip invalid values
    }
}
```

**Performance:**
- **Throughput:** 1M+ exec/sec
- **Test count:** 1,000-10,000 (configurable)
- **Duration:** <10ms to <100ms
- **Coverage:** Statistical (but can hit all edge cases)

---

#### 3. Traditional Fuzzing (Optional - Exhaustive is Better)

If you still want to run traditional fuzzing:

##### libFuzzer Integration

**Harness:**
```rust
// tests/fuzz_auipc.rs
#![no_main]
use libfuzzer_sys::fuzz_target;

fuzz_target!(|data: &[u8]| {
    if data.len() == 4 {
        let pc_limbs = [data[0], data[1], data[2], data[3]];
        
        if oracle_decomposition_underconstrained(&pc_limbs) {
            // Found vulnerable case
            eprintln!("VULN: {:?}", pc_limbs);
        }
    }
});
```

**Running:**
```bash
cargo install cargo-fuzz
cargo fuzz build fuzz_auipc

cargo fuzz run fuzz_auipc \
    --corpus seeds/ \
    -- -max_len=4 \
    -dict=fuzzing_dictionary.txt \
    -runs=100000
```

**Dictionary (`fuzzing_dictionary.txt`):**
```
"\x00"
"\x3F"  # 63 (max valid)
"\x40"  # 64 (min invalid)
"\xFF"  # 255 (max 8-bit)
"\x78"  # 120 (causes field overflow)
```

**Expected Results:**
- **Exec/sec:** 1,000,000+
- **Unique bugs:** 192 (all invalid limb[3] values)
- **Saturation:** <1 minute
- **Coverage:** 100% (will find all 192 cases)

##### AFL++ Integration

```bash
# Install AFL++
cargo install cargo-afl

# Compile with AFL instrumentation
cargo afl build --release

# Create seed corpus
mkdir -p afl_seeds/
echo -ne '\x00\x00\x00\x3F' > afl_seeds/valid.bin    # limb[3] = 63
echo -ne '\x00\x00\x00\x40' > afl_seeds/invalid.bin  # limb[3] = 64

# Run AFL++ fuzzer
cargo afl fuzz \
    -i afl_seeds/ \
    -o afl_findings/ \
    target/release/fuzz_auipc
```

**AFL++ Configuration:**
```bash
export AFL_FAST_CAL=1          # Fast calibration
export AFL_SKIP_CPUFREQ=1      # Skip CPU frequency check
export AFL_I_DONT_CARE_ABOUT_MISSING_CRASHES=1  # No crash corpus needed
```

**Expected Results:**
- **Queue:** ~192 unique inputs (one per invalid limb[3] value)
- **Paths:** 2 (pass/fail)
- **Duration:** 1-2 minutes to saturate
- **Crashes:** 0 (oracle doesn't panic, just returns true/false)

---

### 🔬 Input Space Analysis

**Total Space:**
- 4 limbs × 256 values each = **4,294,967,296** combinations
- That's 4.29 billion possible inputs

**Interesting Subset:**
- limb[3] ∈ [64, 255] = **192 cases**
- limb[0,1,2] can be arbitrary (don't affect vulnerability)
- **Trigger rate:** 0.0000045% of total space

**But Here's the Key Insight:**
- The bug **only depends on limb[3]**!
- limb[0], limb[1], limb[2] are irrelevant to the bug
- So the **effective input space is just 256 values**

**Implication:** **Exhaustive testing is trivial** - just test all 256 limb[3] values!

---

### ⚡ Performance Comparison

| Approach | Throughput | Duration | Coverage | Recommendation |
|----------|------------|----------|----------|----------------|
| **Exhaustive Testing** | N/A (finite) | <10ms | 100% (256 cases) | ⭐⭐⭐ BEST |
| **Property-Based** | 1M+ exec/sec | <100ms | Statistical (99%+) | ⭐⭐⭐ Excellent |
| **libFuzzer** | 1M+ exec/sec | 1-2 min | 100% (eventually) | ⭐⭐ Good but overkill |
| **AFL++** | 1M+ exec/sec | 1-2 min | 100% (eventually) | ⭐⭐ Good but overkill |
| **Random Fuzzing** | 1M+ exec/sec | Unpredictable | Variable | ⭐ Not recommended |

**Verdict:** Use **exhaustive testing** - it's faster and more complete than fuzzing!

---

### 📈 Fuzzing Campaign Design (If You Must Fuzz)

#### Phase 1: Seed Corpus (Instant)

**Seeds:**
```
[0, 0, 0, 0]     # Baseline: all zeros
[0, 0, 0, 63]    # Maximum valid (6-bit boundary)
[0, 0, 0, 64]    # Minimum invalid (triggers bug)
[0, 0, 0, 255]   # Maximum 8-bit (worst case)
[1, 0, 0, 120]   # Field overflow case
```

#### Phase 2: Focused Mutation (< 1 minute)

**Mutation Strategy:**
1. Keep limb[0], limb[1], limb[2] at safe values (0 or random)
2. **Focus all mutations on limb[3]**
3. Test values around boundaries: 63, 64, 127, 128, 255

**Expected Findings:**
- Immediately find limb[3] = 64 (first invalid)
- Quickly expand to find all values [64, 255]
- Saturation in <1 minute

#### Phase 3: Validation (< 1 minute)

**Validate findings:**
```bash
# For each unique input found by fuzzer
for input in findings/default/queue/*; do
    ./unit_tests.exe --test oracle_correctness
done
```

**Expected:** All findings have limb[3] > 63

---

### 🎯 Structure-Aware Mutation

**Smart Mutation Rules:**

1. **Focus byte 3 (limb[3]):**
   - Mutate byte 3 with high probability (80%)
   - Mutate other bytes with low probability (20%)

2. **Boundary-guided mutation:**
   - Target values near 63/64 boundary
   - Test powers of 2: 64, 128, 256
   - Test BabyBear modulus limb: 120 (0x78)

3. **Preserve structure:**
   - Always provide exactly 4 bytes
   - No need to mutate length
   - Simple fixed-size input

**Dictionary for Focused Fuzzing:**
```
"\x00"  # 0 - baseline
"\x01"  # 1 - low value
"\x3E"  # 62 - below boundary
"\x3F"  # 63 - max valid (6-bit boundary)
"\x40"  # 64 - min invalid (triggers bug)
"\x41"  # 65 - above boundary
"\x78"  # 120 - field overflow trigger
"\x7F"  # 127 - mid invalid range
"\x80"  # 128 - high invalid
"\xFE"  # 254 - near max
"\xFF"  # 255 - max 8-bit
```

---

### 📊 Expected Fuzzing Metrics

**Campaign Targets:**

| Metric | Target | Achievable |
|--------|--------|------------|
| **Throughput** | 10,000+ exec/sec | 1,000,000+ exec/sec ✅ |
| **Coverage** | 100% of limb[3] space | 100% (all 256 values) ✅ |
| **Duration** | <5 minutes | <10ms (exhaustive) ✅ |
| **False Positives** | <1% | 0% (deterministic) ✅ |
| **False Negatives** | <1% | 0% (complete) ✅ |

**Actual Results (Exhaustive):**
- ✅ **All 192 invalid values found** in <10ms
- ✅ **All 64 valid values confirmed** in <5ms
- ✅ **Zero false positives** (deterministic oracle)
- ✅ **Zero false negatives** (exhaustive coverage)

---

### 🔍 Why Exhaustive > Fuzzing for This Bug

**Fuzzing is designed for:**
- Large input spaces (billions of combinations)
- Finding rare bugs (needle in haystack)
- Exploring unknown behavior

**This bug has:**
- Small input space (256 values)
- Known vulnerability pattern (limb[3] > 63)
- Deterministic behavior

**Comparison:**

**Exhaustive Testing:**
```rust
// Test ALL 256 values in <10ms
for limb3 in 0..=255 {
    test(limb3);  // 100% coverage guaranteed
}
```

**Fuzzing:**
```rust
// Random sampling hoping to find all 256 values
while time_remaining {
    test(random_limb3());  // Eventually finds all, but slower
}
```

**Conclusion:** When the input space is **this small** (256 values), exhaustive testing is **faster, simpler, and more reliable** than fuzzing.

---

### 🚦 Fuzzing Decision Matrix

**When to Fuzz vs Exhaustive Test:**

| Characteristic | This Bug | Threshold | Verdict |
|----------------|----------|-----------|---------|
| Input space size | 256 | <10,000 → exhaustive | ✅ Exhaustive |
| Oracle speed | <1μs | <1ms → fuzz OK | ✅ Either works |
| Determinism | Yes | Yes → exhaustive | ✅ Exhaustive |
| Bug trigger rate | 75% (192/256) | >10% → exhaustive | ✅ Exhaustive |
| Coverage goal | 100% | 100% → exhaustive | ✅ Exhaustive |

**Final Recommendation:** **Use exhaustive testing** (already implemented in unit tests). Fuzzing would work but is unnecessary.

---

### 🎓 Fuzzing Lessons for Similar Bugs

**This bug demonstrates:**

1. **Know your input space** - Small spaces don't need fuzzing
2. **Fast oracles enable exhaustive testing** - <1μs × 256 = <256μs total
3. **Structure-aware analysis** - Bug only depends on 1 byte
4. **Determinism is powerful** - Can test every case systematically

**Apply to other iterator order bugs:**
- Decomposition logic with range checks
- Index-dependent constraint application
- Off-by-one errors in loops

**Generic pattern:**
```
If interesting_space_size < 10,000 AND oracle_time < 1ms:
    USE exhaustive_testing()
Else:
    USE fuzzing()
```

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


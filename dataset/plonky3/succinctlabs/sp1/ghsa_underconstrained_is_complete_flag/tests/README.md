# Underconstrained is_complete Flag - Test Suite

## Vulnerability Summary

**Bug:** GHSA-c873-wfhp-wx5m Bug 2 - Underconstrained `is_complete` Flag  
**Project:** SP1 (Succinct Labs)  
**Vulnerable Commit:** `4681d4f0298b387f074fc93f8254584db9d258de`  
**Fix Commit:** `4fe8144f1d57b27503f23795320a4e0eedf464c5`  
**CVE:** None  
**Advisory:** https://github.com/succinctlabs/sp1/security/advisories/GHSA-c873-wfhp-wx5m

### The Bug

In SP1's recursive verifier, the `is_complete` boolean flag signals that a proof represents complete program execution. Prior to v4.0.0, this flag was **underconstrained** in the first recursion layers (`core.rs` and `wrap.rs`):

- **Missing constraints:** The code set `is_complete` in public values but did NOT call `assert_complete()` to enforce the required invariants
- **Impact:** A malicious prover could set `is_complete = 1` even with contradictory state (e.g., `next_pc != 0`), making incomplete execution appear complete
- **Affected components:** 
  - `crates/recursion/circuit/src/machine/core.rs` - first-layer recursive verifier
  - `crates/recursion/circuit/src/machine/wrap.rs` - wrap verifier

### The Fix

The fix (commit `4fe8144`) added `assert_complete()` calls before committing public values:

**In core.rs (line 579 in v4.0.0):**
```rust
assert_complete(builder, recursion_public_values, is_complete);
SC::commit_recursion_public_values(builder, *recursion_public_values);
```

**In wrap.rs (line 82 in v4.0.0):**
```rust
let SP1CompressWitnessVariable { vks_and_proofs, is_complete } = input; // Extract is_complete
// ...
assert_complete(builder, &public_values.inner, is_complete);
builder.assert_felt_eq(is_complete, C::F::one()); // Must be complete
SC::commit_recursion_public_values(builder, public_values.inner);
```

### Constraints Enforced by assert_complete

When `is_complete = 1`, the following must hold:

1. **Boolean:** `is_complete * (is_complete - 1) == 0`
2. **PC:** `is_complete * next_pc == 0` (execution finished)
3. **Start shard:** `is_complete * (start_shard - 1) == 0` (starts at 1)
4. **Next shard:** `is_complete * next_shard != 1` (at least one shard)
5. **Execution shard:** `is_complete * (contains_execution_shard - 1) == 0`
6. **Start execution:** `is_complete * (start_execution_shard - 1) == 0`
7. **Challenger equality:** `is_complete * (end_reconstruct_challenger - leaf_challenger) == 0`
8. **Deferred digest start:** `is_complete * start_reconstruct_deferred_digest == 0`
9. **Deferred digest end:** `is_complete * (end_reconstruct_deferred_digest - deferred_proofs_digest) == 0`
10. **Cumulative sum:** `is_complete * cumulative_sum == 0`

Without these constraints, any of these invariants can be violated.

---

## Test Suite Overview

This directory contains fast, reproducible tests that validate the vulnerability and fix without requiring full proof generation.

### Files

| File | Purpose | Dependencies | Runtime |
|------|---------|--------------|---------|
| `unit_is_complete_underconstrained.rs` | Standalone unit tests with mock structures | None (std only) | < 100ms |
| `harness_is_complete_underconstrained.rs` | Source code static analysis harness | Source code | < 1s |
| `README.md` | This file | - | - |
| `run_unit_tests.sh` | Script to compile and run unit tests | rustc | < 5s |
| `run_harness.sh` | Script to compile and run harness | rustc, sources | < 5s |

---

## Running the Tests

### Prerequisites

**For unit tests:** Only `rustc` required (no SP1 dependencies)

**For harness tests:** 
1. Run `../zkbugs_get_sources.sh` to fetch vulnerable sources
2. Requires `rustc`

### Quick Start (Unit Tests)

```bash
cd tests/
rustc --test unit_is_complete_underconstrained.rs -o test_runner
./test_runner
```

Or use the convenience script:
```bash
cd tests/
chmod +x run_unit_tests.sh
./run_unit_tests.sh
```

### Expected Output

```
running 8 tests
test tests::test_valid_complete_proof ... ok
test tests::test_incomplete_proof_with_is_complete_true ... ok
test tests::test_is_complete_true_but_wrong_start_shard ... ok
test tests::test_is_complete_true_but_nonzero_cumulative_sum ... ok
test tests::test_is_complete_true_but_challenger_mismatch ... ok
test tests::test_is_complete_false_allows_inconsistent_state ... ok
test tests::test_wrap_verifier_requires_is_complete_one ... ok
test tests::test_constraint_violation_reporting ... ok
test fuzzing_oracle::test_differential_oracle ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out
```

### Harness Tests (Source Analysis)

```bash
# First, fetch sources
cd ..
./zkbugs_get_sources.sh

# Then run harness
cd tests/
rustc harness_is_complete_underconstrained.rs -o harness_runner
./harness_runner
```

Or use the convenience script:
```bash
cd tests/
chmod +x run_harness.sh
./run_harness.sh
```

---

## Test Descriptions

### Unit Tests

#### 1. `test_valid_complete_proof`
- **Purpose:** Baseline - both vulnerable and fixed versions should accept truly valid complete proofs
- **Setup:** All constraints satisfied (`is_complete=1`, `next_pc=0`, etc.)
- **Expected:** Both accept

#### 2. `test_incomplete_proof_with_is_complete_true` ⭐ **KEY TEST**
- **Purpose:** Demonstrates the core vulnerability
- **Setup:** `is_complete=1` BUT `next_pc=100` (execution incomplete)
- **Vulnerable behavior:** ACCEPTS (no constraint checking)
- **Fixed behavior:** REJECTS (constraint violation detected)
- **This is the smoking gun!**

#### 3. `test_is_complete_true_but_wrong_start_shard`
- **Purpose:** Another constraint violation scenario
- **Setup:** `is_complete=1` BUT `start_shard=5` (should be 1)
- **Vulnerable:** Accepts
- **Fixed:** Rejects

#### 4. `test_is_complete_true_but_nonzero_cumulative_sum`
- **Purpose:** Tests cumulative sum constraint
- **Setup:** `is_complete=1` BUT `cumulative_sum[0]=42` (should be 0)
- **Vulnerable:** Accepts
- **Fixed:** Rejects

#### 5. `test_is_complete_true_but_challenger_mismatch`
- **Purpose:** Tests challenger equality constraint
- **Setup:** `is_complete=1` BUT `end_reconstruct_challenger != leaf_challenger`
- **Vulnerable:** Accepts
- **Fixed:** Rejects

#### 6. `test_is_complete_false_allows_inconsistent_state`
- **Purpose:** Validates that constraints are only enforced when `is_complete=1`
- **Setup:** `is_complete=0`, inconsistent state
- **Expected:** Both accept (correct behavior)

#### 7. `test_wrap_verifier_requires_is_complete_one`
- **Purpose:** Tests wrap verifier's additional requirement
- **Setup:** Valid constraints but `is_complete=0`
- **Core verifier:** Accepts
- **Wrap verifier:** Rejects (must be 1)

#### 8. `test_constraint_violation_reporting`
- **Purpose:** Tests that multiple violations are detected
- **Setup:** Multiple constraint violations
- **Expected:** All violations reported

#### 9. `test_differential_oracle` (fuzzing oracle)
- **Purpose:** Fuzzing oracle that compares vulnerable vs fixed behavior
- **Input:** `(is_complete, next_pc, start_shard, cumulative_sum_word)`
- **Oracle:** Returns true when behaviors differ (bug detected)
- **Use case:** Can be used as a fuzzing target

### Harness Tests

#### 1. `test_complete_rs_exists`
- Verifies that `complete.rs` exists and contains the `assert_complete` function
- Checks for key constraint patterns

#### 2. `test_core_rs_vulnerability`
- Analyzes `core.rs` for presence of `assert_complete()` call
- Reports whether vulnerable or fixed

#### 3. `test_wrap_rs_vulnerability`
- Analyzes `wrap.rs` for presence of `assert_complete()` call
- Checks for the `..` pattern that ignores `is_complete`

#### 4. `test_compress_rs_has_assert_complete`
- Control test: `compress.rs` should have `assert_complete()` even in vulnerable version
- Validates the harness logic

#### 5. `test_version_detection`
- Attempts to determine if sources are vulnerable or fixed version
- Reports which commit the code matches

#### 6. `test_detailed_line_search`
- Performs detailed pattern search showing exact lines
- Useful for debugging and verification

---

## Invariant

**Oracle Invariant:**
```
For any recursion public values pv:
  IF pv.is_complete == 1 THEN all completion constraints must be satisfied
  
Where completion constraints include:
  - pv.next_pc == 0
  - pv.start_shard == 1
  - pv.cumulative_sum == [0; 8]
  - ... (see full list above)
```

**Differential Oracle:**
```rust
fn oracle(pv: RecursionPublicValues) -> bool {
    vulnerable_verify(pv) != fixed_verify(pv)
}
```

When the oracle returns `true`, a discrepancy is detected, indicating the vulnerability.

---

## Oracles Used

✅ **Version-diff oracle:** Compare vulnerable (4681d4f) vs fixed (4fe8144) behavior  
✅ **Mutated-artifact oracle:** Create public values with contradictory fields, test acceptance  
✅ **Static analysis oracle:** Check for presence of `assert_complete()` calls in source code  
❌ **Metamorphic oracle:** Not applicable to this bug  
❌ **Shadow-exec:** Not applicable (this is a circuit-level bug)

---

## Seeds (for fuzzing)

### Seed 1: Basic incomplete execution
```json
{
  "is_complete": 1,
  "next_pc": 100,
  "start_shard": 1,
  "next_shard": 2,
  "contains_execution_shard": 1,
  "start_execution_shard": 1,
  "cumulative_sum": [0, 0, 0, 0, 0, 0, 0, 0]
}
```
**Expected:** Vulnerable accepts, fixed rejects

### Seed 2: Wrong start shard
```json
{
  "is_complete": 1,
  "next_pc": 0,
  "start_shard": 5,
  "next_shard": 6,
  "contains_execution_shard": 1,
  "start_execution_shard": 1,
  "cumulative_sum": [0, 0, 0, 0, 0, 0, 0, 0]
}
```
**Expected:** Vulnerable accepts, fixed rejects

### Seed 3: Nonzero cumulative sum
```json
{
  "is_complete": 1,
  "next_pc": 0,
  "start_shard": 1,
  "next_shard": 2,
  "contains_execution_shard": 1,
  "start_execution_shard": 1,
  "cumulative_sum": [42, 0, 0, 0, 0, 0, 0, 0]
}
```
**Expected:** Vulnerable accepts, fixed rejects

---

## Outcomes Matrix

| Version | Commit | Unit Tests | Harness Detection | Behavior |
|---------|--------|------------|-------------------|----------|
| **Vulnerable** | 4681d4f | Demonstrates bug (test_incomplete_proof passes) | Detects missing `assert_complete` calls | Accepts contradictory `is_complete` states |
| **Fixed** | 4fe8144 | Shows fix works (test_incomplete_proof catches violation) | Detects `assert_complete` calls present | Rejects contradictory states |

---

## Fuzzing Integration

### Using the Differential Oracle

The `oracle_detects_inconsistency` function can be used as a libFuzzer/AFL++ target:

```rust
#[no_mangle]
pub extern "C" fn LLVMFuzzerTestOneInput(data: *const u8, size: usize) -> i32 {
    if size < 16 { return 0; }
    
    let bytes = unsafe { std::slice::from_raw_parts(data, size) };
    let is_complete = u32::from_le_bytes(bytes[0..4].try_into().unwrap());
    let next_pc = u32::from_le_bytes(bytes[4..8].try_into().unwrap());
    let start_shard = u32::from_le_bytes(bytes[8..12].try_into().unwrap());
    let cumulative_sum = u32::from_le_bytes(bytes[12..16].try_into().unwrap());
    
    if oracle_detects_inconsistency(is_complete, next_pc, start_shard, cumulative_sum) {
        // Found interesting input!
        panic!("Inconsistency detected");
    }
    
    0
}
```

### Structure-Aware Mutations

Recommended mutation strategies for fuzzing:
- **Field mutations:** Flip individual fields in `RecursionPublicValues`
- **is_complete flip:** Toggle `is_complete` while keeping other fields constant
- **Constraint boundary:** Mutate values around constraint boundaries (0, 1)
- **Digest mutations:** Flip bits in digest fields
- **Counter mutations:** Mutate shard/execution counters

---

## What This Test Suite Does NOT Require

❌ Full SP1 SDK build  
❌ Guest program compilation  
❌ Prover infrastructure  
❌ Full proof generation (extremely slow)  
❌ Recursive verifier setup  
❌ Network access

✅ **Just rustc and source code!**

---

## Limitations

- **Unit tests** use mock structures, not real SP1 types (but logic is identical)
- **Harness tests** do static analysis, not runtime verification
- **Full exploit** (generating real malicious proof) would require:
  - Building SP1 SDK
  - Generating partial execution proof
  - Manually modifying proof's `is_complete` field
  - Submitting to verifier
  - Observing incorrect acceptance

However, these tests provide **fast validation** that the vulnerability exists and the fix works, without the complexity of a full exploit.

---

## Future Enhancements

1. **Real proof mutation:** Deserialize actual SP1 proof binaries and mutate `is_complete` field
2. **Verifier integration:** Call real SP1 verifier with mutated proofs
3. **Coverage-guided fuzzing:** Use libFuzzer with structure-aware mutations
4. **Cross-zkVM testing:** Port oracle to RISC0, Jolt, OpenVM for comparison
5. **Performance benchmarking:** Measure oracle execution throughput for fuzzing campaigns

---

## References

- **GitHub Advisory:** https://github.com/succinctlabs/sp1/security/advisories/GHSA-c873-wfhp-wx5m
- **Fix PR:** https://github.com/succinctlabs/sp1/pull/133
- **Vulnerable files:**
  - `crates/recursion/circuit/src/machine/core.rs` (line 584 sets `is_complete`, line 594 commits, no `assert_complete`)
  - `crates/recursion/circuit/src/machine/wrap.rs` (line 52 ignores `is_complete` with `..`, line 89 commits, no `assert_complete`)
- **Helper function:** `crates/recursion/circuit/src/machine/complete.rs` (`assert_complete`)
- **Control file:** `crates/recursion/circuit/src/machine/compress.rs` (line 549 has `assert_complete`, correctly implemented)
- **Affected versions:** < v4.0.0
- **Fix version:** v4.0.0+

---

## Contact

For questions about this test suite or the zkBugs dataset:
- **Repository:** https://github.com/zksecurity/zkbugs
- **Issue tracker:** https://github.com/zksecurity/zkbugs/issues/57


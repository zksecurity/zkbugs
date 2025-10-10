# chip_ordering Validation Oracle & Tests

## Vulnerability Summary
SP1's STARK verifier used a prover-provided `chip_ordering` HashMap to index into the chips array when fetching preprocessed column data. Prior to v4.0.0, the verifier did not validate that `chips[i].name()` matched the expected chip name from the verifying key, allowing a malicious prover to potentially swap chip indices and bypass verifier checks.

**CVE:** None  
**Advisory:** [GHSA-c873-wfhp-wx5m](https://github.com/succinctlabs/sp1/security/advisories/GHSA-c873-wfhp-wx5m) (Bug 1 of 3)  
**Vulnerable Commit:** `1fa7d2050e6c0a5f6fc154a395f3e967022f7035`  
**Fix Commit:** `7e2023b2cbd3c2c8e96399ef52784dd2ec08f617`  
**Affected Component:** STARK verifier (recursive verifier and on-chain verifier were NOT affected)

## Invariant
**Chip identity must match:** For each chip in `vk.chip_information`, if `chip_ordering[name]` returns index `i`, then `chips[i].name()` must equal `name`. Any mismatch indicates a malicious or corrupted proof.

## Vulnerable Code

### Before (commit 1fa7d20):
```rust
let preprocessed_domains_points_and_opens = vk
    .chip_information
    .iter()
    .map(|(name, domain, _)| {
        let i = chip_ordering[name];  // ❌ No validation!
        let values = opened_values.chips[i].preprocessed.clone();
        // ... continues with wrong chip data
    });
```

### After (commit 7e2023b2):
```rust
let preprocessed_domains_points_and_opens = vk
    .chip_information
    .iter()
    .map(|(name, domain, _)| {
        let i = *chip_ordering.get(name).filter(|&&i| i < chips.len()).ok_or(
            VerificationError::PreprocessedChipIdMismatch(name.clone(), String::new()),
        )?;
        
        // ✅ Validation added!
        if name != &chips[i].name() {
            return Err(VerificationError::PreprocessedChipIdMismatch(
                name.clone(),
                chips[i].name(),
            ));
        }
        
        let values = opened_values.chips[i].preprocessed.clone();
        // ...
    });
```

## Oracle

### 1. Version-Diff Oracle
Run the same test case on vulnerable vs fixed commit and compare results.

### 2. Mutated-Artifact Oracle (Differential)
Compare vulnerable vs fixed verifier behavior:

```rust
fn vulnerable_verify(chip_info, chip_ordering, chips) -> Result<()> {
    let i = chip_ordering[name];
    // No validation - accepts swapped indices
}

fn fixed_verify(chip_info, chip_ordering, chips) -> Result<()> {
    let i = chip_ordering[name];
    if name != &chips[i].name() {
        return Err(PreprocessedChipIdMismatch);  // Rejects swapped indices
    }
}
```

**Oracle condition:** Vulnerable accepts but fixed rejects → vulnerability confirmed

## Seed Values / Test Corpus

### Baseline (Correct ordering)
```rust
chip_info: ["Cpu", "Memory", "ALU"]
chips:     [Cpu,   Memory,   ALU]      // Indices: 0, 1, 2
chip_ordering: {
    "Cpu"    => 0,  // ✓ Correct
    "Memory" => 1,  // ✓ Correct
    "ALU"    => 2,  // ✓ Correct
}
// Both versions accept ✅
```

### Seed 1: Swapped indices (triggers bug)
```rust
chip_info: ["Cpu", "Memory", "ALU"]
chips:     [Cpu,   Memory,   ALU]
chip_ordering: {
    "Cpu"    => 1,  // ❌ Points to Memory
    "Memory" => 0,  // ❌ Points to Cpu
    "ALU"    => 2,  // ✓ Correct
}
// Vulnerable: accepts ❌
// Fixed: rejects ✅ (PreprocessedChipIdMismatch)
```

### Seed 2: Rotated indices
```rust
chip_ordering: {
    "Cpu"    => 2,  // Points to ALU
    "Memory" => 0,  // Points to Cpu
    "ALU"    => 1,  // Points to Memory
}
// Vulnerable: accepts ❌
// Fixed: rejects ✅
```

### Seed 3: Partial mismatch
```rust
chip_ordering: {
    "Cpu"    => 1,  // ❌ Wrong
    "Memory" => 1,  // ✓ Correct (but same as Cpu)
    "ALU"    => 2,  // ✓ Correct
}
// Vulnerable: accepts ❌
// Fixed: rejects ✅ (detects Cpu mismatch)
```

## Running Tests

### Unit Test (No dependencies, runs in milliseconds)
The unit test simulates the verifier logic with mock structures and requires NO SP1 dependencies.

```bash
cd tests/
rustc --test unit_chip_ordering_validation.rs -o unit_runner
./unit_runner
```

Or with cargo:
```bash
cd tests/
cargo test --test unit_chip_ordering_validation
```

### Harness Test (Source code analysis)
The harness test analyzes the actual verifier.rs source code to detect vulnerability.

```bash
cd tests/
rustc harness_chip_ordering_validation.rs -o harness_runner
./harness_runner
```

Or:
```bash
cd tests/
cargo run --bin harness_chip_ordering_validation
```

### Using the provided scripts:
```bash
# Run unit tests
./run_unit_tests.sh

# Run harness tests
./run_harness.sh
```

## Expected Output

### Unit Test Output
```
==============================================
SP1 chip_ordering Validation Unit Tests
==============================================
Advisory: GHSA-c873-wfhp-wx5m Bug 1
Vulnerable: commit 1fa7d2050e6c0a5f6fc154a395f3e967022f7035
Fixed: commit 7e2023b2cbd3c2c8e96399ef52784dd2ec08f617
==============================================

Running unit tests...

=== Test 1: Correct chip_ordering ===
Chip ordering: {"ALU": 2, "Cpu": 0, "Memory": 1}
Chips: ["Cpu", "Memory", "ALU"]
Vulnerable version: Ok(())
Fixed version: Ok(())

=== Test 2: Swapped Cpu <-> Memory indices ===
Chip ordering (SWAPPED): {"ALU": 2, "Cpu": 1, "Memory": 0}
Chips array: ["Cpu", "Memory", "ALU"]
Vulnerable version: Ok(())
Fixed version: Err("PreprocessedChipIdMismatch: expected 'Cpu', but chips[1].name() = 'Memory'")
Error message: PreprocessedChipIdMismatch: expected 'Cpu', but chips[1].name() = 'Memory'

... [more tests]

==============================================
✅ All unit tests completed
==============================================
```

### Harness Test Output (Vulnerable Commit)
```
==============================================
SP1 chip_ordering Validation Harness Test
==============================================
Advisory: GHSA-c873-wfhp-wx5m Bug 1
==============================================

Test 1: Verifier Source Code Analysis
---------------------------------------------
  ✓ verifier.rs found
  ✓ Uses chip_ordering: true

  Chip Ordering Validation Analysis:
    Uses chip_ordering for indexing: true
    Has name validation:              false
    Has bounds checking:              false

  ❌ VULNERABLE: chip_ordering is used without name validation!
     The verifier trusts prover-provided chip indices.
     This commit is susceptible to GHSA-c873-wfhp-wx5m Bug 1

     Expected fix:
     ```rust
     if name != &chips[i].name() {
         return Err(VerificationError::PreprocessedChipIdMismatch(...));
     }
     ```
```

### Harness Test Output (Fixed Commit)
```
Test 1: Verifier Source Code Analysis
---------------------------------------------
  ✓ verifier.rs found
  ✓ Uses chip_ordering: true

  Chip Ordering Validation Analysis:
    Uses chip_ordering for indexing: true
    Has name validation:              true
    Has bounds checking:              true

  ✅ FIXED: Chip name validation is present
     The verifier checks that chips[i].name() matches expected name
```

## Outcomes Matrix

| Version | Commit | Unit Test | Harness Test | Behavior |
|---------|--------|-----------|--------------|----------|
| **Vulnerable** | `1fa7d20` | Shows bug: accepts swapped indices | Detects: no validation present | Accepts malicious chip_ordering without checks |
| **Fixed** | `7e2023b2` | Shows fix: rejects swapped indices | Detects: validation present | Rejects mismatched chip indices with `PreprocessedChipIdMismatch` error |

## Fuzzing Integration

### Fuzzing Target
The `differential_oracle` function in `unit_chip_ordering_validation.rs` can be used as a fuzzing target.

### Structure-Aware Mutations
For effective fuzzing, mutate the `chip_ordering` HashMap with:
- **Index swaps:** Swap indices of two random chips
- **Rotations:** Rotate all indices by N positions
- **Random valid index:** Point chip to random valid index (0..chips.len())
- **Out of bounds:** Point chip to index >= chips.len()
- **Duplicates:** Point multiple chips to same index
- **Missing entries:** Remove chip from ordering

### Fuzzing Entry Point
```rust
fn fuzz_target(
    chip_names: Vec<String>,
    mutated_chip_ordering: HashMap<String, usize>,
) -> bool {
    let chips: Vec<_> = chip_names.iter()
        .map(|n| MockChip::new(n))
        .collect();
    
    differential_oracle(&chip_names, &mutated_chip_ordering, &chips)
}
```

### Interesting Inputs
The fuzzer should flag any input where `differential_oracle` returns `true` (disagreement between vulnerable and fixed versions).

## Impact & Advantages

### What This Test Demonstrates
✅ **Vulnerability is reproducible** without full SP1 SDK  
✅ **Fast execution:** Unit tests run in milliseconds  
✅ **Precise oracle:** Detects exactly when chip indices are mismatched  
✅ **Fuzzing-ready:** Can be integrated into fuzzing pipelines  
✅ **Version-diff capable:** Can verify fix across commits  

### What This Test Doesn't Require
❌ Full proof generation (slow, complex)  
❌ Guest program compilation  
❌ Prover infrastructure  
❌ Recursive verifier setup  

### Limitations
- Unit tests use mock structures, not real SP1 types
- Harness test does source analysis, not runtime verification
- Full exploit (deserializing real ShardProof and verifying) would require SP1 SDK

### Future Enhancements
1. **Real ShardProof mutation:** Deserialize actual proof binaries and mutate chip_ordering field
2. **Verifier integration:** Call real SP1 verifier with mutated proofs
3. **Coverage-guided fuzzing:** Use libFuzzer or AFL++ with structure-aware mutations
4. **Cross-zkVM comparison:** Apply same oracle pattern to other zkVMs

## References

- **GitHub Advisory:** https://github.com/succinctlabs/sp1/security/advisories/GHSA-c873-wfhp-wx5m
- **Fix PR:** https://github.com/succinctlabs/sp1/pull/131 (merged in PR #133)
- **Vulnerable file:** `crates/stark/src/verifier.rs` (or `core/src/stark/verifier.rs` in older versions)
- **Affected versions:** < v4.0.0
- **Fix version:** v4.0.0+

## Contact

For questions about this test suite or the zkBugs dataset:
- **Repository:** https://github.com/zksecurity/zkbugs
- **Issue:** https://github.com/zksecurity/zkbugs/issues/57


# Allocator Overflow Oracle & Tests

## Vulnerability Summary
SP1's embedded allocator in `read_vec_raw` function had an integer overflow vulnerability where `ptr + capacity > MAX_MEMORY` check used wrapping arithmetic, allowing bypass when `capacity` is large.

**CVE:** None  
**Advisory:** [GHSA-6248-228x-mmvh](https://github.com/succinctlabs/sp1/security/advisories/GHSA-6248-228x-mmvh)  
**Vulnerable Commit:** `ad212dd52bdf8f630ea47f2b58aa94d5b6e79904`  
**Fix Commit:** `aa9a8e40b6527a06764ef0347d43ac9307d7bf63`

## Invariant
**Overflow must be detected:** For any `ptr` and `capacity`, if `ptr + capacity` would overflow `usize` or exceed `MAX_MEMORY (0x78000000)`, the allocator must reject the allocation.

## Oracle
**Differential Oracle:** Compare wrapping vs saturating arithmetic behavior.

```rust
fn vulnerable_check(ptr: usize, capacity: usize) -> bool {
    ptr.wrapping_add(capacity) > MAX_MEMORY  // Bug: can wrap to small value
}

fn fixed_check(ptr: usize, capacity: usize) -> bool {
    ptr.saturating_add(capacity) > MAX_MEMORY  // Fix: clamps to usize::MAX
}
```

## Seed Values
**Critical test case:**
- `ptr = 0x70000000` (near MAX_MEMORY)
- `capacity = 0xFFFFFFFF` (near u32::MAX)
- **Vulnerable:** sum wraps to `0x6FFFFFFF` < MAX_MEMORY ❌ (bypass!)
- **Fixed:** sum saturates to `usize::MAX` > MAX_MEMORY ✅ (detected!)

## Running Tests

### Unit Test (No dependencies)
```bash
cd tests/
rustc --test unit_allocator_overflow.rs -o test_runner
./test_runner
```

### Expected Output
```
test allocator_overflow_tests::test_ptr_capacity_wrapping_overflow ... ok
test allocator_overflow_tests::test_realistic_overflow_scenarios ... ok
test allocator_overflow_tests::test_memory_corruption_scenario ... ok
test allocator_overflow_tests::test_heap_end_overflow ... ok
test fuzzing_oracle_tests::test_differential_oracle ... ok
```

## Outcomes

| Version | Test Result | Behavior |
|---------|-------------|----------|
| **Vulnerable** (`ad212dd5`) | Unit tests demonstrate bug | Accepts overflow inputs, sum wraps to small value |
| **Fixed** (`aa9a8e40`) | Unit tests show fix works | Rejects overflow inputs, sum saturates correctly |

## Impact
Demonstrates arbitrary memory write vulnerability without requiring:
- ❌ Full SP1 SDK build
- ❌ Guest program compilation
- ❌ Prover/verifier infrastructure
- ✅ Just pure Rust arithmetic (runs in milliseconds)


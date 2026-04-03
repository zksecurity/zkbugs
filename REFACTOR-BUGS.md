# Refactoring Bugs to New Format

## Overview

All 39 circom bug entries have been refactored from the old format (minimal `circuits/` dir + exploit files) to the new format (full project codebases downloaded on demand + direct wrapper circuits).

**2 bugs removed** (no data): empty maci ProcessMessages, design-only reclaimprotocol interface.

## Architecture

### Codebases

Full project source code is stored in `dataset/codebases/circom/{org}/{project}/{commit}/`, downloaded by `scripts/download_sources.sh`. This directory is gitignored — codebases are reproduced from scratch via clone + patch.

### Two compilation modes

Each bug supports two modes via `ZKBUGS_MODE` env var:

- **`direct`** (default): compiles `circuit.circom` in the bug directory — an isolated wrapper that instantiates only the vulnerable template with minimal parameters. Fast, small ptau.
- **`original`**: compiles the project's actual `component main` entrypoint from the full codebase. Slower (large circuits), validates the vulnerability exists in the real project context.

27/39 bugs have distinct original entrypoints. 12 fall back to direct (9 circomlib library bugs with no `component main`, 3 reclaimprotocol bugs with unavailable repo).

### Bug directory contents

| File | Purpose |
|------|---------|
| `circuit.circom` | Direct wrapper: includes from codebase via `-l`, instantiates vulnerable template |
| `direct_input.json` | Valid input for the direct wrapper |
| `zkbugs_config.json` | Metadata: Codebase, Entrypoint, Direct Entrypoint, Compiled/Executed/Reproduced flags |
| `zkbugs_vars.sh` | Shell variables: paths, mode selection, ptau config |
| `zkbugs_compile.sh` | Compile-only (no zkey ceremony) |
| `zkbugs_compile_setup.sh` | Compile + zkey ceremony |
| `zkbugs_positive_test.sh` | Witness generation + proof + verify |
| `zkbugs_setup.sh` | Check tools, create circomlib symlinks |
| `zkbugs_clean.sh` | Remove build artifacts |
| `*.circom` (extra) | Custom circuit files for bugs that need them (e.g., `bls_signature.circom`, `generics.circom`) |

### Removed files (old format)

- `circuits/` directory (minimal reproduction)
- `detect.sage`
- `exploitable_witness.json`
- `zkbugs_exploit.sh`
- `zkbugs_find_exploit.sh`

## Scripts

| Script | Purpose |
|--------|---------|
| `scripts/download_sources.sh` | Clone codebases, apply patches, install deps, generate entrypoints |
| `scripts/test_all_circom.sh` | Test all bugs: `--compile-only`, `--mode direct\|original\|both`, `--skip-large` |
| `scripts/print_bug_status.py` | Print status table with Compiled/Executed/Reproduced flags |
| `scripts/migrate_bug.sh` | Migration script (used during refactoring, kept for reference) |
| `scripts/patches/*.patch` | Patch files for codebase modifications (kept for reference) |

## Codebase patches

The `download_sources.sh` script applies these fixes after cloning (needed for circom 2.x compatibility):

| Project | Fix |
|---------|-----|
| succinctlabs/telepathy-circuits (both commits) | Remove `p` signal assignments in fp12.circom, fix BigMultShortLong 2-param calls |
| darkforest-eth/darkforest-v0.3 | Add pragma, semicolons, remove `signal private` in init/move/range_proof |
| iden3/circomlib @ 324b8bf8 | Add pragma, sized array constant, `<--` signal syntax in mimcsponge |
| privacy-scaling-explorations/maci | Remove `signal private`, add pragma, fix semicolons, install circomlib |
| zkopru-network/zkopru (both commits) | Remove `signal private`, add pragma, fix semicolons |
| selfxyz/self @ 3905a30 | Comment out `component main` in vc_and_disclose_aadhaar.circom |
| semaphore-protocol/semaphore | Comment out `component main` in semaphore.circom |

Generated entrypoints (for projects where `component main` was commented out or dynamically generated):
- Unirep: `packages/circuits/generated/epochKeyLite.circom`, `bigComparators.circom`
- Semaphore: `packages/circuits/generated/semaphore_main.circom`
- Selfxyz: `circuits/circuits/disclose/generated/vc_and_disclose_aadhaar_main.circom`

## Dependencies

Circomlib symlinks are created by `download_sources.sh` for projects that use `node_modules/circomlib`:
- succinctlabs/telepathy-circuits (parent-level symlink)
- darkforest-eth (client/node_modules)
- personaelabs/spartan-ecdsa, iden3/circuits, tangle-network (root node_modules)
- semaphore-protocol (packages/node_modules + packages/circuits/node_modules)
- zkopru-network (packages/node_modules)
- Unirep (packages/circuits/circuits/circomlib)

NPM packages installed for:
- selfxyz/self: @openpassport/zk-email-circuits, @zk-kit/binary-merkle-root.circom v1, circom-bigint, anon-aadhaar-circuits
- semaphore: @zk-kit/binary-merkle-root.circom v2

## Status flags

Each bug's `zkbugs_config.json` has:
- `"Compiled Direct"`: direct mode compilation passes
- `"Compiled Original"`: original mode compilation passes
- `"Executed"`: full direct test passes (compile + zkey + witness + proof + verify)
- `"Reproduced"`: false for all (exploit files removed in this refactor)

## Results

```
Compiled Direct:   39/39 (100%)
Compiled Original: 39/39 (100%)
Executed:          35/39 (89%)
Reproduced:        0/39 (0%)
```

4 bugs compile but don't execute (witness generation fails due to project-specific infrastructure):
- maci hashcloak: Poseidon circomlib fork mismatch
- selfxyz missing_byte_range: needs Aadhaar QR infrastructure
- yacademy Knowledge: needs secp256k1 curve
- zkopru ERC20: needs compatible ZkTransaction inputs

## Reproduction

```bash
# Download codebases (~5 min)
./scripts/download_sources.sh

# Verify compilation (both modes, ~30 min for original due to large circuits)
./scripts/test_all_circom.sh --compile-only --mode both

# Full test in direct mode (~15 min, needs ptau files)
./scripts/test_all_circom.sh --skip-large

# Print status
python3 scripts/print_bug_status.py Circom
```

Ptau files needed (gitignored, download from Hermez ceremony):
```bash
# Already in repo: bn128_pot12, bn128_pot14, bn128_pot16
# Download for larger circuits:
curl -L -o misc/circom/powersOfTau28_hez_final_20.ptau \
  https://storage.googleapis.com/zkevm/ptau/powersOfTau28_hez_final_20.ptau
curl -L -o misc/circom/powersOfTau28_hez_final_22.ptau \
  https://storage.googleapis.com/zkevm/ptau/powersOfTau28_hez_final_22.ptau
```

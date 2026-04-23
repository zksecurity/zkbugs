# Spammers may slash themselves

* Id: Rate-Limiting-Nullifier/circom-rln/veridise_spammers_may_slash_themselves
* Project: https://github.com/Rate-Limiting-Nullifier/circom-rln
* Commit: 022b690b5615d1e26874013cf216136875d8f3ab
* Fix Commit: 
* DSL: Circom
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Circuit Design Issue
* Reproduced: False
* Codebase: dataset/codebases/circom/Rate-Limiting-Nullifier/circom-rln/022b690b5615d1e26874013cf216136875d8f3ab
* Original Entrypoint: circuits/withdraw.circom
* Direct Entrypoint: circuit.circom
* Location
  - Path: circuits/withdraw.circom
  - Function: Withdraw
  - Line: 5-11
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/veridise-rln.pdf
  - Bug ID: RLN-001: Spammers may slash themselves
* Input
  - Original: input.json
  - Direct: direct_input.json
* Commands
  - Setup Environment: `./zkbugs_setup.sh`
  - Compile: `./zkbugs_compile.sh`
  - Compile and Preprocess: `./zkbugs_compile_setup.sh`
  - Positive Test: `./zkbugs_positive_test.sh`
  - Clean: `./zkbugs_clean.sh`

## Running

Scripts support two modes controlled by the `ZKBUGS_MODE` environment variable:

- **`original`** (default): compiles the project's main circuit from the full codebase.
- **`direct`**: compiles an isolated wrapper (`circuit.circom`) that only instantiates the vulnerable template.

```bash
# Setup (run once)
./zkbugs_setup.sh

# Compile only (no zkey ceremony)
./zkbugs_compile.sh                        # original mode
ZKBUGS_MODE=direct ./zkbugs_compile.sh     # direct mode

# Full setup with zkey ceremony + positive test (direct mode)
ZKBUGS_MODE=direct ./zkbugs_compile_setup.sh
ZKBUGS_MODE=direct ./zkbugs_positive_test.sh

# Clean build artifacts
./zkbugs_clean.sh
```

## Short Description of the Vulnerability

The `Withdraw` template in `withdraw.circom` only proves knowledge of the pre-image of an `identityCommitment` via `signal output identityCommitment <== Poseidon(1)([identitySecret])`, with `addressHash` declared as `signal input addressHash;` and exposed as the sole public input through `component main { public [addressHash] } = Withdraw();`. Because `addressHash` participates in no constraint at the circuit level (it is only referenced by the surrounding smart contract as the slashing-reward beneficiary), a malicious registered user (Alice) who observes an incoming slash request targeting her own `identityCommitment` can construct a new `Withdraw` proof using her own `identitySecret` and her own `addressHash`, then front-run the original slasher's transaction. Because Alice knows her own `identitySecret`, she can also preemptively self-slash after sending pre-determined messages, recovering her staked economic collateral and defeating the spam-resistance guarantee. The circuit itself is satisfiable and correct as a proof-of-knowledge, but the protocol design lets the slashee perform the slashing.

## Proposed Mitigation

Split the stake so the slasher only receives a portion of the economic collateral (e.g., half burned or distributed to other protocol participants), or require `Withdraw` to provide proof of knowledge of two distinct `identity_secret_hash` pre-images (one proving Merkle-tree membership as the slasher, and one being the identity to slash), doubling the stake required to self-slash. The deployed RLN contract addresses this by taking a fee on slash/withdraw and by freezing withdrawals for `n` blocks to allow other users to slash first.

# Blacklist States Cannot Be Represented Within the Circom Field

* Id: pantherfoundation/panther-core/veridise_blacklist_states_not_representable_in_field
* Project: https://github.com/pantherfoundation/panther-core
* Commit: b464348b33155a5877f67c085c7206dc29ad7cb7
* Fix Commit: 1763ca4
* DSL: Circom
* Vulnerability: Computational Issues
* Impact: Completeness
* Root Cause: Arithmetic Field Issues
* Reproduced: False
* Codebase: dataset/codebases/circom/pantherfoundation/panther-core/b464348b33155a5877f67c085c7206dc29ad7cb7
* Original Entrypoint: circuits/circuits/mainZTransactionV1.circom
* Direct Entrypoint: circuit.circom
* Location
  - Path: circuits/circuits/templates/zAccountBlackListLeafInclusionProver.circom
  - Function: ZAccountBlackListLeafInclusionProver
  - Line: 18-80
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/veridise-panther.pdf
  - Bug ID: V-PAN-VUL-009: Blacklist states cannot be represented within the circom field
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

The `ZAccountBlackListLeafInclusionProver(ZAccountBlackListMerkleTreeDepth)` template encodes blacklist status by using a 254-bit Merkle leaf where each bit marks whether a zAccountId is banned. Internally it uses `component n2b_leaf = Num2Bits(254); n2b_leaf.in <== leaf;` and a `for(var i = 0; i < 254; i++)` loop that ANDs `is_zero[i].out * n2b_leaf.out[i]`. However, the BN254 scalar field `p` is smaller than `2^254`, so valid 254-bit leaves that represent specific blacklist states — e.g. `2^253 + 2^252 + 2^251` to ban zAccountIds 251, 252 and 253 simultaneously — exceed `p` and cannot be represented as a field element. For such states there is no valid assignment of `leaf` for which the Merkle inclusion proof succeeds, so banning those zAccountIds becomes impossible. A malicious entity that controls the leaf value can keep it in a state whose next update would exceed `p`, locking their co-tenants out of the blacklist.

## Proposed Mitigation

Increase the `ZAccountBlackListMerkleTree` depth to 17 and decrease the leaf bit space to 128 so that every blacklist state is representable. Alternatively, in `_getNextZAccountId` skip values 253–255 for the 8 LSBs so the leaf only ever needs 253 bits.

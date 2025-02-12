# Missing range checks in MulAdd chip (Not Reproduce)

* Id: scroll-tech/zkevm-circuits/zellic_Missing_range_checks_in_MulAdd_chip
* Project: https://github.com/scroll-tech/zkevm-circuits
* Commit: 0xf3ebc6af0e5049d2f45259ef79741f9c7d7794e1
* Fix Commit: b20bed27e0a1b1345c125a2975875be555d2dff9
* DSL: Halo2
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Arithmetic Field Issues
* Reproduced: False
* Location
  - Path: gadgets/src/mul_add.rs
  - Function: 
  - Line: 16
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/zellic-scroll.pdf
  - Bug ID: Missing range checks in MulAdd chip
* Commands
  - Setup Environment: ``
  - Reproduce: ``
  - Compile and Preprocess: ``
  - Positive Test: ``
  - Find Exploit: ``
  - Clean: ``

## Short Description of the Vulnerability

The bug in the MulAdd chip relates to the absence of range checks for the individual elements used in calculations. Each element, such as 'a', 'b', 'c', and their associated limbs, must fall within specific ranges to ensure correct functionality; without these checks, the chip may accept incorrect values, potentially compromising the integrity of calculations. This issue has been classified as critical due to its potential impact on the overall functionality.

## Short Description of the Exploit



## Proposed Mitigation

The recommended fix for the 'Missing range checks in MulAdd chip' bug is to use the RangeCheckGadget to constrain the elements used within the chip to their expected values, specifically ensuring that the limbs and carry elements are within specified ranges.


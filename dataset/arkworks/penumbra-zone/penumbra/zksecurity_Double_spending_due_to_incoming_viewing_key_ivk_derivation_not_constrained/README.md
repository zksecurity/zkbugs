# Double spending due to incoming viewing key (ivk) derivation not constrained (Not Reproduce)

* Id: penumbra-zone/penumbra/zksecurity_Double_spending_due_to_incoming_viewing_key_(ivk)_derivation_not_constrained
* Project: https://github.com/penumbra-zone/penumbra
* Commit: 0xa43b594
* Fix Commit: e019839939968012ed2d24cf65bdd86d239b50e9
* DSL: Arkworks
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Out-of-Circuit Computation Not Being Constrained
* Reproduced: False
* Location
  - Path: core/keys
  - Function: IncomingViewingKeyVar::derive
  - Line: 
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/zksecurity-penumbra.pdf
  - Bug ID: Double spending due to incoming viewing key (ivk) derivation not constrained
* Commands
  - Setup Environment: ``
  - Reproduce: ``
  - Compile and Preprocess: ``
  - Positive Test: ``
  - Find Exploit: ``
  - Clean: ``

## Short Description of the Vulnerability

The bug involving the derivation of the incoming viewing key (ivk) in Penumbra's protocols allows for potential double-spending issues due to insufficient constraints during the ivk derivation process. This security issue occurs because the ivk, which should be tightly linked to the nullifier key (nk) for correct operation, can be manipulated by a malicious user during the conversion process between circuit fields. This vulnerability could enable the spending of a note multiple times by varying the nullifier key, thus undermining the intended security guarantees of the system.

## Short Description of the Exploit



## Proposed Mitigation

To resolve the issue of double spending due to unconstrained incoming viewing key (ivk) derivation, Penumbra addressed the problem by computing the reduced value `res` outside the circuit and proving that it correctly satisfies the equation `ivk_mod_q = quotient * r_modulus + res` modulo the circuit field `Fq`, with `quotient` being constrained to `<= 4`. This fix ensures that the modulus of the scalar field `Fr` is smaller than the circuit field `Fq`.


pragma circom 2.1.9;

include "circuits/circuits/templates/utils.circom";
include "circuits/circuits/templates/zoneIdInclusionProver.circom";

// Direct entrypoint for V-PAN-VUL-015. The for-loop runs i from 0 to 14 (15
// iterations), so setting `offset = 15` means no iteration matches and
// ForceEqualIfEnabled() is never enabled — the check is silently skipped.
// The wrapper tags untagged public inputs as expected by the template.
template Wrapper() {
    signal input enabled;
    signal input zoneId;
    signal input zoneIds;
    signal input offset;

    component zoneIdTagged = Uint16Tag(Active());
    zoneIdTagged.in <== zoneId;

    component offsetTagged = Uint4Tag(Active());
    offsetTagged.in <== offset;

    component prover = ZoneIdInclusionProver();
    prover.enabled <== enabled;
    prover.zoneId <== zoneIdTagged.out;
    prover.zoneIds <== zoneIds;
    prover.offset <== offsetTagged.out;
}

component main {public [enabled, zoneId, zoneIds, offset]} = Wrapper();

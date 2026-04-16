pragma circom 2.1.6;

// EmailAuth instantiates both `InvitationCodeWithPrefixRegex` (regex
// `( )?(c|C)ode( )?(0|1|2|3|4|5|6|7|8|9|a|b|c|d|e|f)+`) and `EmailAddrRegex`
// over the same subject. For subjects like `Send 0.1 ETH to donate@codef.be`
// both templates match overlapping byte ranges: the invitation-code regex
// accepts the `code...f.be` substring as a prefixed-code match, and the
// email-address regex accepts `donate@codef.be` as an address. EmailAuth's
// masking step then subtracts both reveal arrays from `subject_all[i]`, so
// the overlapping bytes go negative, witness generation fails, and legitimate
// commands involving such domains cannot be proven. This is a completeness
// failure in the `InvitationCodeWithPrefixRegex` circuit.
//
// The direct wrapper instantiates `InvitationCodeWithPrefixRegex(32)` alone —
// it is enough to see `out == 1` on `Send 0.1 ETH to donate@codef.be` even
// though no invitation code was ever sent, which is the root of the overlap.
include "packages/circuits/src/regexes/invitation_code_with_prefix_regex.circom";

component main { public [msg] } = InvitationCodeWithPrefixRegex(32);

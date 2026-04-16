pragma circom 2.1.5;

// The zk-regex compiler generated an unsound `FromAllRegex` circuit for the
// pattern `(\r\n|^)from:[^\r\n]+\r\n`. The compiled DFA treats the byte 255
// (0xff, which is reserved by the generator as a "start of input" sentinel)
// as a reset that jumps back to state 0. An attacker can therefore inject a
// 0xff byte earlier in the header (e.g. inside the Subject) and have the
// regex accept a spoofed `from:` line that begins with that 0xff byte even
// though the real From: header is elsewhere. See report Appendix 2 and the
// recommendation "modifying the regexp compiler ... where the 255 value is
// disallowed in the input". The same sentinel handling is reused by every
// circuit generated from a pattern with the `(\r\n|^)Prefix:` shape.
include "packages/circom/circuits/common/from_all_regex.circom";

component main { public [msg] } = FromAllRegex(8);

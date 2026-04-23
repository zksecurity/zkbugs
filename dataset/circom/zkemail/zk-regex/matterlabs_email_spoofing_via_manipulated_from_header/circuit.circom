pragma circom 2.1.5;

// `EmailAddrWithNameRegex` is intended to extract the email address from a
// `from:` header of the form `Some Name <email@domain>`. Its underlying
// regex [^\r\n]+<[A-Za-z0-9!#$%&'*+=?\-\^_`{|}~./@]+@[a-zA-Z0-9.\-]+> is too
// permissive: it anchors on any `<...>`-enclosed token, so an attacker whose
// real From-line is
//   from: "Highly Trusted <trusted@trusted-domain.com>" < attacker@outlook.com>
// gets the circuit to reveal `trusted@trusted-domain.com` as the sender even
// though Outlook accepts the message with the real envelope `attacker@outlook.com`.
// Mail.ru exhibits the same flaw with a trailing space before `>`. The report
// recommends a complete reimplementation of the circuit.
include "packages/circom/circuits/common/email_addr_with_name_regex.circom";

component main { public [msg] } = EmailAddrWithNameRegex(7);

# Email spoofing via manipulated From header

* Id: zkemail/zk-regex/matterlabs_email_spoofing_via_manipulated_from_header
* Project: https://github.com/zkemail/zk-regex
* Commit: 531575345558ba938675d725bd54df45c866ef74
* Fix Commit: 7002a2179e076449b84e3e7e8ba94e88d0a2dc2f
* DSL: Circom
* Vulnerability: Under-Constrained
* Impact: Soundness
* Root Cause: Misimplementation of a Specification
* Reproduced: False
* Codebase: dataset/codebases/circom/zkemail/zk-regex/531575345558ba938675d725bd54df45c866ef74
* Original Entrypoint: packages/circom/tests/circuits/test_from_addr_regex.circom
* Direct Entrypoint: circuit.circom
* Location
  - Path: packages/circom/circuits/common/email_addr_with_name_regex.circom
  - Function: EmailAddrWithNameRegex
  - Line: 6-190
* Source: Audit Report
  - Source Link: https://github.com/zksecurity/zkbugs/blob/main/reports/documents/matterlabs-zkemail.pdf
  - Bug ID: #1 Email spoofing via manipulated From header
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

The `EmailAddrWithNameRegex` circuit is the subroutine `FromAddrRegex` uses to parse `From: Some Name <user@domain>` style headers. Its pattern `[^\r\n]+<[A-Za-z0-9!#$%&'*+=?\-\^_\`{|}~./@]+@[a-zA-Z0-9.\-]+>` is too permissive: the `[^\r\n]+` prefix greedily swallows arbitrary bytes, and the regex accepts any `<local@domain>` segment that eventually appears in the line. Outlook.com and Mail.ru accept SMTP submissions whose `From:` header embeds a quoted nickname containing a second `<...>` pair, for example `from: "Some name <victim@any-domain>" < attacker@outlook.com>` or `from:Some name <victim@any-domain> <attacker@mail.ru >`. The real sender (used for DKIM) is `attacker@outlook.com` / `attacker@mail.ru`, but the regex `reveal0` output in `FromAddrRegex` exposes `victim@any-domain`, attributing the DKIM-signed message to the spoofed address. Because ZK Email treats the extracted address as the root of trust, this breaks the project's entire security model.

## Proposed Mitigation

Reimplement `EmailAddrWithNameRegex` so the prefix does not consume arbitrary printable bytes — e.g. restrict the name part to RFC 5322-compliant display-name characters, disallow embedded `<`/`>` inside quoted strings, and anchor the match at the line start. The report notes that tightening the existing regex alone is unlikely to be sufficient given SMTP parser divergence, and recommends a full rewrite.

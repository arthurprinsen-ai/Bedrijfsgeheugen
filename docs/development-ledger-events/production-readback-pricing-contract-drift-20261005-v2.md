# Development ledger — production-readback-pricing-contract-drift-20261005-v2

- Originating delivery: PR #3741, merge SHA 6a9452fa905073290c9274c2364d2aaaa52ad492.
- Observed production for that merge: exact release marker and Netlify deploy identity were present.
- Blocker: production verifier encoded retired pricing semantics.
- First recovery PR #3759 was closed diff-less after its branch reconciled to main without landing the fix.
- Current recovery rebased from main SHA 155737327f43d9e68dd4f672c0fd45a182b3289d.
- Additional exact-HEAD blocker found by SEO diagnostic: CMS orphan false positive, package-advice orphan, missing AFAS cluster reciprocity.
- Recovery action: repair verifier, regression contract and the three SEO authority gaps.
- Closure condition: exact-HEAD required gates green -> protected auto-merge -> merged SHA -> production readback on resulting main SHA -> TERMINAL_GREEN / LIVE_BEWEZEN.

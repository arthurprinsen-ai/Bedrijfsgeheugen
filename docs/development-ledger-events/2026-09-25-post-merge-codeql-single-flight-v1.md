# Development ledger — post-merge CodeQL single-flight

- Date: 2026-09-25
- Obligation: prevent recurring pending post-merge CodeQL handoffs.
- Fingerprint: `delivery|post-merge-codeql|single-flight-terminality|v1`
- Root cause: CodeQL push concurrency fell back to `github.run_id`, so main runs could not supersede one another.
- Fix: stable PR/ref concurrency + explicit terminal-security skill + prevention rules + regression.
- Expected operational effect: at most one authoritative CodeQL run per ref; stale work self-cancels; agents keep ownership until security state is terminal.
- Production semantics: no claim of LIVE_BEWEZEN from this governance change without the normal protected-merge and exact-main readback chain.
- Concurrent-lineage recovery: the canonical branch later gained `docs/brain/delivery-failure-lessons.json` as the central PROVEN projection. PR metadata was reconciled to Scope-Budget 8 before the next head event so branch-hygiene evidence and actual changed paths remain identical; no duplicate PR or bypass was created.
- Current-main reconciliation: Required-lane merge-candidate testing exposed a newer-main website regression (`isHardAssetFailure` used without import). The branch adopted the current-main test union and added only the missing import, preserving concurrent main changes while keeping the same recovery obligation.
- Client transport continuation: interrupted response transport is classified as non-terminal. Recovery resumes the canonical branch/current exact head and does not create a replacement lineage solely because the response channel ended.

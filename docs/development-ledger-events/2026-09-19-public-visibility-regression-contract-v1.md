# Development ledger — public visibility replay reconciliation

- Date: 2026-09-19
- Obligation-ID: website-public-visibility-regression-contract-v1
- Root cause: stale regression oracle after canonical safety strengthening.
- Affected evidence: PR #2373 BRAIN run 35443491059 failed tests 366 and 368 although the security change itself passed Supabase, RLS, Quality Intelligence, CodeQL and Skill Projection.
- Fix: align `tests/brain-fast-terminal-delivery-v2.test.mjs` to current `lane-website.yml` and `site/website-release-risk.json`.
- No production safety gate is weakened.
- Status: RECOVERABLE_INCOMPLETE pending terminal delivery.

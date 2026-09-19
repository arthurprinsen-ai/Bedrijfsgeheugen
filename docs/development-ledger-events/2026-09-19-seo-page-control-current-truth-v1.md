# Development ledger — SEO page-control current truth

- Date: 2026-09-19
- Obligation-ID: github-cleanup-page-seo-v1
- Source issue: #1448
- Revalidated current findings before mutation.
- Fixed live source wording/metadata and the raw-source vs production-projected SEO oracle mismatch.
- Regression: tests/brain-seo-page-control-current-truth-v1.test.mjs
- Status: RECOVERABLE_INCOMPLETE pending exact-head gates, protected merge and production/main readback.

- BRANCH_HYGIENE_SCOPE_RECONCILED: single-authority root-cause fix added `.github/scripts/seocontrole.py` to the approved bounded scope; PR metadata now matches the exact changed-path set (9 files). No unrelated path admitted.

- STALE_SHELL_ORACLE_REPLAY_RECONCILED: `tests/seo-v18-canonical-header.test.mjs` still asserted that seocontrole.py owned canonical shell validation. The replay now asserts the single-authority split: SEO source semantics in seocontrole.py; shell parity in the dedicated canonical shell workflow.

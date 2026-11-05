# Development ledger — BRAIN historical checkout oracle

- Date: 2026-11-05. Source failure: original BRAIN #42055116770 backend test #699 rejects the necessary one full-history checkout after protected migration admission PR #5453.
- Owner: original Required / ONE BRAIN specialist. Fix: narrow the stale test oracle and preserve the branch-history, original Netlify and protected migration requirements; no waiver of hosted Preview, CodeQL, immutable source or provider readback.
- The separate six migration-lock parity failures were resolved via protected #5462 with provider 808 applied rows. This test-only fix does not modify production SQL, schedulers or commercial data.
- Verification: `tests/brain-ci-control-plane-convergence-v1.test.mjs`, exact-head Required, CodeQL, original BRAIN replay, protected merge and terminal outcome readback. Preserve failed attempts and never claim closure early.
- Fingerprint: `ci|brain-replay|migration-admission-full-history-vs-legacy-shallow-test|20261105-v1`.

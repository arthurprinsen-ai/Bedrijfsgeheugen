# Canonical development ledger — CI scope verification

- **Fingerprint:** `delivery|required-pr-scope|two-dot-diverged-base-false-contamination|20261022-v1`.
- **Observed evidence:** Required #39861215523, failed preflight job #120112317455; 126 falsely scoped delivery files vs six GitHub PR diff files in canonical #4630.
- **Root cause:** branch divergence combined with two-dot `git diff` against moving main instead of provider-verified merge base.
- **Candidate changes:** Required workflow + exact-head/base comparison guard + paired positive/negative regressions; no new scheduler, preview branch, delivery bypass or change to existing PR #4630's writer code.
- **Learn:** always distinguish changes committed to a PR from unrelated new commits on main; verify compare response identity; fail closed on provider uncertainty.
- **Evidence plan:** historical/shadow/canary `tests/brain-required-merge-base-scope-v1.test.mjs`; protected Required and CodeQL; later #4630 CI retry and independent SQL/cron parity/production verification.
- **Truth boundary:** candidate until GitHub protected merge and current-main verifier evidence. Even a successful CI repair does not prove P0 revenue recovery.

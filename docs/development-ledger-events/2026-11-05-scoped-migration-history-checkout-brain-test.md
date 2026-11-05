# Development ledger — BRAIN migration history checkout regression

- Datum: 2026-11-05. Fingerprint `brain|ci|scoped-migration-history-checkout-existing-netlify-test-conflict|20261105-v1`.
- Evidence: original post-merge exact-head BRAIN backend run `42055116770`, failing test #699 `canonical Required keeps current Netlify semantics and bounded Git history`.
- Root cause: deprecated global `doesNotMatch(fetch-depth:0)` and `match(fetch-depth:2)` conflict with merged #5453 source-side migration-admission guard.
- Repair: only original `tests/brain-ci-control-plane-convergence-v1.test.mjs` is updated to assert exactly one full-history checkout at documented migration preflight; website bounded history, targeted base, Netlify CI semantics remain tested. #5462 independently repairs 808-applied provider lock; do not reopen or duplicate.
- Owner: original GitHub Required / BRAIN CI contract; unchanged protections. Regression same original BRAIN test. Status: awaiting new exact-head checks, protected merge, readback. No bypass or false green.

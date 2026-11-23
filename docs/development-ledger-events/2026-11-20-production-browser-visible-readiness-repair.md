# Development ledger — 20 November 2026: original production visible-readiness repair

- **Original owner:** Existing Powerhouse Production Release Readback and ONE BRAIN Engineering — no second agent or scheduler.
- **Original incident:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- **Exact natural failure:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/44826573338, job 136604127596, at ~22:19 UTC.
- **Fingerprint:** `powerhouse|production-readback|playwright-visible-check-timeout-passed-as-arg-and-zero-box-wrapper|20261120-v1`.
- **First-party proof already green before failure:** protected merge #6083, Netlify exact SHA + deploy ID, immutable readback, authenticated two-tenant Portal 200, connector readiness. This does not negate a real red browser step.
- **Reason:** Playwright `waitForFunction` timeout object passed as second argument (not third options), observed unintended 30 s timeout; direct-body-child layout check rejects semantically visible descendants inside zero-box wrappers.
- **Fix:** same original browser source, 10 s third-argument option, restricted visible descendants when direct wrappers are zero-sized, original retries and strict route/asset/HTTP/canonical checks retained; route/viewport/failure class observability.
- **Regression:** `tests/brain-production-route-visible-nested-readiness-20261120.test.mjs` negative and positive, mandatory compiler historical replay and canary; existing original delivery optimization skill updated.
- **No terminal proof:** code candidate subject to Required, CodeQL, protected merge, fresh production route verifier. No fabricated business outcome, no approval bypass, no false-green; the 14 original innovations remain 14 OPEN.
- **Rollback:** protected revert of candidate; preserve original Brain operations, incident records and first-party provider logs.

# 2026-09-24 — Production route body readiness retry

- Fingerprint: `production-route-body-readiness-retry-v1`
- Failed run: `36053461250`
- Failed job: `107814533476`
- Exact production SHA already proven: `6d428a820443269543378ef42e42e9584503f80b`
- Route: `/prijzen`
- Failure: Playwright body visibility timeout before pricing-specific proof.
- Fix: retry complete route observation on a fresh page, max 3, only on `TimeoutError`.
- Non-timeout errors remain fail-closed.
- Regression: `tests/brain-production-route-body-readiness-retry-v1.test.mjs`.

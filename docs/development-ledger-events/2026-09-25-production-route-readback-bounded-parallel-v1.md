# 2026-09-25 — Production route readback bounded parallelism

- Fingerprint: `production-route-readback-bounded-parallel-v1`
- Trigger: manual exact-main readback run `36134150890` bleef langdurig in affected-route verification.
- Root cause: seriële route × viewport uitvoering met geneste retryvensters.
- Fix: bounded concurrency + kortere bounded retries + workflow timeout.
- Preserved proof: 1440px + 390px browser verification.
- Regression: `tests/brain-production-route-readback-bounded-parallel-v1.test.mjs`.
- Terminal rule: exact deploy identity + route proof + pricing/i18n browser proof blijven vereist.

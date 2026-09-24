# 2026-09-24 — Netlify linked Skipped fallback

- Fingerprint: `netlify-linked-skipped-fallback-v1`
- Obligation: `powerhouse-50-problem-radar-chat-closure-20260924-v1`
- Stage: production recovery
- Observed deploy: `6ab57a396b0e16306cb97fee`
- Provider state: `error`
- Provider error_message: `Skipped`
- Root cause: workflow classified provider skip as fatal build failure before canonical exact-source fallback.
- Fix: branch on `error_message=Skipped` and continue to existing authorized exact-source transport.
- Real provider failures remain fail-closed.
- Regression: `tests/brain-netlify-linked-skipped-fallback-v1.test.mjs`.

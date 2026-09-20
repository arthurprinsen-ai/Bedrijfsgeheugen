# 2026-09-20 — RECOVERY — Buffer 429 circuit breaker v2

- Fingerprint: `buffer-rate-limit-central-authority-v2`
- Failure class: `RATE_LIMIT_RETRY_COULD_DUPLICATE_EXTERNAL_PUBLICATION`
- Root cause: provider 429 state was not persisted across runs; provider create identity could be lost before readback.
- Fix: bounded persistent cooldown + early provider-id persistence + reconciliation-before-recreate.
- Authority: central social publication capability remains mandatory; Instagram/Composio stays independent.
- Regression: `tests/brain-buffer-rate-limit-central-authority-v2.test.mjs`.
- Terminal status: pending exact-head CI, protected merge, function deploy and provider/runtime readback.

## Lineage reconciliation

2026-09-20: predecessor PR #2423 is closed as superseded and duplicate successor #2433 is closed. PR #2432 is the single canonical recovery lineage for `buffer-rate-limit-circuit-breaker-v2`.

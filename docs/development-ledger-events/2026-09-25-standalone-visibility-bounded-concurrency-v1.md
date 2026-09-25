# 2026-09-25 — Standalone visibility sweep bounded concurrency

- Fingerprint: `standalone-visibility-bounded-concurrency-v1`
- Observed: 92 public routes × 3 viewports = 276 sequential browser checks per Required run.
- Impact: seven PRs simultaneously remained in the same visibility step, amplifying runner occupancy and queue pressure.
- Fix: preserve all routes and all three viewports, but distribute routes over four bounded workers per viewport while retaining the global fail-closed budget.
- Regression: `tests/brain-standalone-visibility-bounded-concurrency-v1.test.mjs`.

# 2026-10-06 — Supabase history terminalizer readback routing

- Source incident: merged PR #3766 / candidate `04b82996ad16c68e45173b48d4b9ba2de270a03d` / merge `ccdf134ca4de73e547e54c9de00298d771f87be5`.
- Observed terminalizer failure: `UNWIRED_NON_NETLIFY_RUNTIME_READBACK`.
- Root cause: canonical migration-history obligation family was absent from the recovery classifier; immutable history/lock/baseline paths were absent from its bounded path allowlist.
- Fix: broaden only the Supabase migration-history recovery authority; keep unknown runtime fail-closed.
- Regression: `tests/brain-production-readback-authority-routing-v1.test.mjs` now pins canonical routing and bounded evidence paths.

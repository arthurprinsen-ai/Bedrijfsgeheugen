# 2026-10-07 — Forecast calibrator DirectQuery error-path recovery

- Obligation: `forecast-calibrator-directquery-catch-20261007-v1`
- Production failure: HTTP 500 from `powerhouse-forecast-calibrator` at 2026-10-07T09:22:57Z.
- Runtime error: `TypeError: db.from(...).insert(...).catch is not a function`.
- Root cause: custom `DirectQuery` implements `then()` only; the calibrator error logger incorrectly chained `.catch()`.
- Structural correction: keep the health insert awaited and remove the invalid `.catch()`.
- Runtime scope: one Edge Function source line.
- Regression authority: `tests/brain-forecast-calibrator-directquery-error-path-v1.test.mjs`.
- No database DDL, scheduler change, auth change, provider bypass or business-data mutation.
- Terminal proof: exact-HEAD Required + CodeQL → protected squash merge → Supabase provider source parity → production calibrator invocation → fresh 401/500/503/522 readback.

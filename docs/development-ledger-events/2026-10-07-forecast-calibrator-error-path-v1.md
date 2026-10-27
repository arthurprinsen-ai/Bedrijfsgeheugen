# 2026-10-07 — forecast calibrator error-path recovery

- Base main: `9740ac6c06628f98ba0285d21f8d808d4250d6c9`.
- Production observation: `powerhouse-forecast-calibrator` HTTP 500 at `2026-10-07T09:22:57.136Z`.
- Runtime exception: `TypeError: db.from(...).insert(...).catch is not a function`.
- Provider version at observation: 49.
- Root cause: error-handler health write used Promise syntax unsupported by the Supabase query builder.
- Fix: explicit best-effort `try { await insert } catch {}`; original failure response remains fail-closed.
- Regression authority: `tests/brain-forecast-calibrator-error-path-v1.test.mjs`.
- Next proof: exact-HEAD gates → protected squash merge → provider version/source readback → fresh runtime error window.

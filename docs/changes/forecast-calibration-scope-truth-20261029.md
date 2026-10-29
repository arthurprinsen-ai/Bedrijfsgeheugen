# Forecast calibration: empty public queue is not an empty global backlog

**Date:** 2026-10-29
**Status:** SOURCE_CANDIDATE_NOT_LIVE
**Obligation-ID:** forecast-calibration-scope-health-truth-20261029

The existing hourly forecast calibrator reports `NO_DUE_CALIBRATIONS`, while the canonical revenue learning obligations register contains 1,753 overdue `FORECAST_CALIBRATION` obligations (1,483 person, 270 company). Verified existing public-scope RPC returns zero, intentionally excluding these private scopes. The scheduler job #30 has 24 succeeded invocations in 24h, but that only proves invocation, not debt closure.

Correct the misleading global zero without widening the public OpenAI authorization boundary: when `powerhouse_public_market_calibration_due_v1` returns an empty public queue, read only an aggregate count of all canonical OPEN/due FORECAST_CALIBRATION obligations using a head-only count query. Save `public_scope_due:0`, `out_of_public_scope_due` and state `NON_PUBLIC_SCOPE_BACKLOG` in the existing `bg_gezondheid` row. Return the same counts and state to the scheduler. The public lane still reports successful operation; overall learning/economics health remains incomplete until independently evidenced private-lane resolution. If count read fails, fail closed. No private payload sent to OpenAI.

No new scheduler, SQL migration, schema, public data, AI prompt, model permission, publication flow, tenant authority, secret or bypass. The existing Powerhouse foresight skill and Brain learning record inherit this prevention rule.

Release acceptance: exact-head Required/CodeQL/BRAIN, protected merge, provider bundle and file parity, real authenticated production canary showing a nonzero out-of-public-scope count while public due remains zero. Never claim 1,753 obligations closed without independent evidence.

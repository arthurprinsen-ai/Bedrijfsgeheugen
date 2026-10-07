# Forecast calibrator DirectQuery error-path recovery

Date: 7 October 2026  
Obligation: `forecast-calibrator-directquery-catch-20261007-v1`

Production returned HTTP 500 from `powerhouse-forecast-calibrator` at 09:22:57 UTC. The Edge Function log identified the exact fault: the error-reporting branch chained `.catch()` onto the local `DirectQuery` adapter. That adapter is promise-like only through `then()`; its `execute()` method already converts database failures into a bounded result object.

The correction removes only the invalid `.catch()` from the health-log insert and keeps the insert awaited. No scheduler, database schema, authentication rule or forecasting logic changes.

A regression test now locks both invariants:

- the calibrator error path does not call `.catch()` on `DirectQuery`;
- `DirectQuery` remains explicitly thenable rather than pretending to implement the full Promise API.

Terminal proof requires exact-HEAD CI, protected merge, provider source readback, one production calibrator invocation and a fresh application 401/500/503/522 window.

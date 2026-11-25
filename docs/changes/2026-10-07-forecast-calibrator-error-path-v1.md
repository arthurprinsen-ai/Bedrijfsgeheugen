# Forecast calibrator error-path recovery

At 2026-10-07 09:22:57 UTC, production `powerhouse-forecast-calibrator` version 49 returned HTTP 500 because its error-reporting path called `.catch()` directly on a Supabase query builder.

The query builder is awaitable but does not implement Promise `.catch()`. As a result, observability code threw a second exception while handling the original calibration failure.

Structural correction:

- the failed health insert is awaited inside an explicit `try/catch`;
- observability remains best-effort and cannot replace the original failure with a second runtime exception;
- the caller-facing calibration failure contract remains fail-closed;
- a regression test forbids query-builder `.catch()` on this path.

Production proof after merge requires provider-source readback plus a fresh scheduled calibrator invocation with no recurrence of the TypeError.

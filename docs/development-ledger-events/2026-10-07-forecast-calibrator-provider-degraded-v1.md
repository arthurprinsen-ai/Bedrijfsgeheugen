# 2026-10-07 — forecast calibrator provider-degraded recovery

- Base main: `0219cf283e9fabe6e17583210133d0e6a5b846cb`.
- Production runtime reached the corrected forecast calibrator without recurrence of the previous query-builder exception.
- The remaining failure was an external AI-provider availability condition, not an Edge runtime defect.
- Structural correction: known provider-unavailable conditions return an explicit retryable degraded state.
- Forecast obligations remain open and no forecast outcome is fabricated while degraded.
- Unknown runtime, database and governance failures remain fail closed.
- Regression authority: `tests/brain-forecast-calibrator-provider-degraded-v1.test.mjs`.
- Next proof: protected merge, provider readback, fresh invocation and runtime error-window readback.

# Forecast calibrator provider-degraded resilience

A production-identical invocation after the runtime error-path fix proved that the Edge Function itself was healthy, but the AI provider rejected the calibration request because the account credit balance was exhausted. That external dependency condition was still surfaced as HTTP 500.

The runtime now separates infrastructure health from provider availability:

- known provider-unavailable responses return HTTP 200 with `ok=false`, `state=DEGRADED_AI_PROVIDER` and `retryable=true`;
- forecast obligations remain open and no materialized or missed outcome is written while degraded;
- the health record retains the failure detail and explicit degraded state;
- governance, database, unknown provider payload and code failures remain fail-closed HTTP 500.

This removes false runtime-500 amplification without pretending that forecast calibration completed.

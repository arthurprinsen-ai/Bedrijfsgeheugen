# CI/CD source-proof consistency: task clock and error classification

Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4661
Existing merged implementation: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4756

## Root cause

The existing executed-job estimator `summarizeObservedCiJobs` rejects missing job creation time, starts before creation, negative/unbounded wait, and execution durations above 48 hours. The new source-only OpenTelemetry-compatible projection originally checked only start and end. In a large valid sample it could label an extra malformed task as a source proof, even when the canonical estimator correctly rejected it.

The projection also omitted conditional `error.type` for failed/timeout task results (OpenTelemetry CI/CD semantic conventions are release candidate; these are source-compatible attributes, not actual spans).

## Recovery

Exactly match existing timestamp gates (including wait and duration 0–48h) and use only two bounded error types: `ci_task_failed` and `timeout`. No raw error message or user/customer data is exported. Full sample is suppressed below 20 valid jobs / 5 independent run attempts. Existing hourly Janitor, producer, incident registry, owner routing and p50/p95 logic remain unchanged. No network or new scheduler.

## Verification

`node --test tests/brain-ci-cicd-semconv-evidence-v1.test.mjs tests/brain-observed-ci-throughput-v1.test.mjs tests/brain-ci-agent-prioritization-v1.test.mjs`. Verify exact-head Required and CodeQL; protected merge and an actual bounded Janitor artifact readback are required before calling the runtime change proven. No claimed cost saving or acceleration until comparative measurements.

https://opentelemetry.io/docs/specs/semconv/cicd/cicd-spans/

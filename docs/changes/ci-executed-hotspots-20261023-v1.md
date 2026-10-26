# CI execution hotspots: filter phantom jobs and preserve diagnostic attribution

Canonical owner: [#4661](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4661). Provider ghost status belongs to [#4655](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4655).

## Observed defect
GitHub returns `completed/skipped` job placeholders; some carry `started_at == completed_at` and can appear as zero-runtime provider records. Previous `summarizeObservedCiJobs` admitted every nonempty conclusion and therefore could dilute 20-job/5-run percentiles. The real 2026-10-23 Janitor measured wait-to-start p50=3s/p95=4s, but these are **sample values, not performance SLOs or causal bottlenecks**.

## Fix
Admit **executed** jobs only: `success`, `failure`, `timed_out`, plus valid per-job created/started/completed timestamps and run/attempt/SHA/job IDs. Reject skipped, neutral, cancelled and incomplete/duplicate rows. Keep the existing >=20 valid jobs and >=5 attempts minimum. Emit at most five slowest actual jobs with bounded job/workflow names and provenance; status `SAMPLED_DIAGNOSTIC_NOT_CRITICAL_PATH`. Provider read error => `PARTIAL_PROVIDER_OBSERVATION`, no trusted percentiles or ranked jobs. The Janitor remains the same existing scheduled read-only observer; no extra CI runners, dispatches or provider permissions.

## Verify and release
`node --test tests/brain-observed-ci-throughput-v1.test.mjs` plus canonical Brain learning replay/shadow/canary, admission, Required and CodeQL, protected merge, skill projection and observed job telemetry in a subsequent existing Janitor run. An observed slowest job is an investigation candidate, **not** proof of critical path or a measured speed improvement. Retain branch protection, RLS/tenant/financial and release checks; do not close #4661 or #4655 on telemetry alone.

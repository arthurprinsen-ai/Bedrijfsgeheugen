# Prevent matrix-job vote bias in autonomous CI agent priorities — 2026-10-23

Canonical owner: [#4661](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4661). This only changes the existing `ci-agent-priorities.mjs` consumer of the original hourly Repository Janitor artifact. No new timer, provider read, agent, queue, authority or release gate.

## Measurable source defect
The existing advisory required three distinct GitHub workflow attempts but calculated median/p95 over every job instance, including parallel matrix replicas. For example, one run with 12 slow replicas plus four genuinely fast attempts can falsely exceed the 60s repeated-job threshold; one run with 14 fast replicas can conceal slow execution on other independent attempts. This is a **demonstrated deterministic code defect** with synthetic replay, not a claim that it already caused production regression.

## Correction
For a stable workflow/job signature, collect every executed job as identity-validated evidence, then select exactly **one conservative slowest actual job per `run_id:run_attempt`** as the statistical observation for that attempt. Median, p95, median runner wait and the top-three exemplars are computed from independent attempts only. Preserve raw `sample_jobs` and report `independent_attempt_samples` and `matrix_replica_samples_excluded` for transparency. Existing >=20 executed jobs / >=5 attempts global evidence requirement, >=3 repeated attempts / >=60,000ms threshold, fail-closed partial reads, deterministic ordering and read-only no-dispatch/no-mutation/no-promotion flags remain.

Regression: `tests/brain-ci-agent-priorities-v1.test.mjs` with an artificially dominant slow-matrix run and a fast-matrix run. Neither can bias other attempts. No changes to protected Required, CodeQL, RLS, tenants, financial/visual parity or Supabase preview.

After exact-head CI/CodeQL, native protected merge, main/skill readback and a real hourly Janitor execution, it is correct to call the advisory code live. Neither this fix nor one Janitor reading proves lower CI p95, customer acceptance or global completion.

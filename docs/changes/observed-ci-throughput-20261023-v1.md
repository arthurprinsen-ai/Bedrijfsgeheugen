# Powerhouse: observed CI throughput through the existing Janitor (2026-10-23)

Canonical issue: [#4661](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4661). No new scheduler, queue, agent pool or parallel incident truth.

## Why
A single sampled build profile (71,354ms) and a raw queued count cannot prove speedup, runner starvation or valid p95 latency. The hourly Powerhouse Repository Janitor already has authorized GitHub evidence access. Reuse it for **read-only** job timing telemetry without additional workload.

## Exact scope
- `tools/delivery/predictive-controller.mjs#summarizeObservedCiJobs`: deterministic per-job queue-wait (`started_at - created_at`) and execution (`completed_at - started_at`) metrics, exact run ID, attempt, job ID and SHA. Duplicate, incomplete, invalid, and impossible timestamp records never count as zero time.
- `tools/delivery/ci-throughput-telemetry.mjs`: one completed-runs read and at most 12 job-collection reads; no mutations, cancellation, extra GitHub Actions dispatch, or new scheduler.
- Existing `.github/workflows/powerhouse-repository-janitor.yml` emits `.artifacts/powerhouse-ci-throughput.json` in its existing artifact. Provider API failure becomes explicit `PARTIAL_PROVIDER_OBSERVATION` or `PROVIDER_OBSERVATION_UNAVAILABLE` without suppressing independent janitor recovery.
- Percentiles are withheld unless 20 jobs and 5 distinct workflow attempts are independently observed. `SAMPLED_METRICS_NOT_SLO` is not a promise of p95, increased throughput, production parity or an observed improvement.
- Cold/warm caches and artifact reuse require a later separate evidence-backed benchmark, with GitHub cache trust boundaries maintained. No cache poison-risk tradeoff.

## Acceptance and safety
Tests: `tests/brain-observed-ci-throughput-v1.test.mjs`. Mandatory hygiene, Required, CodeQL, any provider/security/CLS/tenant/financial checks, exact SHA protected merge, current-main readback, real existing hourly Janitor artifact and canonical Brain skill projection. Preserve [provider incident #4655](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4655) independently red until reconciled. This change measures one early signal; it does **not** claim DORA change lead time or deployment frequency.

## Adaptive follow-up after real Janitor proof (2026-10-23)

Actual [hourly Janitor run #39921463823](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39921463823) succeeded and wrote the expected artifact with 12 workflow runs, 17 valid jobs, 10 distinct runs, 0 read errors, and truthful `INSUFFICIENT_EVIDENCE` (p50/p95 withheld). Existing threshold is 20 jobs / 5 runs.

Within the SAME hourly Janitor, increase the maximum possible job-list GETs to 24 **only as needed**. Stop the moment 20 valid jobs / 5 real runs have been observed, or immediately on a missing/failed provider read. A successful early sample uses fewer reads than a full 24-run sweep. The evidence includes `workflow_runs_sampled`, `requested_run_read_limit`, `sampling_stop_reason` and original run/job/SHA proof.

No new workflow execution is generated; no extra cron, new queue, false speedup claim, security gate change, or paid scaling. These sample percentiles remain diagnostic, non-SLO and not representative of all jobs without further calibrated longitudinal evidence. Acceptance requires exact-head protected CI/CodeQL, merge and a NEW real existing Janitor run artifact.

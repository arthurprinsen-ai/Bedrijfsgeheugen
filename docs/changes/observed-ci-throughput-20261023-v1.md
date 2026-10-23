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

## Real-provider evidence and adaptive correction — 23 October 2026

The existing Janitor dry-run [#39921463823](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39921463823) completed successfully on the first merged version, with the new observation step and artifact upload both successful. Actual provider result: **12 runs sampled, 17 valid jobs, 10 distinct runs, 0 read failures**. It correctly emitted `INSUFFICIENT_EVIDENCE`, with p50 and p95 null, because the job threshold was 20.

Rather than lower the quality threshold or add a scheduler, the follow-up collector increases the *upper bound* to 24 completed runs, yet stops immediately when 20 valid jobs and 5 independent workflow attempts have been observed without an earlier provider read error. An incomplete provider read still forces `PARTIAL_PROVIDER_OBSERVATION` and null percentiles; no false success. No added recurring job or new writer. Source evidence requires a second existing Janitor run after protected merge.

## Stop on first provider read failure — candidate 23 October 2026

The existing hourly Janitor's telemetry collector formerly continued reading up to 24 job lists after an earlier GitHub API denial or incomplete jobs page, even though that incomplete cycle cannot produce trustworthy percentiles. This follow-up stops at the first such error, keeps `PARTIAL_PROVIDER_OBSERVATION`, clears all p50/p95 values, and emits the actual attempted read count. A deterministic regression now expects **3 requests instead of 25** when the second jobs read fails, and **2** when the first jobs read fails. These are replay assertions, not measured production throughput gains.

No extra schedule, runner, dispatcher, cache, branch-provider integration, CI bypass, fabricated SLA or change to the 20-job/5-run confidence floor. This remains a candidate until exact-head Required/CodeQL, protected merge, real hourly Janitor artifact and Brain skill-projection readback are proven. Original issue [#4661](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4661) retains ownership.

# Recurrent CI execution hotspots, instead of isolated max durations

Parent: [#4661](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4661). Reuses the same protected `tools/delivery/predictive-controller.mjs`, read-only hourly Repository Janitor and Brain learning/skills; **no new scheduler, runner, executor, queue or writer**.

## Grounded reason
[Observed Janitor #39926363163](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39926363163) on main `8a08a22107b29adc4a4fdcd92eb228e5a04790e6` reported 28 actually executed jobs from 13 independent runs, 0 API failures and 3s sampled queue-wait p95. One job lasted 353s. Independently sampled CodeQL JS/TS executions of 105, 125, 140, 149 and 199 seconds and Required-preflight jobs of approximately 75–87 seconds are more consistent execution bottleneck candidates; sample sizes, run SHA and causal phases must still be verified before optimizations.

## What changes
The existing `summarizeObservedCiJobs` now emits `recurrent_hotspots` alongside existing exact-job evidence, using numeric GitHub workflow ID plus exact job name. At least three *different* completed run+attempt identities are required per job family. Matrix duplicates within one attempt reduce to the longest executed job (conservative observation). Output includes observed sample p50, sample max, count, bounded source-run IDs and advisory investigation lane, sorted by sample p50; up to five families. The global 20 valid jobs / 5 runs minimum remains intact. A missing or partial job page suppresses the entire recurrent diagnostic; `skipped`, `neutral` and `cancelled` continue to be excluded.

Every `REPEATED_JOB_SAMPLE_NOT_SLO` value is diagnostic only. It cannot automatically change agents, production, caches, release controls or paid capacity. Do not conflate workflow-timestamp p50 with DORA/change-lead-time/critical-path proof.

## Next owner-safe experiment
Separate compiler phase duration from cache-hit wait through existing trusted build runner and identify a deterministic full-output hash. Test an existing immutable artifact reuse path only if source/tree hashes match; never trust unsigned cache contents or weaken static translation completeness. Official guidance: https://docs.github.com/en/actions/concepts/workflows-and-actions/dependency-caching and https://docs.github.com/en/actions/concepts/workflows-and-actions/workflow-artifacts . Protected source checks and comparative actual build samples first.

## Release safety
Regression: `node --test tests/brain-observed-ci-throughput-v1.test.mjs`. Follow canonical evaluation, Required, CodeQL, exact-head protected merge, skill projection, current-main source and existing Janitor artifact before LIVE claim. Keep #4655 provider queue and unrelated production issues open.

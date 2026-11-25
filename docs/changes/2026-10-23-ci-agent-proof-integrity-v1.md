# Immutable CI advisory proof: exact workflow SHA and evidence thresholds — 2026-10-23

Canonical issue: [#4661](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4661). Existing successful [#4809](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4809) gives each workflow attempt exactly one matrix vote. The overlapping older candidate [#4808](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4808) was retired unmerged. This follow-up delivers ONLY the remaining distinct evidence-integrity checks without a second matrix algorithm.

## Reproduced defect
A telemetry payload can claim two different commit SHAs for two completed jobs of the *same run ID and attempt*. The existing matrix accumulator had no global cross-job SHA invariant, so it could consider these observations as a single independent workflow attempt. The advisory options could also be supplied with `minRepeatedRuns=1`, `minMedianMs=0`, or `maxPriorities>5`, inadvertently changing the normally advertised minimum quality gates. This is a deterministic contract vulnerability, not proof of actual provider fraud or observed speedup.

## Minimal fix
Check one canonical SHA per exact run ID/attempt across all job names. Reject contradictory evidence with `RUN_ATTEMPT_SHA_INCONSISTENT` and no priorities. Clamp externally supplied limits to ≥3 independent attempts, ≥60,000 ms median and at most 5 investigations, recording effective thresholds rather than unsafe inputs. Tightening remains allowed; weakening does not. Preserve existing full input validation, at least 20 executed jobs over 5 distinct runs, matrix-independent weighting, immutable timestamps, and the existing hourly Janitor.

## Release proof
Replay/shadow/canary regression in `tests/brain-ci-agent-priorities-v1.test.mjs`; mandatory admission, Required CI and CodeQL on exact head; protected auto-merge only after checks, post-merge main/skill projection and existing Janitor artifact. Recommendation is `INVESTIGATE_AND_BENCHMARK_WITH_EXISTING_OWNER`, never autonomous mutation or reduced security/tenant/finance/CLS/provider checks.

GitHub's documented matrix behavior can create several jobs within one workflow: https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/run-job-variations . DORA's five production delivery metrics are distinct from runner waits or an advisory: https://dora.dev/guides/dora-metrics/ .

# Append-only CI learning evidence — repeated Required PR head versions

Observed: 2026-10-23. Owner: existing [#4661](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4661).
Fingerprint: `delivery|predictive-lane-capacity|measured-ci-workflow-job-latency|20261023-v1` (existing canonical learning record; **not** a new incident ledger).
Baseline: GitHub Actions current-day completed Required-run listing includes multiple head versions for PR #4765 and PR #4761, with exact run/commit identifiers. This is repeated evaluation and *does not demonstrate wasted cost, congestion causality or a DORA improvement*.

Implementation candidate: `tools/delivery/ci-required-head-churn.mjs`, consumed only by the existing `tools/delivery/ci-throughput-telemetry.mjs`. One existing general 40-run GET plus one new workflow-scoped 40-run GET for `required-test.yml`; unchanged bounded maximum 24 job-list reads. In a live general-provider sample only 4 of 40 workflows were Required, so a single generic page failed to expose repeated candidates. Output stays in original `.artifacts/powerhouse-ci-throughput.json` with label `SAMPLED_REPEATED_CANDIDATE_HEADS_NOT_CAUSAL`, sample lower bounds, provider pagination flag and a non-operational merge queue review recommendation.

Correctness contract: strict provider identity and distinct HEAD grouping; duplicates/malformed rows suppress recommendations; null provider total is UNKNOWN not complete. No claimed or simulated performance uplift, no blind retry, no skipped Required/CodeQL/Netlify, no added scheduler, queue writer or second Brain registry. Original percentiles keep their existing 20-job/five-run and fail-closed thresholds.

Tests: `tests/brain-ci-required-head-churn-v1.test.mjs`. Protected exact-head CI/CodeQL, merge and a fresh provider-observed Janitor artifact remain pending until observed. Next decision uses GitHub's native merge queue only through the current administrator's authorized branch ruleset, after source-specific benchmark and `merge_group` validation.

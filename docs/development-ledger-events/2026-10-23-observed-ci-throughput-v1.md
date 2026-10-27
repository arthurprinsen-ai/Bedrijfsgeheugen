# Append-only delivery event — measured CI job telemetry (2026-10-23)

- Obligation: delivery|predictive-lane-capacity|measured-ci-workflow-job-latency|20261023-v1
- Canonical owner: [#4661](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4661); same existing hourly Repository Janitor
- State: CANDIDATE (not merged / no actual hourly-run evidence yet)
- Root cause: no repeated exact-SHA job timing baseline; single build sample is not p95
- Change: bounded read-only GitHub API completed-runs + job timestamps → existing Janitor artifact
- Contract: min 20 jobs, min 5 distinct workflow attempts; timestamps, job/run identity and fail-closed partial API reads; no automatic speedup or queue mutation
- Provenance: source GitHub workflow job metadata; no synthetic telemetry, no cache poisoning, no new schedule, no spending
- Regression: tests/brain-observed-ci-throughput-v1.test.mjs in canonical historical, shadow and canary modes
- Terminal: exact-head protected CI/CodeQL, merge, current-main and real hourly Janitor artifact readback, Brain learning + skill projection

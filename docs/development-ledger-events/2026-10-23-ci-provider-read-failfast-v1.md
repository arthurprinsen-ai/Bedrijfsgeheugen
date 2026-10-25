# Append-only engineering event — CI provider fail-fast (2026-10-23)

- Existing parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4661
- Sub-obligation: delivery|predictive-lane-capacity|first-provider-read-failfast|20261023-v1
- Canonical runtime: hourly Powerhouse Repository Janitor, existing `tools/delivery/ci-throughput-telemetry.mjs` and Brain learning record
- Root cause: job-list collection kept requesting providers after a partial read had already made the aggregate metric ineligible for p50/p95 publication
- Proposed correction: stop the same cycle on the first denied or incomplete provider read; preserve partial evidence, attempted reads and null p50/p95
- Deterministic replay: 25 to 3 GitHub API calls on second-jobs-read failure, or 2 on first-read failure. No production time or cost saving claimed yet
- Proof: `tests/brain-observed-ci-throughput-v1.test.mjs`, including impossible/incomplete pagination regression
- No second scheduler, job, writer, queue, registry, automatic spending or weakened Required / CodeQL / Supabase / finance / tenant release gates
- Status: CANDIDATE; exact-head CI, protected merge, next real Janitor artifact and skill projection remain required

# Daily provider evidence fail-closed — 24 October 2026

- Canonical owner: existing 04:20 UTC content-growth-learning workflow.
- Observed source defect: `source_state` is truthy for all non-empty statuses, including `AUTH_REQUIRED` and `SOURCE_ERROR`, so empty data could pass green CI.
- Fix: require exact positive `READ_ONLY_PROVIDER_OBSERVED` and nonempty bounded social/source-quality observations. Auth/provider outages cause red workflow, without hiding evidence; upload artifacts even on failed validation.
- Existing provider access rights, tenant-isolation and attribution gates remain; no new scheduler, database or automated customer profiling.
- Tests: `tests/brain-daily-provider-proof-gate-v1.test.mjs`. Terminal = protected checks + actual next scheduled provider evidence.

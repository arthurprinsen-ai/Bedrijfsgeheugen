# Provider fallback bounded retry — 2026-10-25

- Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Existing Brain incident: external-intelligence|tavily-limit-dataforseo-fallback-remote-failure|20261025-v1
- Actual execution: Supabase request 12486, HTTP 207, two source topics succeeded, one failed, Tavily UPSTREAM_PLAN_LIMIT and DataForSEO remote failure
- Recovery: same existing provider fallback, one transient retry maximum per topic, explicit permanent error no-retry and honest zero organic result
- Tests: tests/brain-external-signal-quota-failover-20261019.test.mjs (existing Required gate)
- Status: CANDIDATE pending exact-head CI, merge, production Edge deployment and real run readback
- No second scheduler, duplicate incident, false-positive customers, orders or paid revenue

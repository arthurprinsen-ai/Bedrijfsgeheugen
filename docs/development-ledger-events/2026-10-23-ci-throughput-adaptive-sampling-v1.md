# Append-only event — adaptive CI telemetry sampling (2026-10-23)

- Parent obligation: [#4661](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4661)
- Follow-up obligation: delivery|predictive-lane-capacity|adaptive-observed-ci-sampling|20261023-v1
- Baseline authority: existing Janitor run [39921463823](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39921463823)
- Actual observed baseline: 12 sampled runs, 17 complete jobs, 10 independent runs, zero GitHub read errors, p50/p95 withheld as insufficient evidence
- Root cause: fixed cap 12 sampled completed workflow runs cannot guarantee the evidence minimum of 20 valid jobs
- Change: adaptively collect up to 24 runs; stop at first clean 20 valid jobs spanning at least 5 run attempts; never lower evidence threshold
- Failure behavior: any provider read error stays PARTIAL and suppresses all percentiles; duplicate/impossible observations still rejected
- Architecture: same hourly Janitor, one existing controller and output artifact; no new scheduler, incident store or dispatch
- Regression: tests/brain-observed-ci-throughput-v1.test.mjs with early-stop and partial-provider upper-bound proof
- Status: CANDIDATE; exact-head security/CI, protected merge, main and real Janitor artifact readback required

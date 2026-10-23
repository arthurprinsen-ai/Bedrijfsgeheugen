# CI adaptive evidence planning (candidate, not live proof)

This protected candidate extends the **existing** five-minute Recovery Supervisor and daily
CI Intelligence; no new scheduler, registry, agent, writer or merge queue.

- Rank same-repository main PRs only when one obligation and exact active terminal writer
  lease are present and the bounded drift retry budget is not exhausted. Defer active exact-head CI.
  Sorting is **not** a green gate: the existing per-PR live compare, ancestry, changed-file
  overlap, single-owner lease, expected-head CAS, Required, CodeQL and provider readback
  remain the only authorities.
- Group potential repeated Actions runs only by native workflow ID, immutable PR-event HEAD,
  unique run ID. Incomplete provider evidence stays unknown. Active exact-head single-flight
  already exists in Supervisor; no successful or compulsory gate may be skipped.
- Quantify the largest **observed** runner delay using >=10 jobs with both queue and execution
  durations. Paired coverage and observational attribution prevent false bottleneck claims.
- New AI technique evidence: independent matched 30+ sample baseline vs candidate,
  regression/security evidence, shadow, bounded canary, rollback rehearsal and provider readback.
  Passing this diagnostic is only eligibility for the **existing** seven-stage quality and
  protected production gates. No automated release authority is introduced.

Measure before/after: p95 Required/queue latency, repeated-run count, fail rate, exact-head
coverage and production outcome. No speed improvement or live status is claimed yet.

Regression: `node --test tests/delivery-ci-adaptive-pr-planner.test.mjs tests/delivery-powerhouse-supervisor.test.mjs`.

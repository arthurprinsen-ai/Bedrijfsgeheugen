# Append-only evidence event — adaptive CI sample completeness, 2026-10-23

- Canonical owner: [issue #4661](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4661); no second scheduler, agent, incident or parallel truth
- Sub-obligation: delivery|predictive-lane-capacity|adaptive-sample-completeness|20261023-v1
- Existing live input: [hourly Janitor run 39921463823](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39921463823), status=success, main=1cb417fbb25147e3ed0285f6bb9515f1c947cec0
- Actual artifact: 12 runs, 17 finished valid job observations, 10 distinct runs, zero read errors, p50/p95=null, status=INSUFFICIENT_EVIDENCE; minimum twenty jobs/five runs
- Specific root cause: too narrow fixed sample cap, not proof of slow GitHub queues
- Correction: bounded adaptive read-only completed-job collection from the SAME existing Repository Janitor, cap 24 GETs, stop at sufficient evidence or first provider-read error
- Invariants: no new CI jobs/runs/runner capacity; no gate/branch protection bypass; no fabricated SLO, queue removal or provider-ghost reconciliation
- Canonical learning: brain/learning/2026-10-23-observed-ci-throughput-v1.json (adaptive_followup on same fingerprint)
- Regression: tests/brain-observed-ci-throughput-v1.test.mjs including 17/20 real shape, early stopping, provider-failure fail-closed and hard cap
- State: CANDIDATE until exact-head Required/hygiene/CodeQL and protected merge, current-main verification, observed next Janitor artifact and existing Brain skill projection.

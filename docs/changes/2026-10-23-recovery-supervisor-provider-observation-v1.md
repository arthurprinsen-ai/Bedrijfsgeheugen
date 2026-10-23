# Instrument native CAS recovery without changing authority
Date: 2026-10-23
Parent incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4120

## Actual baseline
The protected-merged Recovery Supervisor (#4781) successfully executed [run #39960974891](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39960974891) for approximately 246 seconds. Provider logs show 58 rejected main-drift repairs without terminal writer lease, 24 refused failed-gate retries without terminal lease, zero observed native CAS branch mutations, and one Required dispatch with a subsequent failing preflight. The separate serialized terminal closure for #4762 succeeded. This shows safety, not a proved throughput gain.

## Intervention
Measure repeated drift, refused non-owner writes, attempt-budget exhaustion, native CAS attempts, non-classified CAS failure, pending/asynchronous/proven reconciliations, failed-gate refusals and wall seconds. Emit one structured log + GitHub job summary in the original five-minute Supervisor. Do not create an agent, new database, new workflow, scheduler, branch writer, CI retry or release bypass. Counts are not causal improvement claims.

## Acceptance
Run `node --test tests/brain-recovery-supervisor-provider-observation-v1.test.mjs`, existing supervisor tests, exact-head Required and CodeQL. Protected merge required. Read back an actual next scheduled run JSON before claiming metrics live. Compare multiple future provider-observed runs before claiming shorter CI or drift reduction.

## Fail-closed behavior
Preserve source `expected_head_sha`, terminal lease eligibility, one recovered PR per run, two drift attempts, async ancestry verification, strict main, security and test coverage.

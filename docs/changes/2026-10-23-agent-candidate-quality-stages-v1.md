# Seven-stage innovation quality preflight — Powerhouse / Portal

Canonical owner: [#4661](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4661). This is an **extension of the existing parallel-engineering fabric**, not a replacement for protected GitHub, Supabase, Netlify, ONE BRAIN or HEARTBEAT truth.

## Seven enforceable planning and release stages

1. **Source and ownership.** Capture official/provider/internal HTTPS source, observed timestamp no older than 30 days, hypothesis, customer/engineering goal, exact main+candidate SHA and canonical owner/obligation lease. URLs and timestamps are only *submitted metadata*, not independently trusted provider proof.
2. **Historical replay.** Name actual `tests/brain-*.test.mjs` evaluation paths; do not count a proposed test as already executed.
3. **Shadow experimentation.** Define a read-only challenger vs champion comparison on the same observations, with measurable primary metric, baseline at least 30 observations, source evidence and direction.
4. **Bounded canary and rollback.** Specify rollout and rollback on regression, no autonomous spend, no permission escalation and no cross-tenant access.
5. **Protected release.** Real Required CI, CodeQL, RLS/tenant/security/finance/visual gates, exact SHA protected merge and required provider readback are the only authorities.
6. **Observed impact.** Customer goal attainment / engineering latency / errors are independently measured on comparable cohorts; do not manufacture uplift, wins or causality.
7. **Compounding learning.** The original Brain incident, regression, skill and append-only ledger records receive measured outcomes; unsuccessful variants are retained as negative learning without becoming new schedulers.

## What is actually executable now

`scripts/brain/agent-candidate-quality-stages.mjs` supplies the fail-closed quality-envelope evaluator. The existing `scripts/brain/parallel-engineering-fabric.mjs#buildExecutionPlan` invokes it whenever a work package uses `candidateType=innovation|model_upgrade|new_technique|autonomous_optimization` or provides an `innovation` packet. Invalid source/lease/baseline/replay/control/rollback/security evidence fails preflight as `QUALITY_STEPS_HOLD`. A complete envelope becomes `READY_FOR_NONPRODUCTION_CANDIDATE_CI`, **not** provider-verified, approved for production, or proof of benefit. No new provider calls, workers, model purchases, queues, schedules or production rights are created. Existing legacy packages and all Required/CodeQL/release gates remain untouched.

## Quality acceptance

Regression: `node --test tests/brain-agent-quality-stages-v1.test.mjs tests/brain-parallel-engineering-fabric.test.mjs`. Exact-head Required/CodeQL, protected merge, current-main readback, Brain skill projection. The independent active agents on [#4756](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4756) and [#4760](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4760) retain their own non-overlapping telemetry owners. Real production/portal business benefit requires later independent readback.

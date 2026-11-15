# Original engineering/CRO source decisions after pre-review — same ONE BRAIN loop

Original incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Independently observed production failure

Native Supabase `adhjwmvyoixzjtmiroln` contains exactly **14 original** `INNOVATION_INTAKE` operations, each `PLANNED`, each with `original_agent_pre_review` source SHA/revision/rollback check. **0** independent real original-agent consumer ACKs, **0** `remote_ref`, **0** protected candidate implementations proven for these original 14. The original owner distribution is **13** `agent:agent-integration-engineer` and **1** `agent:agent-growth-market`. A daily job that only audits or repeats initial pre-review cannot automatically progress the same already-reviewed obligations.

## Minimal same-owner decision consumer, without second scheduler

The original `.github/workflows/powerhouse-daily-self-evolution.yml` already runs every day and has its original `original_intake_recovery` scope. After the existing `innovation-original-agent-pre-review.mjs --writeback`, both SAME original execution modes now run `scripts/brain/innovation-original-owner-decision.mjs --writeback`. It reads the exact same original three canonical tables with paginated exact count and fails closed on missing or drifted source owner, status, correlation, SHA or rollback. It inspects the already registered `original_agent_pre_review` and decides, without re-running external sends, which original owner must do what:

- `BASELINE_AND_EVALUATION_DESIGN_REQUIRED`: the generic "bounded_learning_followup" has no real baseline or independently measured alternative; original engineering must design evaluable next action, not invent a patch.
- `CONCRETE_PROTECTED_CHANGE_PROPOSAL_DUE`: original engineering has an explicit change hypothesis; original agent must evaluate current source and deliver a bounded code candidate via the existing protected GitHub/CodeQL/native provider path.
- `CRO_MEASUREMENT_AND_HOLDOUT_DESIGN_REQUIRED`: the original Growth/CRO agent must validate consent, bot exclusion, measurement baseline and a controlled treatment/holdout, then measure actual effect.
- `INSUFFICIENT_ACTIONABLE_SOURCE_EVIDENCE`: unknown or unbounded original item remains OPEN, requires evidence, and cannot dispatch production effects.

An original decision is persisted **only in the original operation**, `brain_operations.evidence.original_owner_decision`, by the original native `brain_transition_operation` optimistic CAS. It contains source revision, original agent, SHA256, original pre-review fingerprint, immutable correlation/idempotency, action/rollback digest, decision type and next owner action. After the native RPC, the original operation is independently read back with an exact provider GET. Identical decisions are idempotently held; native conflicts or changed evidence never produce a false success. No new native table, queue, scheduled executor, agent, publisher or provider sends. GitHub public artifacts include only totals and typed error codes, no personal/candidate data.

**Important truth boundary:** This is an autonomous, auditable next-stage decision and work packet, **not** a provider-issued agent implementation/ACK. The original operation stays `PLANNED`, `remote_ref=NULL`, `consumer_ack_verified=false`, `production_mutation_authorized=false` and `terminal_success=false`. The original protected implementation, independent provider readback, actual net economic effect vs no-action, Heartbeat and applied ONE BRAIN learning remain separate mandatory steps. No unreviewed code promotion, source-synthetic finances or false "everything green".

## Regression and release

Regression `tests/brain-innovation-original-owner-decision-20261115.test.mjs` covers original owner/tenant/revision/SHA/rollback gates, all three decision types, native CAS, idempotent duplicate, conflict, independent GET, zero fake ACK/ROI, existing single daily schedule and bounded recovery. Protected Required/CodeQL and main must pass; then the next natural original daily run must read back real decisions in source operations. The existing original P0 remains OPEN until actual agent work and effects are independently verified.

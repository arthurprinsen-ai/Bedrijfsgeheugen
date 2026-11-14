# 2026-11-14 — Innovation consumer intake in one original Powerhouse chain

## Independent current production evidence
- Original canonical project: `adhjwmvyoixzjtmiroln`.
- Original producer function `public.powerhouse_run_self_improvement_layer_v1(date)` already transfers 14/14 candidates into original `brain_obligations.INNOVATION_DELIVERY`; no missing owner, no missing candidate.
- Original source `powerhouse_optimization_candidate_v1`: 14 old candidates, 13 engineering and 1 CRO, all `candidate` and `review_required`.
- Original closure `powerhouse_optimization_closure_truth_v1`: 14 `REVIEW_REQUIRED`, **0** independently verified outcomes.
- Before this patch, original universal `brain_operations` contained zero verified candidate-consumer intakes. A row in `brain_obligations` is producer durability, not proof the engineering/CRO agent actually received or executed it.
- Last historical source candidate update is 2026-10-29. This backlog is overdue; a green cron may not conceal it.

## Root cause
The 2026-11-14 protected producer repair (#5790) established candidate→obligation completeness but stopped **before** the control-plane intake of the original engineering/CRO agent. The source-controlled `buildAllAgentInnovationDuties` was intentionally a read-only assignment projection. Neither one was evidence of actual consumer acceptance, protected implementation or customer value.

## Same-original-owner correction (no second Brain/executor)
Migration `supabase/migrations/20261114193000_innovation_original_agent_intake_proof_v1.sql` extends only original daily `public.powerhouse_run_self_improvement_layer_v1(date)`. It calls existing `public.brain_create_operation` to register one idempotent `INNOVATION_INTAKE` `brain_operations` intent per candidate **source revision**, under the actual existing registered owner:
- engineering → `agent:agent-integration-engineer`
- cro → `agent:agent-growth-market`

This preserves original `brain_obligations`, original control-plane binding and correlation, registers no new table, scheduler, queue, external sender or permission. An unrecognized owner is an explicit `INNOVATION_ORIGINAL_OWNER_UNMAPPED` fault instead of silent reassignment. Missing operation readback raises `INNOVATION_INTAKE_MISSING`. The existing daily pg_cron job remains enabled even if a particular run fails.

The original agent ACK only counts when **later** recorded on the **same** operation with `VERIFIED`, exact source revision, actual original agent ID, nonempty independent remote receipt and `independent_consumer_readback=true`. Even a true consumer ACK does not close improvement: original `powerhouse_optimization_closure_truth_v1.observed_cycle_verified` must additionally prove separate review, protected release/readback, independent outcome and learning. `PLANNED` is NEVER terminal.

Existing original `powerhouse_runtime_events` daily event now has `innovation_original_agent_intake`: total, registered intakes, verified consumer ACKs, unclaimed, age >24h, verified improvement cycles and original owner next actions. If anything awaits proof it uses `observed/OWNER_HANDOFF_PENDING` rather than misleading `actioned/VERIFIED`. No automatic approval, provider dispatch, false revenue or irreversible effect.

## Release and acceptance
1. Original protected CI: Required, CodeQL, backend and daily workflow regression `tests/brain-innovation-original-consumer-intake-20261114.test.mjs`, source migration parity, valid provider preview.
2. Merge to protected main under the original writer lease; original native Supabase migration application, exact version/function-definition readback.
3. Invoke exactly the existing daily function once to prove idempotent production operations and the source/obligation/operation count; next natural cron must keep 14/14 under same lineage.
4. Original agent carries out safe evaluation via existing protected release and independent readback; maintain 14 open if no real owner ACK or effect. Never assert 14 successes from 14 new PLANNED operations.
5. Preserve parent P0 https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198 and original #5790 producer release. Root fingerprint `powerhouse|innovation|producer-to-original-consumer-intake-gap|20261114-v1`.

**Truth before release:** source/producer 14/14 LIVE, original consumer-intake change PROPOSED. No implemented innovation value yet.

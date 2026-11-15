# Original ONE BRAIN evidence store — atomic insert + immutable consumer proof

Date: 15 Nov 2026. Parent P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198 .

## Verified source defect
`tools/outcome-obligation-supabase-store.mjs::evidenceStore.putIfAbsent` first GETs the original `brain_outcome_obligation_evidence` and then POSTs `resolution=ignore-duplicates,return=minimal`. A concurrent writer can insert the composite key between the GET and POST. The original code then independently GETs the persisted record but **always returns `created:true`**, even if provider inserted nothing. Worse, the same immutable evidence ref can be silently re-used by a caller asserting different `independent`, `accepted`, `exactProduction`, type, producer or production identity.

This is a code-proven **false acknowledgment risk**, not proof that any specific customer provider action was duplicated or any particular proof record is fraudulent. Independent native Supabase 2026-11-15: 250 recent SUPERVISOR_DECISION rows are explicitly NOT independent/accepted/production; 3,557 AgentWork/PENDING and 1,055 RecoveryWork/RECOVERING in append-only source. These are immutable history records, not necessarily live work queue depth.

## Bounded same-owner repair
Preserve original table, RLS, service-role-only, composite unique constraint and `resolution=ignore-duplicates`. Only change original server-only `putIfAbsent` to request `return=representation` and independently confirm exact `idempotency_key,evidence_ref,evidence_type`. Exactly one inserted row returns `created:true`, ignored duplicate returns `created:false`, unknown/ambiguous response fails closed. Both earlier GET and post-insert GET must match expected original immutable proof `ref,type,producer,taskIdentity,candidateIdentity,productionIdentity,independent,accepted,exactProduction`, else fail explicitly. A conflicting existing proof cannot be upgraded: require new distinct independently supported proof event rather than overwrite/false green.

Existing Reliability/Data Quality agent tasks and existing recovery skill extended. Tests cover new proof, replay, concurrent race, conflict, unexpected provider identity and unknown outcome. Same machine Brain learning and human activity ledger. No new queue, cron, executor, source migration, recipient, provider send, paid external compute or blanket historical closure.

## Release and outcome acceptance
Protected Required/CodeQL → protected main merge → exact Netlify production READY → genuine original natural `Completion Supervisor Backfill Resume` result and per-identity readback. Code success changes only immutable evidence write correctness, **not** historical processing or customer outcome. Parent #4198 stays open for actual consumer ACK, provider side effects, Heartbeat metrics and applied next-run learning.

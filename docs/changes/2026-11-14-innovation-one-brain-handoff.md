# Innovation agent: one producer-to-ONE BRAIN delivery lineage (2026-11-14)

## Observed production cause

At 2026-11-14 17:34 UTC the original hourly job `powerhouse-autonomous-improvement-cycle-v1` succeeded and its daily sibling `powerhouse-self-improvement-layer-v1` succeeded at 03:02 UTC. Cron success means the scheduled SQL completed, not that an innovation was shipped. The existing read-only agent portfolio projects `ASSIGNED_NOT_EXECUTED`. Fourteen original `powerhouse_optimization_candidate_v1` records remained `candidate`, last touched 2026-10-29, with zero measured outcome fields. All 14 fail the existing `powerhouse_optimization_closure_truth_v1` at `REVIEW_REQUIRED` and have no verified delivery/learning/value. Existing hourly replay-window optimization had already reached its safe 12-hour floor. It cannot be reported as new improvement.

## Immediate no-loss repair, independent production readback

The 14 historical candidates were put in the **existing** `public.brain_obligations` registry as `INNOVATION_DELIVERY` on 2026-11-14 17:45 UTC. Separate readback: **14 OPEN**, **14/14 matching original candidates**, **0 missing**, **0 owner mismatch**. Each carries canonical tenant, candidate ID, revision, source, owner, durable correlation ID and requested original protected action. This is a verified persisted **intent handoff**, not consumer ACK or implemented innovation. The write is idempotent on the original unique key.

## Durable repair under the original scheduler

The protected migration `supabase/migrations/20261114184600_innovation_canonical_candidate_handoff_v1.sql` extends only existing `powerhouse_run_self_improvement_layer_v1(date)`. Every natural daily run reconciles **all** canonical candidate rows into one logical original `INNOVATION_DELIVERY` obligation per candidate with no duplicate scheduler, table, store, worker or publication. Revisions/owners update the same nonterminal obligation; existing terminal proof is never overwritten. The same function checks candidate-to-obligation cardinality and owner/identity readback; incomplete transfer raises `INNOVATION_HANDOFF_INCOMPLETE` and fails visibly instead of issuing a false-green cron success.

New `OPEN` is the producer's durable write, not the next owner having consumed the work. The original engineering/CRO/SEO/Portal agents own code candidate evaluation via the existing protected release; only exact Required/CodeQL, provider SHA, application, independently verified result and ONE BRAIN learning ACK can close a delivery obligation. Security, consent, rights, approval, cost and production-change constraints remain enforced. No bypass of `review_required` for the original 14 records.

## Follow-through acceptance

1. Protected PR Required/CodeQL passes and migration deploy parity is proven.
2. Next **natural** daily `powerhouse-self-improvement-layer-v1` reads back all current source rows with zero missing obligations.
3. Original owner claims and ACKs each candidate's same immutable correlation ID; no orphaned `OPEN`/stale candidate may be silently closed.
4. Each actual fix receives exact protected deploy proof, next natural agent use and independent effect measurement in original ONE BRAIN, or stays `OPEN` with owner/cause/retry.
5. Portal and Heartbeat truth keep the 14 pending statuses distinct from deployed improvements; closing requires original `powerhouse_optimization_closure_truth_v1` evidence.

Canonical parent P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198. Live claim is **limited to the 14 original obligations read back**, not this pending migration/production runner until the protected release succeeds.

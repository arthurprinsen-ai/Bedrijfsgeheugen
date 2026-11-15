# Multisector business improvement — one customer-value proof chain (2026-11-15)

Parent issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
Fingerprint: `powerhouse|customer-value|cross-sector-baseline-and-tenant-proof-mismatch|20261115-v1`.

## User objective and original authority

Position Bedrijfsgeheugen as a broad technology company serving dienstverlening, groothandel/e-commerce and industry via one existing platform, not a new product-runner. Existing authority: authenticated Portal V2 BusinessInput -> original ONE BRAIN obligation -> Company Intelligence Powerhouse action -> Heartbeat independent outcome -> original Outcome Memory -> learning / next decision -> same Portal V2 context. The commercial examples Business Flow, Margin Intelligence and Operational Control are sector-facing configurations, not separate schedulers, databases, agents or value truth.

## Inspected actual production at 2026-11-15 08:59 UTC

Supabase project `adhjwmvyoixzjtmiroln` ACTIVE_HEALTHY; original `brain_obligations` `INNOVATION_DELIVERY=14 OPEN`, `CONTENT_HANDOFF=387 OPEN`, `COMMERCIAL_EXECUTION=7 OPEN`. Netlify `bedrijfsgeheugen` current READY deploy `6af9719582fca8a442788e9d` corresponds to `main` `816e0d6c8268588e3a6cc1ce68c13e4ef1cd08f3` at original inspection; new main advanced concurrently. READY is not consumer ACK or measured customer value. The 14 innovation delivery records have durable producer intent but no independently proven receiving-agent execution; original writer owns follow-through. Do not backfill outcomes or mark these closed.

## Confirmed code-level gap and scoped guard

Original `customer-value-briefing.js` required a matching action ID, terminal verified status, healthy refs, amount, unit, metric, baseline ID and period, but did not compare **outcome baseline** with the **original action baseline**, or reject explicit different tenant IDs. In a cross-sector rollout this could misassociate a measured result. The fix reuses the original read-only Portal V2 projection and rejects wrong-baseline and explicitly wrong-tenant outcomes, retaining authenticated upstream tenant scoping when an ID is absent. No evidence of an actual customer leak was observed; source inspection, not observed incident loss.

## Handoff and fail-closed acceptance

1. One authenticated tenant + original action ID + source revision + owner + baseline KPI and period; no double-writer or duplicate action.
2. Original producer persists intent in existing ONE BRAIN, original consuming agent returns exact durable ACK; OPEN does not mean executed.
3. Original Powerhouse policy and provider approve/execute bounded side effect, independently read back provider identifier and exact output; permission absence means HOLD.
4. Original Heartbeat measures the same KPI and baseline in a comparable period, preserving units and scope; distinguish observational from causally attributed value; invoice reconciliation required for paid revenue.
5. Original Outcome Memory and learning require separate evidence and next decision; project a truthful result to the existing portal, no invented green success.
6. Reconcile orphaned or delayed obligations with original owners/retry reason/last checked time; never silently discard or create parallel queues/schedulers.
7. Keep #4198 open until actual tenant-scoped executions, consumer ACK, effect and next-natural-run learning are evidenced. Tests and a green website deploy are insufficient.

## Release status

This is a scoped protected PR candidate. Required, CodeQL, full backend BRAIN as applicable, protected merge, exact Netlify main deploy, authenticated portal readback and natural-run customer effect are individually required before marking full live/green.

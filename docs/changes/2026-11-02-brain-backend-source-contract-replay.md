# P0 — BRAIN tests should verify original behavior after bounded source refactors (2026-11-02)

**Original P0 #4439, related #4198.** Latest observation GitHub BRAIN run `41409975773` from protected PR #5252: 5,358 tests, **5,324 pass, 32 fail, 2 skip**. Terminal run `41409939930` blocked as designed. Protected main merge `3621657751881f50240f9dd4a787a76530c7d369` is source-only; production Supabase migration versions `20261102074013` and `20261102075243` are not applied and user-visible paid revenue is unproven. Never conflate these statuses.

## Source-proven failures in the original replay
Four original failing assertions were tied to obsolete *source spellings*, not a demonstrated permission or value escape:
1. `brain-brand-learning-editorial-tdz-v1` requires `const editorialSystem`; the verified current source uses `let editorialSystem` to append the buyer-first editorial guarantee after initial verified brand guide, still before `stage='artifact-ai'`. Test now accepts the original `const|let` declaration and explicitly checks buyer-first appended policy and ordering.
2. `brain-commercial-independent-readback-p0-v1` and `brain-commercial-pressure-rank-and-outbound-proof-v1` require inline literal NO_ELIGIBLE_PREPARED_EMAIL/NO_PROVIDER_CONFIRMED_EMAIL in the sender. Original sender now delegates this exact canonical decision to `_shared/outreach-composer-hold.mjs`. Tests now import and exercise that pure helper for no prepared recipients, no provider-confirmed deliveries, and ambiguous provider readback. Original sender `sent=out.filter(status==='sent')`, `status=waarschuwing` when not delivered and `external_outreach_executed:sent>0` remain required.
3. `brain-cro-one-loop-portal-20261030` requires former `loadOneLoopAssurance` call. Original admin-only endpoint now uses `loadOneLoopAssuranceWithDiagnostics` from the original canonical 15-loop readback module. Test now asserts this exact original diagnostics consumer and import, retains admin authorization, tenant, RED source-proof, no added scheduler/store.

## Fixed proof and untouched blockers
All four original tests retain explicit source contracts; they are not disabled, skipped, weakened to truthy, or replaced with empty mocks. No website, publisher, CRM, consumer, database or external provider runtime is modified. No migration, RLS, scope, checkout/revenue, suppression, original BRAIN verifier or workflow authority is changed.

**Still open:** 28 other failures in that observed BRAIN run; current exact-head BRAIN must run again before revising counts. An unrelated `Required` green never promotes full BRAIN. Original production migration ownership stays under original approved Supabase release only; the new SQL remains unapplied until exact ledger/trigger privilege readback.

**Evidence:**  GitHub BRAIN run `https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41409975773`, terminal run `https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41409939930`. Exact source paths and replay tests are machine listed in `brain/learning/2026-11-02-brain-backend-refactor-contract-drift.json`.

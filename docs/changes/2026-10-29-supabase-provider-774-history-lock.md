# 29 October 2026 — truthful 774-version Supabase production migration lock

Obligation: `delivery|supabase-preview|live-provider-774-history-lock-drift|20261029`.

## Root cause and observed state

The existing `supabase/migration-history.lock.json` documented 770 applied versions from an older capture. Independently queried live Supabase at `2026-10-29 11:54:04 UTC`: **774** applied migration identities now exist, including the 3 exact source files mirrored by protected GitHub PR #5104 plus `20261028220000_bg_linkedin_lus_v1` applied during the GitOps release.

Critically, an earlier live query showed the LinkedIn table/functions absent. After PR #5104 merged, actual provider readback showed the migration entry applied, `public.bg_linkedin_bewijs` present, and `public.bg_social_lus_cyclus(text,date)` present. A prepared archival of this SQL was therefore **reversed before merging** and the verified active source was preserved without modification. Never substitute stale observations for a new provider snapshot.

## Safe change

Update the existing lock from 770 to 774 **provider-recorded** identities; do not create any new SQL migration or execute DDL. Keep the actual `20261028220000` source in the executable migration directory and add a no-archive regression. Original SQL remains unchanged. Compare by unique 14-digit timestamp AND registered name, never infer applied from a filename alone.

## Verification and limits

- Independent Supabase migration API listed 774, with exact four new identities.
- SQL provider readback confirmed the LinkedIn table and cycle function exist on production.
- Run `tests/brain-supabase-migration-lock-provider-20261029.test.mjs` and existing strict `tests/supabase-migration-history-integrity.test.mjs`, then protected Required, CodeQL, source-contract and post-merge provider recheck.
- No new Supabase project, paid preview, scheduler, writer, external posting or direct main mutation. Database migrations were not applied by this candidate: it only records their already observed provider state.
- This restores historical bookkeeping; the success of the LinkedIn order/revenue loop still requires independent provider and outcome evidence.

## Protected Preview replay guard — independently diagnosed

The current-head Supabase Preview surfaced `BRAIN_FAILURE_OBSERVE_SOURCE_DRIFT` in the **already recorded** migration `20261022173500_brain_failure_observe_semantic_guard_v1.sql`. Direct live Supabase function readback proves that the earlier guard's only accepted text (`evidence=coalesce(p_evidence,evidence)`) is now **false**, whereas the stronger already-deployed function uses `evidence=coalesce(evidence,p_evidence)`, enforces semantic conflict detection, advisory-lock serialization, and private service-role execution only.

The **precondition guard** is adjusted to accept exactly two safe replay situations: the original baseline about to be migrated, or the already-correct modern postcondition with explicit semantic and ACL proof. Missing, unrecognized or publicly executable implementations still raise `BRAIN_FAILURE_OBSERVE_SOURCE_DRIFT`. The migration identity, SQL body after the guard (SHA256 `972f35b0ec503e08a7267b3e2b05f2dda94842965af4e9370df1d0d47d76611a`), production records, and all DDL remain unchanged. This does **not** bypass failed preview checks: a new protected exact-head Supabase Preview and Required run must independently pass.

This is an explicit source-level correction of a historical migration's replay precondition; the already applied production SQL is not reapplied or its migration-history entry rewritten.

# Original Supabase migration history: provider 801 versus source 800 — 2026-11-04

## Independent readback (original source authorities)
- Supabase project `adhjwmvyoixzjtmiroln`, original `supabase_migrations.schema_migrations` read-only query at `2026-11-04T13:07:33.991Z`: exactly **801** applied migrations. Latest `20261104090000:ga4_consent_limited_data_spine_truth_v1`.
- Git protected source `supabase/migration-history.lock.json` at `5f613a1802c9ece6d4023beef1c6a058caf9db22` held the original 800 entries captured 2026-11-04 07:43:05.326605Z. Independent comparison of **all 801 provider version/name pairs** against the 800 source records: **0 modified, 0 lost, precisely 1 new identity**.
- The exact SQL `supabase/migrations/20261104090000_ga4_consent_limited_data_spine_truth_v1.sql` is already in the original protected Git source and already applied at the provider; do **not** execute it again, modify RLS, or treat a code change as a new deployment.
- Original complete postmerge BRAIN run [#41830031893](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41830031893), backend job `126574955004`, had **7 failing tests**, mostly this source/provider drift. The original Portal progressive disclosure static test also expected an obsolete literal five-item array; production source now preserves additional real model, company and reorder widgets.

## Root-cause fix
- Append exactly one provider-attested row to original `supabase/migration-history.lock.json` and advance `captured_at` to original source observation time.
- Preserve the original 800 exact identity baseline; test local executable migration count equals original locked provider count, new GA4 801st name is exact, no duplicates, monotonic snapshot time and **no invented runtime success/paid revenue**. Avoid hardcoding 800 as an eternal total after the audited history legitimately grows.
- Original mobile/overview BRAIN regression now validates the expanded original DOM list, true tenant-owned company/adoption/customizer nodes, native `details` and no source duplication. This strengthens tests rather than cutting assertions.
- Keep the single original Migration History owner / BRAIN recovery / exclusive writer, no second migration runner or scheduler. Immediately reconcile `supabase_migrations.schema_migrations` with `supabase/migrations/*.sql` and `supabase/migration-history.lock.json` upon future official migration application, before global BRAIN green.

## Independent gates
Protected PR Required/CodeQL, source manifest and original complete postmerge BRAIN, original terminal closure; production source exact SHA and read-only provider history. Any new migration before acceptance requires re-reading original provider history and exact source/filename parity. The original Portal Production DOM Readback remains a **different** browser acceptance gate. No project revenue/ROI or authenticated user task is proven by migration source reconciliation.

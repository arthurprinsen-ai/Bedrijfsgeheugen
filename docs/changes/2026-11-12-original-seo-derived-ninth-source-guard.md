# Ninth derived SEO source: original #175 count guard

Date 2026-11-12. Original P0 #4198, Portal acceptance #4215, release health #4929. Fingerprint `seo|original-175-nine-derived-sources-guard-ack|20261112-v1`.

## Independent production evidence
Native Supabase project `adhjwmvyoixzjtmiroln` has exactly 837 applied migrations, ending 20261112214500. Real original `powerhouse_evidence_source_observations` has one derived `seo-opportunity-intelligence` record observed 19:59:35 UTC. Original `powerhouse_growth_source_daily_v1` as of 20:01:48 UTC has 20 source rows for 12 November but zero `seo_opportunity_intelligence` records. Native `pg_get_functiondef('public.powerhouse_daily_source_archive_v1(date)')` shows the derived row was inserted by migration #837; its original `IF v_manifest IS NULL OR v_saved<>8 THEN` still expects eight inserted source rows. Adding the derived UNION ALL makes nine; `GROWTH_SOURCE_MANIFEST_INCOMPLETE` is inevitable on the next run. Original #175 cron remains active, last source snapshot before the patch.

## Single original recovery
Create one source-controlled guarded function definition patch (`20261112220000_original_seo_derived_ninth_source_guard_v1.sql`): assert derived source present, old count exactly once; replace `v_saved<>8` with `v_saved<>9` only, and read the resulting database function back. Preserve previous applied migrations, security definer privilege/ACL, tenant, source revision, original #175/140/Heartbeat and no duplicate runtime scheduler. Do not alter original lock before provider actually applies a new migration. Original skill, learning, tests and human ledger accompany the same protected release.

## Required acceptance
Protected exact-head Required + CodeQL + native Supabase Preview, merge to protected main, provider native actual migration and body readback. Then run/observe existing original #175 for the relevant day (no alternate scheduler), verify the ninth derived record and complete manifest/new SHA, original #140 independent consumer ACK and commercial Heartbeat same SHA, Portal render and measurable CRO only after separately proven. No fake rankings, visitor growth, revenue or `GREEN`.

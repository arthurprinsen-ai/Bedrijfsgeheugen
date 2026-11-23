# Original SEO archive cardinality regression recovery — 12 Nov 2026

Owner: existing Powerhouse daily source producer #175, ONE BRAIN consumer #140 and original commercial Heartbeat. Parent P0 #4198. No parallel owner or scheduler.

## Verified runtime incident
PR #5692 merged and native migration #837 (`20261112214500`) was independently read back in production. It correctly added one provider-neutral `seo_opportunity_intelligence` projection and production `pg_get_functiondef` contains the new branch. A direct one-time execution of the SAME original `public.powerhouse_daily_source_archive_v1(date '2026-11-12')` (not a new executor) failed with `SQLSTATE 23514 GROWTH_SOURCE_MANIFEST_INCOMPLETE:9`; no producer or consumer receipt was committed.

Cause: source CTE now inserts **9** rows, but the original post-insert guard `IF v_manifest IS NULL OR v_saved<>8 THEN` remained unchanged. The protected merge and purely static tests did not exercise the original archive at runtime.

## Small exact-owner correction
One guarded native migration rewrites only this original function guard to require **at least nine** newly archived producer rows **and** an exact derived SEO source row for the same day and tenant; additional future legitimate sources can be added without reverting to a brittle exact cardinality. Preserve all existing immutable provider records, source references, writer identity, schedule, RLS, grants, and security-definer signature. The migration aborts on unexpected function definition or missing derivation and performs an independent definition readback.

## Verification and closure
Protected Required/BRAIN/CodeQL + applicable Supabase Preview → protected main merge → provider-native applied migration and function-definition readback → invoke or observe original daily #175 with fresh manifest and `seo_opportunity_intelligence` source → original #140 exact new SHA ACK → original commercial Heartbeat same-SHA ACK. Keep `GROWTH_SOURCE_DAILY_HANDOFF` OPEN and `optimization_status=NOT_EXECUTED` until real CRO action, 7/14/28 day effect, and lead/order/revenue are independently measured. A SQL migration or one source receipt is not evidence of growth.

Agent: `platform/agents/agent-team.mjs`; Skill: `.agents/skills/powerhouse-seo-conversion-orders/SKILL.md`; learning: `brain/learning/2026-11-12-original-seo-archive-cardinality-regression-v1.json`; replay: `tests/brain-original-seo-daily-archive-cardinality-20261112.test.mjs`.

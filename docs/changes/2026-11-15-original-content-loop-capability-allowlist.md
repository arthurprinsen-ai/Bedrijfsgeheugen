# Original Powerhouse content loop: publisher capability read repair — 15 November 2026

Parent P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Independent production evidence
The existing `powerhouse-content-loop` Edge function intermittently returned HTTP 500 and `CONTENT_LOOP_INTERNAL_ERROR` in the same canonical tenant/day, while outer cron #140 reported SQL succeeded. Native production function logs show exact `CONTENT_LOOP_ERROR DB_TABLE_REJECTED:powerhouse_social_publish_capabilities_v1`. The error arises only on the company 422 regeneration branch: its static `db.from('powerhouse_social_publish_capabilities_v1')` is not included in the same Edge function's own `DIRECT_TABLES` allowlist. The table is a real existing `public` base table; no new SQL DDL is needed.

## Minimal and reversible fix
Allow the original content loop to SELECT that existing lease/consumption source, but reject every INSERT/UPDATE/UPSERT there. Do not alter the original publishing capability itself, provider authorization, source freshness, duplicate/story-family veto, existing immutable claims, or ONE BRAIN state. Preserve the one original loop and one actual social publisher. The regression enumerates all static `db.from` source tables to avoid another hidden allowlist mismatch.

## Required release and outcome proof
1. Protected Required/CodeQL and exact-source integration; same branch and original GitOps deploy to original Supabase function.
2. Independently inspect actual production Edge `powerhouse-content-loop` source and compare with protected main at release SHA.
3. Observe a subsequent existing original content-loop execution; verify `DB_TABLE_REJECTED` no longer occurs, and inspect each stage's actual result.
4. Only mark a channel live after actual LinkedIn provider ID, independent GET and original ONE BRAIN named `PROCESSED` consumer + Heartbeat measurement. Existing source or provider permission limitations remain OPEN and must never be bypassed.

Release status in this record is source CANDIDATE at creation. No post, commercial result, or closed obligation is claimed.

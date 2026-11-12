# Native Supabase source lock: 829th already-applied version only

At 2026-11-12 14:22:44 UTC, canonical Supabase project `adhjwmvyoixzjtmiroln` returned 829 *already applied* migrations and exact identity `20261112144500_original_social_legacy_alias_acks_v1`. The last protected merged source release was [PR #5651](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5651) at 14:06 UTC. Original main source lock still listed only 828.

Protected PR #5652 was correctly blocked because it attempted to reconcile this original 829th history row **and** propose next `20261112162500` in a single candidate. The provider verified 829th SQL was independently read from `supabase_migrations.schema_migrations.statements`, matched the immutable Git executable `supabase/migrations/20261112144500_original_social_legacy_alias_acks_v1.sql` excluding whitespace only, and the provider version/name exactly matches. This standalone protected recovery appends **ONLY** that already applied 829th lock row; the future source-event-time change is intentionally not marked applied or performed.

Mandatory: no new SQL migrations or provider writes, exact Required/CodeQL and native lock source readback before merge. Follow-on PR #5652 must use current 829 source lock as immutable base and run its original pending SQL migration through the canonical protected Supabase preview then prod deployment.

Test: `tests/brain-provider-applied-829-lock-parity-20261112.test.mjs`. Incident #4198 and exact provider evidence in learning JSON. No scheduler, new publisher, duplicate or OAuth workaround.

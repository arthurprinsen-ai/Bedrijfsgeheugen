# 2026-11-15 | Original native 868 migration source lock handoff

- Parent P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Original protected source release: PR #5852, main `2aa0866c5975def2e6833023b39351b53c1fdfca`.
- Provider native independent SQL at 2026-11-15T11:42:57.174Z: original `supabase_migrations.schema_migrations` has **868** exact applied version/name pairs; original source lock has **867**; all 867 pairs independently match, no source-only mismatch; exactly one native-only `20261115121500_original_wrapped_serp_source_dispatch_wakeup_v1`.
- Root: protected original source/migration and provider application advanced before versioned GitOps inventory readback was appended; later unrelated backend PR #5851 protected CI correctly failed `867 !== 868`. Do not disable the guard.
- Same original migration-history owner: append exact native-only 868th identity to existing `supabase/migration-history.lock.json`; preserve original 867. **No second migration execution**, new DB object, queue, worker, scheduler, provider send, OAuth, secret or permission.
- Regression: `tests/brain-supabase-migration-lock-provider-20261029.test.mjs`, `tests/supabase-migration-history-integrity.test.mjs`. Machine record `brain/learning/2026-11-15-native-868-wrapped-source-migration-lock-v1.json`. Human change `docs/changes/2026-11-15-native-868-wrapped-source-migration-lock.md`.
- Must prove exact-head Required, CodeQL, preview requiredness and protected main merge, then independent native 868/868 source/provider readback. Parent P0 OPEN for real original consumer/provider/Heartbeat outcomes.

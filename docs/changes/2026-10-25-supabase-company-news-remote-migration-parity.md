# Restore Supabase native main-branch deployment parity — 25 October 2026

Parent P0: #4198  
Obligation: growth:company-news-provider-history-parity:20261025-v1  
Fingerprinted failure: supabase|main|remote-only-manual-company-news-migration-version|20261025-v1

## Observed production incident

At 11:42:42 UTC the existing protected Supabase main-branch workflow failed with `Remote migration versions not found in local migrations directory`. Read-only comparison against Git's migration directory and `supabase_migrations.schema_migrations` proved exactly one remote-only version `20261025112658` (name `company_news_widen_eligible_search_before_cooldown`) and one local-only pending version `20261025110200` (commercial provider-proof reconciliation).

The remote record's SQL source text was compared byte-for-byte with the already-reviewed `20261025101500_company_news_widen_eligible_search_before_cooldown.sql`: **identical, 4,087 bytes**. Both recorded versions represent the same already-applied functions, not two independent schema features. The existing production functions use an internal candidate ceiling of 1,500, return at most 20 companies, and preserve service-role-only EXECUTE (anonymous and authenticated denied).

## Same-authority, non-destructive resolution

Commit the actual already-applied `20261025112658` historical SQL into Git under that exact timestamp, preserving each byte and no synthetic SQL semantics. A regression requires the recovered file to equal the canonical version and preserve privilege and business-budget guards. This is a **history-source reconciliation**, not an instruction to replay this SQL manually on production.

Do not delete or modify `supabase_migrations.schema_migrations` directly. Do not create new schedules, queues, provider calls, public grants, or revenue receipts. Preserve the original Supabase GitHub-native deployment and protected main merge. The next migration `20261025110200` remains unproven in production until native provider deployment and independent SQL readback.

## Acceptance and prevention

1. On this exact PR head: Brain learning replay, backend Required, CodeQL, and authentic provider-associated Supabase preview must all succeed.
2. Protected merge; native production migration must report all expected local/remote version identities reconciled, then apply the pending commercial provider-proof migration.
3. Verify `schema_migrations.version='20261025110200'`, deployed function source, and the distinct independently-proven versus permission-limited-ACK counts. Instagram proof, predictive overdue outcomes, qualified leads and revenue remain separate.
4. Prevent recurrence: a single migration writer and GitOps release authority, deterministic preflight on remote-only identities, no simultaneous manual `apply_migration` plus native Git deploy, and an owner-evidence gate before any repair.

No full-cycle green or paid-order claim is made by this migration history repair.

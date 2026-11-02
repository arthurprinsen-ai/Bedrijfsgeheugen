# Original ONE BRAIN incident — missing applied publication migration source

Timestamp: 2026-11-02, post-merge PR #5252. Parent P0 #4198. Original production SHA `3621657751881f50240f9dd4a787a76530c7d369`.

Observed: Github main Supabase Preview check `125161001325` FAILED: 'Remote migration versions not found in local migrations directory'. Read-only compare production `supabase_migrations.schema_migrations` (788 applied versions) against exact Git main executable SQL files (789) established one applied version missing: `20261031135451_publication_sync_preserve_recovery_handoff_v1`. Source contains the already applied `20261031133000` version, whose 2875-byte text EXACTLY equals official production `20261031135451` statements[1]. Missing source is a release-integrity incident, not failed new SQL or paid customer.

Action: candidate branch `fix/restore-prod-applied-publication-migration-20261102` restored that official SQL under exact applied identity. No rewrite of provider ledger; no manual DDL, access change, parallel publisher, independent executor, synthetic events or payment status. Tests and original delivery skill updated. Historical failure remains in GitHub and ONE BRAIN until protected merge, provider production migration+function readback, and next natural recurrence checks prove stability.

Pending outcomes: production two migrations `20261102074013` and `20261102075243`; check `anon/authenticated` EXECUTE false on both original trigger funcs; authorized first true tenant identity claim; actual paid receipt; no false-green conversion.

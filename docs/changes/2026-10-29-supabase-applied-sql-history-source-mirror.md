# Supabase already-applied migrations — exact source restoration, 29 October 2026

**Obligation:** `delivery|supabase-preview|remote-applied-sql-missing-in-main|20261029`

**Observed production failure:** main Supabase Preview reports `Remote migration versions not found in local migrations directory`. An independent list of `supabase_migrations.schema_migrations` and main's `supabase/migrations` shows remote-applied versions `20261028212459`, `20261029101146` and `20261029101159` are missing from repository source. These are actual already-executed migration entries, not proposed new schema changes.

**Repair:** three source SQL files copied exactly from `supabase_migrations.schema_migrations.statements[1]`. Provider MD5:
- `20261028212459` / `bg_bedrijfsprofiel_v1`: `e749a0d8bcbf168a28355b9e9c9f7770`.
- `20261029101146` / `personal_observational_source_date_gate_20261029`: `014b86182dfd2f5493f545e4ec51f741`.
- `20261029101159` / `linkedin_personal_observational_source_freshness_20261029`: `014b86182dfd2f5493f545e4ec51f741`.

The two personal-source migration entries share exactly the same provider-recorded SQL; each distinct applied timestamp is preserved, without inventing a placeholder or editing the remote ledger. Their SQL uses `CREATE OR REPLACE` and restrictive function execute privileges. The business-profile migration uses `CREATE TABLE IF NOT EXISTS`, RLS and service-role-only privileges.

**Known remaining discrepancy:** local file `20261028220000_bg_linkedin_lus_v1.sql` is not present in production's applied-version ledger. Its source remains unchanged. Do **not** call it applied without proof; do **not** edit the Supabase ledger or run an unknown migration to make checks appear green.

**Verification and gate:** local exact SQL MD5/ACL checks, mandatory Brain canonicalization, semantic writeback closure, Required/CodeQL, protected squash merge, then fresh provider migration-list comparison and Supabase Preview status. If Preview still fails, preserve the blocker and investigate before doing anything to production. No paid preview branch was created by this delivery.

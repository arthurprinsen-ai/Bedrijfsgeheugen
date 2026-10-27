# P0 #4198: commercial scorer index optimization

- Date: 2026-10-11
- Canonical change: optimize existing correlated forecast and outcome lookups.
- Live migration: `20261011094454_powerhouse_commercial_correlated_lookup_indexes_p0_4198`.
- Scope: seven B-tree indexes and statistics refresh only; no changes to scheduler, dispatchers or provider permissions.
- Verification: Supabase migrated successfully and read-only EXPLAIN uses the new entity lookup index.
- Remaining: canonical hourly job success, delivery receipts, attribution and complete learning loop are not yet proven.

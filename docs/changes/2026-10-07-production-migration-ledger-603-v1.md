# Production migration ledger 603 reconciliation

Supabase production advanced from 593 to 603 applied migrations while Git still represented the earlier ledger. The resulting Supabase Preview failure was migration-lineage drift, not an Edge Function failure.

This recovery is repository-only:

- read the ten missing identities directly from production `supabase_migrations.schema_migrations`;
- require exact version/name matches;
- use the production-recorded `statements` arrays as the source for each migration file;
- reject unsafe server-file/program SQL patterns before writeback;
- restore exactly ten canonical files under `supabase/migrations/`;
- advance `supabase/migration-history.lock.json` from 593 to 603 applied identities;
- add a regression guard for exact tail identity and one-file-per-version semantics.

No production DDL is replayed. Production remains the migration identity authority; Git is being reconciled to already-applied provider truth.

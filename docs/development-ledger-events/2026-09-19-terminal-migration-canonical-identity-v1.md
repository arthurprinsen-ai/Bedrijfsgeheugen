# Terminal migration canonical identity recovery v1

- Date: 2026-09-19
- Obligation-ID: terminal-migration-canonical-identity-v1
- Blocker: `MIGRATION_LEDGER_IDENTITY_MISMATCH` prevented terminal closure of otherwise delivered obligations.
- Root cause: historical supersession lineage retained an older migration version while current main/production use the same stable migration name under one canonical version.
- Fix: reconcile to the unique current-main identity, preserve exact production version+name proof, fail closed on ambiguity.

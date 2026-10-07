# 2026-10-07 — Production migration ledger 603 reconciliation

- Obligation: `production-migration-ledger-603-20261007-v1`
- Base main: `80cbbc27920227c21e9a7c1fef686d67c4eb93c2`
- Production migration count: 603.
- Repository lock before recovery: 593.
- Missing identities restored: 10.
- Identity range: `20261007061626` through `20261007064948`.
- SQL authority: production `supabase_migrations.schema_migrations.statements`.
- Safety validation: exact identity count/order, non-empty statements, blocked server-file/program SQL patterns.
- Production DDL replay: none.
- Business-data mutation: none.
- Regression authority: `tests/brain-production-migration-ledger-603-v1.test.mjs`.
- Required next proof: protected merge -> Supabase Preview no longer fails on remote/local migration drift -> #4033 rebased to current migration authority.


## Fresh-preview reproducibility recovery

A clean Supabase preview replay exposed that `public.powerhouse_identity_graph_v1` existed in production without a canonical create statement before its first migration-time use. The preview therefore stopped deterministically at `20261007063440` with SQLSTATE 42P01. The live production schema was read back exactly (12 columns, primary/unique identity constraints, entity/person/company indexes, RLS and service-role-only policy/grants) and materialized idempotently at the start of `20261005140225_powerhouse_bounded_identity_spine_v1.sql`.

Prevention: every runtime table referenced by historical migration functions must be created by the migration chain before first use; a fresh empty preview is the mandatory reproducibility proof.

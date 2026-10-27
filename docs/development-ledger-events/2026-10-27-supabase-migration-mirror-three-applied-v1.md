# Supabase migration mirror of three applied versions

- Obligation: supabase-migration-mirror-three-applied-20261027
- Change: mirror the three already-applied remote migrations on main. No new scheduler, writer or production DDL; the statements were already applied.
- Evidence: `tests/brain-supabase-migration-mirror-three-applied-20261027.test.mjs`; Supabase migration history lists 755 versions, main had 752; Supabase Preview reported "Remote migration versions not found in local migrations directory" on main while it is green on the PR #4967 head that carries the files.
- Status: candidate only; protected merge and a green Supabase Preview on main pending.

# Supabase: mirror three applied migrations to end drift

Production carries 755 applied migrations, main had 752. The three missing source files lived only on the recovery branch of PR #4967. Supabase Preview failed on every main commit and the integration skipped automatic edge-function deploys. The three files are copied byte-for-byte; nothing new is executed.

## Validation

`node --test tests/brain-supabase-migration-mirror-three-applied-20261027.test.mjs`

## Boundaries

PR #4967 remains open as a separate recovery candidate. The migration-history lock snapshot is unchanged.

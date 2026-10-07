# Supabase remote migration history parity v1

Production migration history and GitHub are reconciled without rewriting production history.

Six migration versions existed in Supabase production but not in `supabase/migrations`. Their real recorded SQL is mirrored into the repository, preserving fresh replay and removing the production Git integration failure `Remote migration versions not found in local migrations directory`.

The repository migration-history lock is refreshed from the production project and a Brain regression now requires every captured remote version to have a local migration file.

The historical `20261007171249` migration created a `SECURITY DEFINER` materializer before its later service-role-only hardening. The repository mirror therefore adds the same fail-closed execution boundary immediately for fresh replay: `PUBLIC`, `anon` and `authenticated` are revoked; only `service_role` receives EXECUTE.

No production migration-history row is deleted, rewritten, renumbered or fabricated.

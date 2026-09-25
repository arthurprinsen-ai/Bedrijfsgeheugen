# Supabase + Notion fast path — 25 september 2026

## Change

The agent delivery fabric now treats Supabase preview work as a database-specific lane instead of a generic portal/backend side effect. The repository preview workflow only reacts to `supabase/**` changes (plus its own workflow definition), while Notion is explicitly excluded from merge, deploy and production-readback authority.

## Evidence

The production Supabase project reports `ACTIVE_HEALTHY`, but the Git-linked default branch reports `MIGRATIONS_FAILED`. Repository and remote migration histories are materially divergent: 357 repository migration files versus 421 remote history rows, with 100 repository versions absent remotely and 164 remote versions absent from Git.

No bulk migration or migration-history repair was executed. Supabase documentation states that `migration repair` changes tracking state only and is appropriate only after actual schema truth is known.

## Invariant

Parallel agents may request an isolated Supabase preview only for database-relevant source changes. The Supabase GitHub integration should use Automatic branching + **Supabase changes only**. Notion remains a projection sink and can fail or retry independently without blocking code landing or production proof.

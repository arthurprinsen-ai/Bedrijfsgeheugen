# Terminalizer Supabase migration-history lock evidence v1

The post-merge terminalizer for migration-history parity failed after the underlying delivery was already proven correct.

## Root cause

`supabase/migration-history.lock.json` is a verifier/ledger artifact. The terminalizer treated it as a generic non-governance runtime path, then correctly found no Netlify deployment, Supabase Edge Function or executable SQL migration associated with that JSON file and failed with `UNWIRED_NON_NETLIFY_RUNTIME_READBACK`.

## Structural fix

The canonical `brain/contracts/production-readback-v1.json` now lists exactly `supabase/migration-history.lock.json` as a verifier-only path.

This does **not** widen `supabase/` or `supabase/migrations/`. Executable `supabase/migrations/*.sql` files still require explicit provider `APPLIED` evidence and unknown backend paths remain fail-closed.

A regression in the existing terminalizer governance suite protects both sides of that boundary.

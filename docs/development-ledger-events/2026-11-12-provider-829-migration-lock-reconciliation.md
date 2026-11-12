# Provider-backed Supabase migration 829 parity — 12 november 2026

Parent: #4198. Original Supabase history writer, no new scheduler/DDL executor.
The production Supabase project `adhjwmvyoixzjtmiroln` has **829 actual applied migration records**, with newest version `20261112144500` and provider name `original_social_legacy_alias_acks_v1`. The original GitHub immutable `supabase/migration-history.lock.json` on main had only 828 and ended at `20261112140500`. Actual SQL `supabase/migrations/20261112144500_original_social_legacy_alias_acks_v1.sql` is already on protected main.

Unrelated SEO PR #5643 correct Required gate had detected exactly one local executable SQL not covered by original provider lock. This is not an SEO code/website failure. This correction **only appends the provider-confirmed identity** and original captured_at, preserving 828 prior records and exact order. No migration re-executed; no preview invented; no security/RLS modifications.

Original owner workflow: protected Required/CodeQL and provider lock readback -> merge current main -> original PR #5643 safely sync main -> full site/browser Required/CodeQL -> Netlify exact production SHA -> original ONE BRAIN consumer processing receipt, Powerhouse, Heartbeat, Portal. A GitHub green state does not imply full business loop success.

Prevention: recognize the lock lag as original migration source parity obligation, append only authenticated provider state, keep open until main and downstream source checks agree.

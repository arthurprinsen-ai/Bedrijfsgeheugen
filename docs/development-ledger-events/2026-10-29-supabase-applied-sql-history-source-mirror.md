# Development ledger — 2026-10-29 Supabase remote migration source mirror

Obligation: `delivery|supabase-preview|remote-applied-sql-missing-in-main|20261029`.

Action: copied the original statements of exactly three provider-applied migration version identities into the existing GitHub `supabase/migrations` directory. No SQL was applied to production, no schema/history rewrite, no scheduler or new DB created.

Evidence: independent Supabase migration registry and `statements[1]` readback; actual file checksum checks; `md5=014b86182dfd2f5493f545e4ec51f741` for the two identical already applied source texts. Additional local-only historical migration `20261028220000` remains recognized as open source-vs-provider divergence.

Release: protected candidate; not live or overall green until exact-main GitHub/Netlify/Preview provider readbacks. Original failure is not retroactively rewritten.

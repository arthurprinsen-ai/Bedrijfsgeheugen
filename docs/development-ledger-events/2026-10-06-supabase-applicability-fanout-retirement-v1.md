# Development ledger event — Supabase applicability fan-out retirement v1

- Date: 2026-10-06
- Obligation: `supabase-applicability-fanout-retirement-20261006-v1`
- Decision: retire the standalone all-PR Supabase applicability runner after its exact-head provider verification became part of the canonical protected Required test.
- Safety: strict branch protection remains enabled; provider proof remains fail-closed for database-relevant Supabase changes.
- Expected effect: one fewer GitHub Actions workflow run on every pull request.

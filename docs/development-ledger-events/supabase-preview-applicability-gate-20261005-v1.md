# Development ledger — Supabase Preview applicability gate

- Date: 2026-10-05
- Obligation: supabase-preview-applicability-gate-20261005-v1
- Trigger: PR #3765 had every repository-owned exact-head gate green but remained merge-blocked because provider-owned `Supabase Preview` was `skipped` on a non-Supabase change.
- Structural correction: introduce an always-running repository-owned applicability check and keep hosted Supabase Preview as conditional provider evidence only for `supabase/**` changes.
- Safety: no fabricated check, no fake Supabase file change, no branch-protection bypass, exact-head provider identity required.

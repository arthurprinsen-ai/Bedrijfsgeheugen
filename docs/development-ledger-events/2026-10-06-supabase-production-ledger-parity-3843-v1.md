# 2026-10-06 — Supabase current production-ledger parity

- Obligation: `supabase-production-ledger-parity-3843`.
- Original source merge: PR #3843 at `47e36a513757c230ca6305a06a3724338fea047d`.
- Canonical recovery candidate: PR #3870.
- Initial recovery snapshot: 583 production migration identities through `20261006095958`.
- Current production readback: 591 migration identities through `20261006103856`.
- Repository recovery: 20 exact historical production mirrors in total, including the eight LinkedIn organization-OAuth migrations applied after the original #3843 snapshot.
- Security invariant: historical mirror exemptions are path + exact Git blob SHA bound; any edit falls back to normal fail-closed checks.
- Preview invariant: provider Preview may be skipped only for an all-mirror database delta proven against the exact-blob registry. Any ordinary database source change still requires provider proof.
- History invariant: `migration-history.lock.json` has `applied.length = production_ledger_count = 591` for the current production ledger.
- Recurrence invariant: future Supabase production promotion belongs to protected `main`; direct production-only lineage is forbidden.
- Closure state in this file: candidate evidence only; TERMINAL_GREEN still requires current exact-HEAD gates, protected auto-merge, and post-merge production/readback parity.

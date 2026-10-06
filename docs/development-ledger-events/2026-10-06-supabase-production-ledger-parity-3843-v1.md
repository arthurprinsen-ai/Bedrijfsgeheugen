# 2026-10-06 — Supabase production-ledger parity for #3843

- Obligation: `supabase-production-ledger-parity-3843`.
- Source merge: PR #3843 at `47e36a513757c230ca6305a06a3724338fea047d`.
- Canonical recovery candidate: PR #3870.
- Bound production snapshot: 583 migration identities at `2026-10-06T10:16:08.000Z`; latest included version `20261006095958`.
- Repository recovery: restore twelve already-applied production statements missing after the three migrations already present on the #3843 merge tree.
- Security invariant: historical mirror exemptions are path + exact Git blob SHA bound; edits fall back to normal fail-closed checks.
- Preview invariant: provider Preview may be skipped only for an all-mirror database delta proven against the exact-blob registry. Any ordinary database source change still requires provider proof.
- History invariant: `migration-history.lock.json` has `applied.length = production_ledger_count = 583` for this obligation snapshot.
- Scope boundary: production migrations later than the #3843 snapshot are excluded and must not move this recovery target.
- Closure state in this file: candidate evidence only; TERMINAL_GREEN still requires current exact-HEAD gates, protected auto-merge, and post-merge readback.

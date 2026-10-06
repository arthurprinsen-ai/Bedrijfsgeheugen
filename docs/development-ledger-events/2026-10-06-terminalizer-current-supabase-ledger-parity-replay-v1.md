# 2026-10-06 — Terminalizer current Supabase ledger parity replay

Obligation: `github-terminalizer-current-supabase-ledger-parity-replay-3899`

Observed:
- PR #3899 protected-merged at `dddc30c5f0d6efa4c1cd88b86d3fa454b11bf342`.
- Git lock and direct Supabase production readback both resolve to 591 applied migrations.
- Latest production migration is `20261006103856_linkedin_company_live_proof_state_canonical_v3`.
- Post-merge terminalizer failed at `UNWIRED_NON_NETLIFY_RUNTIME_READBACK`.

Root cause:
- migration-history recovery mode was selected only for legacy obligation IDs matching `supabase-migration-history-(parity|canonical)-...`;
- the canonical obligation uses `supabase-current-production-ledger-parity-...`;
- safe migration/history-only paths therefore fell through to generic runtime classification.

Implemented:
- recognize the current-production-ledger parity obligation family as the existing bounded `supabase_history_parity_recovery` mode;
- preserve the existing exact recovery-path allowlist and fail closed if any runtime path appears;
- add regression coverage;
- replay terminalization of merged PR #3899 after protected merge of this controller.

Production effect:
- none. This is control-plane classification and terminal evidence recovery only.

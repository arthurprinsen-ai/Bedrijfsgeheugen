# Terminalizer current Supabase ledger parity replay

PR #3899 merged the canonical 591-entry Supabase migration ledger into main at `dddc30c5f0d6efa4c1cd88b86d3fa454b11bf342`. Direct production readback confirms 591 applied migrations with latest version `20261006103856_linkedin_company_live_proof_state_canonical_v3`.

Post-merge terminalization failed with `UNWIRED_NON_NETLIFY_RUNTIME_READBACK` even though the merged delta contains only migration-history recovery paths and verifier/control-plane files. The terminalizer recognized only the older `supabase-migration-history-(parity|canonical)-...` obligation family and therefore did not select its existing `supabase_history_parity_recovery` mode for the canonical `supabase-current-production-ledger-parity-...` obligation.

This change extends only that obligation-family classifier. The existing strict recovery-path allowlist remains authoritative, so any runtime path still fails closed. After protected merge, `Terminal-Replay-PR: 3899` re-runs terminalization against the immutable merged target. No production SQL, schema mutation, migration-history mutation, or runtime deployment is performed by this controller PR.

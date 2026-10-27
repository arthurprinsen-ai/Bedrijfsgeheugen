# 2026-10-07 — Terminalizer Supabase migration readback

- Source PR: #4049, merge SHA `a05518bdbd6ae348a9ab9f84a9695199bf6ef968`.
- Failed terminalizer run: `37607393435`.
- Failure: `UNWIRED_NON_NETLIFY_RUNTIME_READBACK` on `supabase/migrations/20261007101156_close_current_set_provider_errors_v1.sql`.
- Direct Supabase readback: migration version `20261007101156` is applied.
- Fresh runtime readback 10:27–10:38 UTC: 0×401, 0×500, 0×503, 0×522.
- Latest durable commercial heartbeat observed during repair: 10:37:06 UTC, VERIFIED, 100% terminal coverage, `NETLIFY_SUPABASE_EDGE` scheduler authority.
- Structural fix: timestamped migration files get a dedicated provider-readback class; every changed migration requires exact machine-readable APPLIED evidence.
- Safety: no migration path becomes verifier-only; missing markers and unknown runtime paths still fail closed.
- Replay target after protected merge: PR #4049.

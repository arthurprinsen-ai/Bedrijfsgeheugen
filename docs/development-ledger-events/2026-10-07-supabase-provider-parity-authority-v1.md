# 2026-10-07 — Supabase production authority recovery

- Source runtime PR: #4025.
- Source merge: `c56d46c851ef4963cd33da995c077eb4ddafe820`.
- Failed authority run: `37575776430`.
- Failure: `SUPABASE_PRODUCTION_DEPLOYMENT_ANCHOR_NOT_FOUND`.
- Provider reality: affected Edge Functions were ACTIVE with new provider versions/hashes while the GitHub Supabase check was still timing-sensitive and later skipped.
- Terminalizer failure: `config/powerhouse-runtime-backpressure-v1.json` was classified as unknown runtime.
- Recovery: provider source parity becomes canonical, GitHub check becomes non-blocking, replay targets are runtime-equivalence guarded, provider evidence can write back to #4025, and the exact config contract becomes verifier-only.
- No database DDL, runtime function code change, secret rotation, or branch-protection weakening.

# 2026-10-06 — Supabase parity terminalizer classifier

- Source: merged PR #3899, merge SHA `dddc30c5f0d6efa4c1cd88b86d3fa454b11bf342`.
- Production readback: 591 migrations, latest `20261006103856`.
- Repository lock readback: 591 migrations, same latest version.
- Escaped defect: terminalizer run `37462294980` failed with `UNWIRED_NON_NETLIFY_RUNTIME_READBACK`.
- Root cause: obligation-family matcher did not include `supabase-current-production-ledger-parity-*`.
- Fix: explicitly recognize legacy migration-history parity/canonical plus production-ledger parity and current-production-ledger parity.
- Guardrail: runtime function paths remain outside the parity recovery allowlist.

# 2026-10-07 — Supabase provider runtime-file parity recovery

- Obligation: `supabase-provider-runtime-files-parity-20261007-v1`
- Base main: `6f476f028ca7e95d44c8043df1469c931b703c4b`
- Production deployment: provider check green; affected Edge Functions ACTIVE.
- Blocking readback: `supabase-migration-repair-bridge` repository files = `index.ts` + `deno.json`; provider download files = `index.ts`.
- Root cause: raw repository fileset equality conflated local deploy metadata with provider-returned runtime source.
- Structural correction: immutable Git identity still includes all files; provider byte parity excludes `deno.json` metadata symmetrically and compares runtime source only.
- Bounded convergence, runtime-supersession guard, provider version/runtime hash evidence and merged-PR writeback remain fail-closed.
- Regression authority: `tests/brain-supabase-production-authority-integrity-v1.test.mjs`.
- Next proof: exact-HEAD Required + CodeQL → protected squash merge → Supabase provider replay/writeback to #4025 → terminalizer replay → fresh runtime error readback → canonical commercial heartbeat durable readback.

# 2026-10-08 — Portal auth learning canonicalization

- Failure: `Powerhouse Skill Projection` rejected Portal-auth learning evaluation paths.
- Canonicalizer rule: evaluation tests must be existing `tests/brain-*.test.mjs` files.
- Security-sensitive rule: historical replay, shadow and canary are all mandatory.
- Fix: one dedicated Brain test now verifies Identity boundary, tenant derivation, EU service-token gateway, privileged Supabase authority and production proof assertions.
- Updated learning: `2026-10-07-portal-authenticated-production-503-serverless-env-v1.json`.
- Updated learning: `2026-10-08-portal-authenticated-production-supabase-edge-gateway-v1.json`.
- Runtime impact: none.
- Production proof remains `PROVEN` on merge SHA `1a5f661314c6ae7a10f33995b30e129a994e8883`, Netlify deploy `6ac72f87b10d420008cb7441`.

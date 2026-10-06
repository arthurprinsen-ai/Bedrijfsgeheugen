# Netlify build acceleration v1 — 2026-10-06

## Proven bottleneck
A measured Required website build spent about 69 seconds in the deterministic Netlify build. Dependency installation was about 3 seconds; static localized-route generation alone consumed about 19 seconds. Historical runs also contained multiple copies of the same build pipeline.

## Structural change
- Production, deploy-preview, Required parity and exact-local browser fallback now call one canonical runner: `tools/ci/run-netlify-build.mjs`.
- The runner emits `.artifacts/netlify-build-profile.json` with per-step duration and the exact build context.
- Static localized routes use deterministic modulo sharding with a default of two workers and a hard cap of four.
- Required publishes an immutable build artifact keyed by candidate SHA.
- When provider preview is unavailable, the browser lane waits boundedly for that exact artifact and reuses it. A local rebuild is only the final fallback.
- No production deployment transport is switched to prebuilt mode here. The current OIDC/MCP transport uploads to Netlify's build endpoint; direct prebuilt production promotion must only be enabled through an explicit least-privilege `--no-build` transport contract.

## Safety
Exact candidate identity, translation-cache fail-closed behavior, Netlify Functions configuration, release evidence and all existing artifact tests remain intact.

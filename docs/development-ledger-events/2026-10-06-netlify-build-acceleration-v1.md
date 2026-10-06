# Development ledger — Netlify build acceleration v1

- Date: 2026-10-06
- Obligation: `netlify-build-acceleration-20261006-v1`
- Baseline: measured deterministic build ≈69s; static i18n route generation ≈19s; dependency install ≈3s.
- Build authority: `tools/ci/run-netlify-build.mjs`.
- Parallelism: deterministic route shards, default 2, hard cap 4.
- Reuse: `netlify-build-reuse-<candidate-sha>` is consumed by exact-local browser fallback before any duplicate rebuild.
- Observability: `netlify-build-profile-<candidate-sha>` retained for 14 days.
- Production prebuilt transport: intentionally not enabled until the OIDC bridge exposes an explicit authenticated no-build deploy path.
- Regression: `tests/brain-netlify-build-acceleration-v1.test.mjs`.

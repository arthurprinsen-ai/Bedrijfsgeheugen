# Development ledger — Netlify build artifact reuse v1

- Date: 2026-10-06
- Obligation: `netlify-build-artifact-reuse-20261006-v1`
- Measured build: about 69 seconds in a representative exact Netlify parity run.
- Measured hot phase: static localized-route rendering about 19 seconds.
- Prior waste: deterministic build output was proven before merge and then recomputed during production promotion.
- Authority: `tools/ci/netlify-build-entry.mjs`.
- Reuse identity: exact Git tree SHA, successful same-repository Required run, manifest contract and archive SHA-256.
- Production safety: existing OIDC/bridge + Netlify Build API remains the transport; Functions/Edge packaging is not bypassed.
- Failure behavior: any missing or invalid artifact yields safe full-build fallback, never unverified deployment.
- Regression: `tests/brain-netlify-prebuilt-artifact-reuse-v1.test.mjs`.

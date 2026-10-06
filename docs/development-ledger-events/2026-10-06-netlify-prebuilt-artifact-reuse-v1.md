# Development ledger — Netlify prebuilt artifact reuse v1

- Date: 2026-10-06
- Obligation: `netlify-prebuilt-artifact-reuse-20261006-v1`
- Measured historical exact build: about 69 seconds; localized-route generation alone consumed about 19 seconds.
- Change: one canonical build runner for Required and Netlify contexts.
- Change: offline localized-route work is bounded to two independent shards.
- Change: Required emits a short-lived prebuilt workspace artifact keyed by source Git tree SHA.
- Change: production reuses only an exact tree match and restamps commit/deploy identity inside Netlify.
- Safety: artifact absence, expiry, parse failure or tree mismatch falls back to the existing canonical source build.
- Regression: `tests/brain-netlify-prebuilt-artifact-reuse-v1.test.mjs`.

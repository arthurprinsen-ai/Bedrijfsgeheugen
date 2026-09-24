# 2026-09-24 — Netlify linked-build skip fallback

- Fingerprint: `netlify-linked-build-skip-fallback-v1`
- Canonical workflow: `.github/workflows/production-source-snapshot.yml`
- Observed auth recovery: OIDC acquisition 200; linked trigger `ok=true`.
- Netlify build: `6ab5778870bdf4ced1a53687`.
- Netlify deploy: `6ab5778870bdf4ced1a53689`.
- Provider terminal state: `error / Skipped`.
- Root cause: workflow exited before its own direct MCP fallback.
- Fix: linked-build error/timeout falls through to the authorized direct MCP transport.
- Regression: `tests/brain-netlify-linked-build-fallback-v1.test.mjs`.
- Terminal state remains pending protected merge + exact production/provider/browser readback.

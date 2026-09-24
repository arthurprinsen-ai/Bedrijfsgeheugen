# 2026-09-24 — Pricing build integrity parse error

- Fingerprint: `pricing-build-integrity-regex-syntax-20260924-v1`
- Failed production SHA: `0dc124fc2467641ad4c04f6a8ecbfad515b411e1`
- Netlify deploy: `6ab534bd62dd9930cdd76bd8`
- Netlify build: `6ab534bd62dd9930cdd76bd6`
- Provider auth: success
- Build stage: failure
- Root cause: JavaScript parse error in `tools/site-shell/pricing-build-integrity.mjs`
- Fix: replace invalid single-quoted regex strings with template literals.
- Prevention: syntax-check all Node scripts referenced by Netlify build command.
- Terminal state: pending protected merge and production readback.

- Follow-up: CI regression exposed a second parse error in over-escaped regex literals.
- Follow-up fix: replace the affected literals with explicit RegExp constructors.
- Learning revision: 2.

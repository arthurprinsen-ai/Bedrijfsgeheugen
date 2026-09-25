# 2026-09-25 — pricing build-oracle context parity v1

- Netlify transport/OIDC: groen.
- Exact production build: exit code 2.
- Root cause reproduced before i18n: stale pricing context oracle.
- Canonical context: `Wat wil je bereiken?` + `Ondernemersdoelen`.
- Remaining regression drift: `tests/saas-pricing-entitlements.test.mjs` still required `Belangrijkste doel nu`.
- Fix: align stale regression, persist Brain learning, document prevention, project into continuity skill.
- Terminal proof required: protected merge → current main → Production Source Snapshot deploy=true → Netlify production exact SHA → pricing/NL↔EN browser readback.

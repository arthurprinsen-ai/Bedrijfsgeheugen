# 2026-09-24 — Exact-main production snapshot refresh

- Obligation: `production-snapshot-refresh-fe158-v1`
- Candidate type: promotion
- Target main before promotion: `fe158b794b10cdea5c45c281f9669dc642854467`
- Reason: Netlify production lagged behind deployment-relevant pricing build-transform changes.
- Changed product behavior: none.
- Canonical trigger: `.github/workflows/production-source-snapshot.yml`
- Required closure: protected merge → exact-SHA Netlify deploy → release/provider readback → pricing/i18n browser proof.
- PR: #2846

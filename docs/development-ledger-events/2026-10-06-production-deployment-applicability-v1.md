# Development ledger — canonical production deployment applicability

- Date: 2026-10-06
- Obligation: production-deployment-applicability-20261006-v1
- Escaped defect: Production Source Snapshot deployed on non-Netlify main changes because its push admission was broader than Production Release Readback applicability.
- Evidence: run 37470438032 failed after three 401 exact-source transport attempts for a CI risk-policy-only commit; run 37471619096 also ran Snapshot for a Supabase-only main change.
- Root cause: duplicated deployment-applicability truth across workflow trigger/inline logic.
- Fix: one shared `production-deployment-applicability.mjs` authority consumed by Snapshot and Readback.
- Safety: manual deploy remains available; website/portal/Netlify runtime changes remain deployment-required and exact-SHA fail-closed.
- Regression: `tests/brain-production-release-readback-scope.test.mjs`.

# 2026-09-25 — control-plane production trigger ownership v1

- Fingerprint: `delivery|production-trigger|control-plane-path-ownership|v1`
- False-positive runs: Source Snapshot `36173599723`, Release Readback `36173599820`, Canonical shell readback `36173599678`.
- Root cause: incomplete workflow-level production `paths-ignore`.
- Fix: exclude `AGENTS.md`, `brain/policies/**`, `tools/delivery/**`, and `tools/site-shell/verify-targeted-website-routes.mjs` from production push triggers.
- Validation remains in protected PR Required/automation/browser suites.
- Regression: `tests/delivery-ci-trigger-budget.test.mjs` and `tests/brain-control-plane-production-trigger-ownership-v1.test.mjs`.
- Runtime-bearing paths remain production-triggering and fail-closed.

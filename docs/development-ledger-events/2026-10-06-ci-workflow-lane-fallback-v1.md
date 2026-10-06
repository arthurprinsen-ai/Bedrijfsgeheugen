# Development ledger — CI workflow lane fallback

- Date: 2026-10-06
- Obligation: ci-workflow-lane-fallback-20261006-v1
- Problem: generic `.github/workflows/` shared-path classification activated website/browser for non-website workflow changes.
- Change: explicit workflow ownership remains authoritative; unmapped workflow definitions default to backend control-plane only.
- Safety: website-specific workflow paths still select the website lane; unknown non-workflow paths remain fail-closed.
- Regression: `tests/brain-change-scoped-release-lanes.test.mjs`.

# Development ledger — writer control-plane lane ownership v1

- Date: 2026-10-06
- Observed: PR #3963 was R1 delivery-control-plane work, but legacy lane classification started backend, portal and website alongside automation.
- Root cause: unscoped workflow definitions matched the executable shared `.github/workflows/` prefix, which enables every lane.
- Fix: explicit automation ownership for all canonical repository-writer workflows.
- Regression: `tests/brain-change-scoped-release-lanes.test.mjs` proves each writer workflow and the complete writer bundle stay automation-only.
- Safety: website/backend/portal runtime paths retain their existing lane mappings and fail-closed classification.

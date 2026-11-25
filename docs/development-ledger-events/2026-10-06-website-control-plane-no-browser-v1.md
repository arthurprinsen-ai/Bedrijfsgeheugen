# Development ledger — website control-plane browser scope v1

- Date: 2026-10-06
- Obligation: website-control-plane-no-browser-20261006-v1
- Failure class: CI over-classification / unnecessary browser fan-out
- Root cause: `.github/workflows/` was globally listed as a high-risk website artifact.
- Fix: treat workflow YAML as non-artifact control plane in website release-risk classification.
- Preserved: baseline + syntax-preflight for control-plane changes; full preview/browser validation for real website artifacts.
- Regression: `tests/brain-website-control-plane-browser-scope-v1.test.mjs` and `tests/site-shell-website-release-risk.test.mjs`.

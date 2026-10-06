# CI workflow lane fallback — 2026-10-06

Generic GitHub workflow-definition changes no longer fan out into every product lane.

The delivery classifier now preserves explicit workflow ownership first. If a future `.github/workflows/*` file is not explicitly mapped, it falls back to the backend control-plane lane instead of becoming shared executable work. Explicit website workflows still activate website verification.

Regression coverage includes the `powerhouse-ci-intelligence.yml` pattern observed after PR #4005 and an unmapped future workflow, proving that website/browser execution remains off for non-website workflow changes.

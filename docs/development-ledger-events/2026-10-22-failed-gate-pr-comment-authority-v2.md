# Development ledger — watchdog PR-comment write authority, 2026-10-22

- Event: `FAILED_GATE_OWNER_ROUTING_PROVIDER_RBAC_RECOVERY`
- Existing obligation: `delivery|failed-gate|watchdog-observation-only|20261022-v1`
- Related distinct platform failure: `github|actions|failed-gate-pr-comment-resource-denial|20261022-v1`
- Exact predecessor: PR #4660, merged at main `01af9f2a05794a170cd3fd63013db75a33e76268`
- Provider evidence: [Required Gate Watchdog #39811993147](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39811993147), job `119940435969`, GitHub 403 on `/issues/4656/comments`
- Effective permissions at failure: `Issues: write`, `PullRequests: read` (runner setup log)
- Partial authorized side effect already proven: Required test dispatch #4662; do not redispatch duplicate
- Hypothesis: GitHub PR-specific comment endpoint requires `pull-requests: write` for workflow installation token
- Narrow correction: same scheduled `.github/workflows/required-gate-watchdog.yml` adds `pull-requests: write`, keeps `issues: write`, and executes the existing five-case regression before operational routing
- Regression: `tests/brain-required-failed-gate-owner-routing-v1.test.mjs`
- Canonical learning: `brain/learning/2026-10-22-failed-gate-owner-routing-v1.json` updated in place (same fingerprint)
- Additional scheduler, new incident DB, bypass, silent failure, ACL weakening, consumer PII, duplicated source agent: **none**
- Completion: PENDING exact-head Required and CodeQL then protected merge then real current-main GitHub owner-comment readback. 403 will remain a hard provider boundary if permission change does not resolve it.

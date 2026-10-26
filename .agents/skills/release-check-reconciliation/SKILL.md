# Release Check Reconciliation v2 — canonical recovery lane

Owner: #4929. Fingerprint: `github|required-status-expected|context-source-sha`.

The reconciler is an advisory, fail-closed diagnostic, not a required check of its own and never a status publisher. Run it AFTER Required/CodeQL terminate and BEFORE any protected merge. It must inspect the exact candidate or merge-group SHA; PR source HEAD alone is not merge proof.

Invoke `GITHUB_REPOSITORY=owner/repo RELEASE_BASE_BRANCH=main RELEASE_CHECK_SHA=<40-char-SHA> node tools/delivery/required-check-reconciliation.mjs`.

Read the effective branch rules (`/rules/branches/main`, including applicable inherited rulesets) and branch-protection contexts plus Check Runs and Commit Statuses on that exact SHA. Compare every required context and permitted App integration ID. API failure, denied access, truncated pages, ambiguous producer, or SHA mismatch is UNKNOWN/BLOCKED; never infer PASS from green workflow badges or PR-level summaries. A PASS from the reconciler remains advisory until GitHub's native protected merge succeeds.

Only the existing authorized Recovery Supervisor owns write, lease/CAS, bounded rerun and branch synchronization. Do not revive retired #4933, reuse released #4941 lease, create replacement PR churn, bypass protection, force push, synthesize status, or start another scheduler. Rerun only an actually failed or cancelled authoritative run on the same SHA, within the canonical retry budget. App/context configuration changes require an administrator with sufficient rights.

A candidate merge and production completion demand independent exact-head Required, BRAIN, CodeQL, native protected merge receipt, merged-main SHA, and applicable production readback. Do not require a Netlify deployment for a proven governance-only change; preserve the release applicability contract.

Regression: `node --test tests/required-check-reconciliation.test.mjs`. Update one canonical incident/Brain learning record, not duplicate closure claims.

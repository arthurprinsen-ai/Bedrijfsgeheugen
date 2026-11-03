# 2026-11-03 — Janitor archive HTTP403 partial failure (candidate)

Incident: [#5333](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5333). Existing owner: Powerhouse Repository Janitor. Parent: #5320.

## Native observation
The original apply-safe runs [41528932134](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41528932134) and [41546047078](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41546047078) each logged three HTTP 403 `Resource not accessible by integration` responses to `POST /git/refs` when creating archive tags for two automation branches and one backup branch. The native sweep result was archived=0, deleted=0, failed=3 while the job conclusion was `success`. Permission denial itself remains unexplained; current workflow already requests contents:write and public repository ruleset listing is empty, which is not proof all effective token/tag policies allow writes.

## Original corrective behavior
- `tools/ci/branch-archive-sweep.mjs` writes machine-readable per-branch phase, failure category, source run/SHA and counters without dumping provider details or credentials.
- The original archive job returns exit 78 for any failed provider operation. Remove the swallowing `|| echo`; `if: always()` preserves evidence even when job fails.
- Do not remove unique work unless the tag was created or already exists and an exact-SHA tag readback succeeded. Keep three-strike circuit breaker and bounded scope.
- Do not grant broader credentials, change protected checks, create a second scheduler or claim all green.

## Separate unresolved debts
19 terminal-lease PRs remain fail-closed pending complete successor-history evidence. Four original provider orphan runs (37642383514, 37642383517, 37642336315, 37642334843) remain queued with 0 jobs and 409 cancellation, and provider DELETE 403; provider-support reconciliation is required. Supervisor drift observations are counts of unresolved observations, not completed repairs.

## Verification
Historical replay and shadow/canary: `tests/brain-branch-archive-sweep.test.mjs`. Require exact-head Required + CodeQL + full BRAIN, protected merge, new original scheduled Janitor, preserved artifact, provider tag readback or truthful 403; independent Brain/portal evidence before status resolution. Until then PATCH_CANDIDATE_NOT_LIVE.

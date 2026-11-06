# 2026-11-06 — append-only weekly cron recovery event

- Fingerprint: `powerhouse|health-weekly-cron-cadence-aware|20261106-v1`.
- Historical PR: #4639, draft and unmergeable; provider branch check skipped: `PREVIEW_BRANCH_UNASSOCIATED`.
- Observed production evidence: weekly 0 6 * * 1; 6 Nov warning for successful 2 Nov run; canonical function and role ACL remain intact.
- Proposed source: original function replacement on current main; new migration version 20261106144500_weekly_cron_health_cadence_original_function_v1.sql.
- Negative tests: failed/no-run, overdue weekly, unchanged daily/non-weekly thresholds, security/ACL readback, no duplicate job; no provider-output inference.
- Status: CODE_CANDIDATE awaiting protected CI, provider preview and production proof.

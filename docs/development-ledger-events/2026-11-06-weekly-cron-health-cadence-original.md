# 2026-11-06 — append-only weekly cron recovery event

- Fingerprint: `powerhouse|health-weekly-cron-cadence-aware|20261106-v1`.
- Historical PR: #4639, draft and unmergeable; provider branch check skipped: `PREVIEW_BRANCH_UNASSOCIATED`.
- Observed production evidence: weekly 0 6 * * 1; 6 Nov warning for successful 2 Nov run; canonical function and role ACL remain intact.
- Proposed source: original function replacement on current main; new migration version 20261106144500_weekly_cron_health_cadence_original_function_v1.sql.
- Negative tests: failed/no-run, overdue weekly, unchanged daily/non-weekly thresholds, security/ACL readback, no duplicate job; no provider-output inference.
- Status: CODE_CANDIDATE awaiting protected CI, provider preview and production proof.

- 2026-11-06 14:47 UTC initial Required admission blocked by `BLOCKED_LINEAGE_AMBIGUOUS` with blocker #4639 while that old PR was still open at the start of the run. The original PR was then closed as explicitly superseded (unmerged). This same candidate is now the one authoritative current-main fix; the next distinct head must rerun original Required and Supabase Preview. Do not bypass gate or force CI outcome.

- 2026-11-06 14:49 UTC second Required admission was BLOCKED_LINEAGE_AMBIGUOUS because `Supersedes: 4639` explicitly reintroduced the already-closed historical predecessor into machine arbitration. Existing documented control-plane rule requires `Supersedes: none` when predecessor is closed/non-authoritative; updated PR metadata accordingly, without hiding the historical link in prose. Recheck on fresh immutable head. Preview project jlyzyselxxclcnqvmnxy is GitHub-attached to PR #5497; preview migration history contains exact version 20261106144500 and observed function definition contains weekly-cadence branch, but initial provider workflow signaled a duplicate migration-key error and status must still become SUCCESS before merge.

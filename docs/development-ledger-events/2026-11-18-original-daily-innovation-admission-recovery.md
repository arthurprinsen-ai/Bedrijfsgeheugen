# 2026-11-18 — original daily innovation cycle blocked by recovery misclassification

- Parent incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Existing original workflow: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/workflows/powerhouse-daily-self-evolution.yml
- Native old recovery: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/44256002607 — bounded original_delivery_recovery success; daily-admission/improve/model-freshness skipped.
- Native daily failure: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/44256077963 — genuine original daily run rejected by own admission with `DUPLICATE_DAILY_RUN_SUPPRESSED` and `prior_run_id=44256002607`; other daily jobs skipped.
- Root cause: the existing source selector relied only on top-level run history, not trustworthy job-level workflow scope. A recovery readback was falsely considered a full daily implementation.
- Existing Supabase self-improvement cron #107 at 2026-11-18T03:02:00Z succeeded with quality OWNER_HANDOFF_PENDING, therefore did not prove any actual autonomous build.
- Source repair: exact historical native GitHub job receipt read-only and restrictive 6-job classifier; only proven limited recovery is ignored by daily admission, while genuine/unknown daily runs still suppress duplicates. No alternative executor, sender or schedule.
- Required acceptance: unchanged 1 GitHub schedule, read-only token, real same-day replay, persistent original 14/14 Brain source identities, Required+CodeQL on protected exact SHA, merge, postmerge original daily job result readback. Until then candidate not live.
- Tests: `tests/brain-daily-learning-run-admission-v1.test.mjs`, covering actual false duplicate, all bounded recovery lanes and fake/missing data vetoes.
- Semantic learning: `brain/learning/2026-11-18-scoped-recovery-daily-admission-false-duplicate-v1.json`.
- Rollback: protected revert of changed original script/tests/learning/skill; no original Brain data erased or modified by this source-only PR.

## Same-PR refinement — a daily run stopped before all side effects is recoverable once

- Original 18 Nov daily run https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/44256077963 had read-only `daily-admission` FAILURE and **all other five jobs SKIPPED**. It performed no Engineering, learning or model execution. Its earlier-failed-run veto would otherwise permanently lose today's genuine daily opportunity.
- Add source-proven `isProvenPreExecutionAdmissionAbort` from exact original six-job native response. Permit ONE retry of an abort with `daily-admission` failed and every other original job completed SKIPPED, with either schedule or workflow_dispatch event and main branch. A genuine daily that progressed past admission, even if its later work failed, **continues to block duplicate daily execution**. Two or more admission aborts fail closed (`PRE_EXECUTION_RETRY_BUDGET_EXCEEDED`). Native readback unknown or partial fails closed.
- Regression extends the existing exact historical 18 Nov run IDs and one-retry budget. Normal original cron and shared concurrency unchanged. Postmerge fresh daily required for verified live execution.

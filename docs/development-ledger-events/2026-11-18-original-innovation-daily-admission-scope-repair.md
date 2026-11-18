# 2026-11-18 — Original innovation missed daily execution due scoped recovery misclassification

- One original canonical workflow: `.github/workflows/powerhouse-daily-self-evolution.yml`; original issue https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Native targeted original recovery https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/44256002607: successful, 14/14 source-bound original Brain stage receipts; original daily and Codex jobs were **skipped**.
- Immediate later intended full daily https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/44256077963: daily-admission failed exit 78 with `DUPLICATE_DAILY_RUN_SUPPRESSED`, erroneously citing targeted recovery as first daily. All five downstream workers skipped and no external action executed.
- Root cause: only top-level GitHub `workflow_runs` status/event/time was examined; native job-level evidence of scoped recovery versus admitted full daily was ignored.
- Source repair: exact native earlier /actions/runs/{id}/jobs?per_page=100 job proof; distinguish recovery, unadmitted-no-effects and genuine daily. Fail closed on unknown job evidence, retain existing concurrency and no double-send/PR/scheduler safety.
- Regression paths: `tests/brain-daily-learning-run-admission-v1.test.mjs` and `tests/brain-innovation-daily-scoped-recovery-fence-20261118.test.mjs`.
- **Not complete until** protected exact-head Required+CodeQL, current-main merge, a real original daily run admitted with downstream original agent execution and original ONE BRAIN/provider outcome readback. No partial status called green.
- Rollback: protected revert of daily-run admission helper and tests without modifying persistent original obligations.

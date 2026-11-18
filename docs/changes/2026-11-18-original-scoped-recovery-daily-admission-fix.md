# 18 November 2026 — limited innovation recovery must not consume the real daily innovation cycle

**Canonical original incident:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Independently observed original runtime defect

The original daily Self Evolution workflow schedules once per day (`47 4 * * *` UTC), while existing original Supabase cron #107 independently evaluates self-improvement source quality at `2 3 * * *`. The 18 November cron succeeded, but the corresponding `self_improvement_cycle` event was `OWNER_HANDOFF_PENDING`. It does **not** prove Engineering built or deployed anything.

At 07:04:10 UTC the **existing bounded** `original_delivery_recovery` branch of that *same* GitHub workflow succeeded: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/44256002607 . Native GitHub job evidence showed `original-delivery-recovery` **success**, with the real `daily-admission`, `improve`, `model-freshness` and other recovery jobs **skipped**. This run only reconciles the 14 original Brain delivery readbacks.

At 07:04:47 UTC, the real daily `execution_scope=daily` attempt https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/44256077963 incorrectly failed early as `DUPLICATE_DAILY_RUN_SUPPRESSED` (exit 78) citing the limited recovery above. The original admission script relied solely on workflow-run event/date/status and never inspected job-level evidence. Therefore it treated source readback as a fully executed daily innovation cycle and left Engineering, model-freshness and learning **skipped**. No source/permission mismatch or provider delivery was proven.

## Protected same-lineage correction

Change **only** `tools/delivery/daily-learning-run-admission.mjs`, preserving the same daily Github workflow and shared concurrency. When earlier same-day manual dispatches exist, read their native GitHub REST `actions/runs/{id}/jobs?per_page=100` receipt using the workflow's already-authorized read-only `GH_TOKEN`. Exclude a run from daily admission only if the complete, exact six-job original workflow structure proves:

- `daily-admission`, `improve` and `model-freshness` all truly completed **skipped**.
- Exactly one authorized recovery path (`original-intake-recovery`, `original-innovation-code-candidate`, `original-delivery-recovery`) was actually selected; its success/failure/cancelled/timed-out outcome does not make it a daily cycle.
- The other two recovery paths completed **skipped**.
- The preceding event was `workflow_dispatch` on the same `main`, never `schedule`.

**Fail closed** on missing API data, more than a full provider page, duplicate/unknown job names, partial/forged receipts, daily-admission not skipped, or an earlier actual daily run (even failed). Once a real daily was admitted, suppress later true daily attempts for that UTC date unchanged. No fallback token, new cron, second agent, publisher, table, queue or elevated permissions.

## Test, release and effect

The existing `tests/brain-daily-learning-run-admission-v1.test.mjs` gets real native 18 November historical replay and negative tests for all three scoped lanes, in-progress or failed daily, source pagination, exact job structures, and no new scheduler. Original entry point and mandatory daily admission remain unchanged. Protected Required/CodeQL + exact SHA merge + a **real post-merge daily workflow run** must prove `FIRST_DAILY_RUN_ADMITTED` after an earlier limited recovery before calling this corrected gate live. A passing node test or merged PR is not proof that a new code innovation was built, any customer was contacted, or a business effect was measured. The 14 original INNOVATION_DELIVERY obligations remain OPEN until independent original consumer, production and Heartbeat effect evidence exists.

## One bounded safe recovery after a pre-execution admission abort

A second, independent safety failure was verified in the same incident: once the real 18 November daily run had failed the admission read-only gate, its `daily-admission` job was FAILED while the five possible execution jobs were all SKIPPED. Even the corrected scoped-recovery filter would consider that rejected run an already consumed daily slot and prevent recovery of the lost daily work.

The same immutable job-level native readback therefore also recognizes **at most one** genuine `schedule` or `workflow_dispatch` run that ended FAILURE **at the read-only admission** with `improve`, `model-freshness`, original Engineering code, and all bounded recovery paths conclusively SKIPPED. Only that completely unexecuted aborted daily can be retried once. A daily run that passed admission and started any work, including a later failed Engineering/model step, still vetoes another full daily; a second admission-only abort triggers `PRE_EXECUTION_RETRY_BUDGET_EXCEEDED`. Unknown/partial native job proof is never a basis for replay. Existing concurrency and one schedule remain intact. This allows a single operator-requested original daily recovery today without inventing producer or outcome success.

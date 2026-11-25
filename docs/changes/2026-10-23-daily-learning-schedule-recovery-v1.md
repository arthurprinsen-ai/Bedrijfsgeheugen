# Missing Daily Self Evolution — provider-backed self-recovery

Date: 2026-10-23. Canonical owners [#4367](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4367) (daily learning/model freshness) and [#4661](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4661) (existing GitHub/Janitor delivery).

## Observed incident
GitHub returned 15 scheduled workflow runs on 23 October 2026, but none for **Powerhouse Daily Self Evolution**. Its schedule is `47 4 * * *`, and GitHub officially documents delayed/dropped schedule events. Thus the configured cron alone cannot prove daily autonomous learning. Last observed Daily Self Evolution from 22 October ended in failure; do not count it as successful learning.

## Surgical implementation
Reuse `.github/workflows/powerhouse-repository-janitor.yml` (existing hourly cron, existing `actions: write`, existing concurrency). Add `tools/delivery/daily-learning-liveness-recovery.mjs` and only one bounded recovery step, with an artifact at `.artifacts/powerhouse-daily-learning-liveness.json`. No new scheduler, privileges, agent, database or queue.

The checker looks up workflow-specific GitHub runs **for the current UTC date only**. After the scheduled 04:47 UTC plus two-hour grace, absence is potentially recoverable. A second provider read before dispatch fences a late scheduled run or another agent's manual launch. It may request the already-existing `workflow_dispatch` on `main` exactly once per Janitor evaluation. Any active/queued, failed or successful run that day suppresses repeat dispatch. Invalid, truncated, missing or unavailable provider evidence blocks dispatch. The per-branch/head and manual modes are also guarded; the provider-ghost-only/dry-run mode never dispatches.

An HTTP-accepted dispatch is `RECOVERY_DISPATCH_ACCEPTED_NOT_EXECUTION_PROOF`, **not** evidence of completed learning. The independent `improve` and `model-freshness` jobs remain unchanged; stale catalog/provider evidence still fails closed.

## Acceptance
- Unit/replay test `tests/brain-daily-learning-liveness-recovery-v1.test.mjs` covers double-read race, invalid provider data, existing failed work, scheduled grace, duplicate detection, main-only authority, and existing two-job workflow.
- Exact-head Required, CodeQL, protected merge; no direct production mutation or forced green status.
- After merge, observe a real existing Janitor run, its artifact, and the actual Daily Self Evolution run ID with separate terminal job conclusions.
- A cancelled Janitor or provider-unavailable readback remains an unresolved issue, never an invented recovery.
- Actual daily learning quality, provider freshness and model upgrades are not proven by code review or a dispatch receipt.

Docs: https://docs.github.com/en/actions/how-tos/troubleshoot-workflows and https://docs.github.com/en/rest/actions/workflows

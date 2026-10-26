# Off-hour GitHub schedule for the existing Recovery Supervisor

Date: 2026-10-23. Canonical owner: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4120 .

## Independent production symptom
Read-only provider history for the current repository's scheduled GitHub workflow runs contains **four** Recovery Supervisor schedule starts in the sampled 2026-10-21 18:34 UTC through 2026-10-23 13:20 UTC window, despite the existing cron claiming a five-minute cadence. A separate `workflow_dispatch` on the protected main commit `c8a0800a` does not prove the schedule itself runs.

The observed shortfall is real; **its underlying cause is not independently established**. GitHub documents that schedule triggers can be delayed or dropped under heavy workload, especially around the hour boundary. See https://docs.github.com/en/actions/how-tos/troubleshoot-workflows . An obsolete workflow actor or provider limits remain alternative explanations.

## Smallest existing-owner implementation
Modify only the single Recovery Supervisor cron from `*/5 * * * *` (minutes 0,5,...55) to `2-57/5 * * * *` (minutes 2,7,...57): same intended frequency, no new scheduler, agent, queue, API call, additional provider subscription or concurrency bypass. Updating cron on the protected default branch can also refresh its scheduled actor depending on permissions and provider state.

Keep `workflow_dispatch`, native `expected_head_sha`, `MAX_MAIN_DRIFT_REFRESHES=2`, single-writer concurrency and all Required/CodeQL/provider readbacks untouched.

## Verification boundary
Tests prove **configuration**, not actual GitHub dispatch reliability. Require exact-head Required and CodeQL, protected merge, then monitor native `event=schedule` run timestamps and actual successful completions for at least a complete hour before estimating cadence impact. Fail closed and keep the canonical incident open if scheduled executions remain absent. Never manufacture missing run rows or promise that GitHub hosted cron is guaranteed.

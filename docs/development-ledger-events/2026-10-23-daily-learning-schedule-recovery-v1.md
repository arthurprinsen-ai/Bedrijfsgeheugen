# Append-only delivery ledger — daily learning schedule liveness

Date: 2026-10-23
Obligation-ID: `learning|daily-self-evolution|missing-provider-scheduled-run|20261023-v1`
Owner: Existing Brain / Heartbeat / Repository Janitor (#4367, #4661)

- OBSERVED: GitHub schedule list on 2026-10-23 included 15 other schedules, zero Daily Self Evolution; GitHub explicitly documents dropped/delayed schedules. No assertion that the cron setting was disabled.
- ROOT CAUSE CLASS: unavailable scheduler execution proof; provider schedule may be delayed/dropped. This is separate from the known stale model catalog error #4367.
- CANDIDATE: original hourly Repository Janitor alone performs a day-scoped provider read, strict 2h grace, final race-fencing second read, and at most one dispatch of the already-declared Daily Self Evolution workflow.
- SECURITY: existing `actions: write` suffices; no added token scope, no second scheduler, no production SQL, no provider preview charges, no ignored Required/CodeQL.
- REGRESSION: `tests/brain-daily-learning-liveness-recovery-v1.test.mjs` covers negative cases, bounded reads and idempotence. Tests/CI and protected merge remain pending before release.
- LEARNING PROOF: accepted dispatch never upgrades Brain record to `PROVEN`. The real same-day `improve` and `model-freshness` conclusions and artifacts must be observed independently.
- LIMITS: hourly Janitor itself may miss its GitHub schedule; fail closed and report instead of inventing liveness. No improvement in business outcomes or model intelligence is claimed yet.

Release status: CANDIDATE_NOT_LIVE until exact-head protected checks and verified main.

# 2026-10-20 — Powerhouse SalesRobot ambiguous DM delivery (append-only)
- Parent obligation: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Fingerprint: `commercial|linkedin-salesrobot|ambiguous-provider-send-no-resend|20261020`
- Observed: SalesRobot health DISCONNECTED, cookieExpired=true, TRIAL_EXPIRED, daysOfExecutionRemaining=0, campaign PAUSED. Canonical connection enrichment 23,295/23,295 on 2026-10-20.
- Failure: sender catch previously reset `waiting` to `suggested` for unknown external side effect; risk of duplicate direct messages.
- Fix candidate: preserve original `waiting` claim, store immutable ambiguity contract, no fallback/no automatic resend, require independent inbox readback.
- Safety: never weaken consent, human approval, message quality, suppression, cooldown, known sender or one daily scheduler.
- Tests: `tests/brain-salesrobot-linkedin-readiness-v1.test.mjs` updated for current fail-closed model + uncertain-send regression.
- Open gates: Required CI, CodeQL, protected PR merge, exact production deploy/readback, external SalesRobot billing/session repair and authentic end-to-end provider evidence.
- Current terminal state: NOT LIVE_PROVEN / provider hard boundary remains.

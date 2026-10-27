# 2026-10-25 — Existing hourly revenue evidence fairness, diagnosis → fix → prove

- Parent P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Obligation ID: growth:revenue-evidence-hourly-no-starvation:20261025-v1
- Failure fingerprint: revenue-learning|hourly-static-queue-hot-head-starvation|20261025-v1
- Real readback: 2026-10-25 production execution due=105, attempted=8, missingVerifiedSource=3, insufficientCohort=5, promoted=0. Next query due=110.
- Root cause: old batch algorithm rotated channel order but repeated the first record of each channel.
- Change: deterministic hour-slot cursor per channel, round-robin across records and channels, default eight/maximum sixteen; stable retry, idempotent obligation IDs.
- Tests: tests/brain-revenue-learning-no-starvation-20261025.test.mjs (static backlog coverage, multi-channel fairness, same-hour replay, negative fake-revenue promotion, invalid inputs).
- CI: existing Required preflight, no extra direct PR-trigger workflow; CodeQL + protected merge.
- Guard: no invented leads, provider side effects, paid revenue, or false-green statuses. Ongoing monitoring through existing @hourly evaluator only.
- Status: CANDIDATE until exact protected CI, Netlify release and subsequent independently observed run.

# Immutable development event — 2026-10-22 GitHub PR-comment watchdog authority

- Fingerprint and canonical obligation: `github|required-gate-watchdog|owner-comment-403|20261022-v1` (existing Supabase Brain registry, OBSERVED).
- Parent: #3742; no duplicate scheduler or parallel incident store.
- Production occurrence: run 39811993147, job 119940435969, main 01af9f2a05794a170cd3fd63013db75a33e76268.
- Failure: GitHub API 403 POST /issues/4656/comments; existing Required #4662 dispatch did succeed prior to denial.
- Root cause hypothesis: issues:write alone insufficient for this PR-comment endpoint in actual integration; request pull-requests:write and verify provider readback, do not assert proven before it.
- Fix: single existing watcher workflow + handler + pure decision helper; bounded attempt count, typed fail-closed deferred-denial evidence, no masking independent dispatch, unchanged security/CLS/Required/CodeQL.
- Regression: tests/brain-required-failed-gate-owner-routing-v1.test.mjs with positive/negative authority cases.
- Learning and skill/system map writeback bundled in this candidate; never mark historical incident PROVEN without exact production receipts.

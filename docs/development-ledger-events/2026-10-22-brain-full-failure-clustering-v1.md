# Development ledger — Unified BRAIN full failure clustering

- 2026-10-22: fingerprint `delivery|brain|first-failure-only-learning-blindspot|20261022-v1`.
- Exact reproduction: run 39791707071 / job 119869500824 shows 355 test failures, while source workflow passes only FIRST failure paragraph into current delivery learning.
- Change: one bounded deterministic TAP parser + existing failed lane artifact + regressions; original learning route remains canonical.
- Actor: automation delivery owner only, no second Brain registry or cron.
- Readback state: CANDIDATE_UNVERIFIED pending Required, CodeQL, protected merge, next actual failed-run artifact.
- Preventive rule: complete per-run failure coverage, grouping and fingerprint dedupe; never infer causes or green from failure classification.

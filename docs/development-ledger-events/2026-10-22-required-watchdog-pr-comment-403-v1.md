# Immutable delivery ledger — 2026-10-22 PR comment 403 recovery

- Obligation and fingerprint: `delivery|failed-gate|pr-comment-write-scope-403|20261022-v1`
- Parent canonical P0: #3742; released predecessor #4660, no duplicate original writer
- Before state: main `01af9f2` new watchdog run `39811993147` FAILED on job `119940435969`
- Verified symptom: POST `/issues/4656/comments` -> HTTP 403 `Resource not accessible by integration`
- Token evidence: Actions write, Issues write, Contents read, PullRequests read
- Root-cause basis: GitHub permission boundary independently reported in `github/rest-api-description#6994`
- Scope: only original watchdog YAML; positive/negative test; Brain learning JSON; this append-only event and human doc
- Fixed approach: original GITHUB_TOKEN requests both PR write and Issues write for PR issue comments
- Does not change: original runner schedule, missing-Required, CodeQL, CLS threshold, other agents, scheduler, source repair or security gates
- Verification still required: Protected exact-head CI+CodeQL, then real main watchdog run success and one PR comment readback
- Closure state: CANDIDATE, no false-green provider or autonomous CSS repair claim

# Append-only development ledger — watchdog GitHub owner-comment 403, 22 October 2026

- Event: `FAILED_GATE_OWNER_COMMENT_PROVIDER_403_RECOVERY_CANDIDATE`
- Parent/owner: merged owner-routing PR #4660; existing failed-gate PR #4656 and P0 #3742
- Fingerprint: `github|required-gate-owner-handoff|provider-comment-403|20261022-v1`
- Source evidence: workflow run #39811993147, job #119940435969; exact `POST /issues/4656/comments` rejected HTTP 403 despite effective `Issues:write` in runner log
- Baseline: only GitHub PR-owner comment API failed; existing Required dispatch for #4662 had been accepted
- Corrective candidate: request documented alternative `pull-requests:write`; quarantine subsequent same-tick denied comments, continue unrelated safe dispatch, upload immutable handoff-denial evidence and finish red on unproven delivery
- Regression: `tests/brain-required-failed-gate-owner-routing-v1.test.mjs` (positive denied 403 and negative other failures)
- Human documentation: `docs/changes/2026-10-22-watchdog-comment-403-recovery-v1.md`
- Learning writeback: `brain/learning/2026-10-22-watchdog-owner-comment-authority-403-v1.json`
- Next evidence required: protected exact-head checks, CodeQL, merge, actual GitHub watchdog run, owner-comment readback
- Scope: no new scheduler, external provider secrets, CI weakening, new owner or false green
- Status: CANDIDATE; no provider acknowledgment assumed

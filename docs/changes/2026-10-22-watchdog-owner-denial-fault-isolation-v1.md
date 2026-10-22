# Partial 403 isolation in canonical Required Gate Watchdog

## Parent incident and distinct cause
PR #4670 has already **merged** the missing `pull-requests: write` permission. This successor does not alter workflow scopes. Original watchdog [run 39811993147](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39811993147) exposed an additional fault-isolation defect: one denied owner-comment abruptly terminated other unrelated Required recovery dispatches.

## Bounded handler
Only `POST /issues/{pr}/comments` provider HTTP 401/403 is a typed owner-handoff denial. The same existing script records exact PR, candidate SHA, gate and run; caps owner-signal attempts at two per tick; scans and dispatches other missing Required tests; exits non-success if any owner handoff was denied. All other unexpected API errors still throw. Source tests assert both positive and negative classification, preserved concurrency, current CI gates and final non-success. No second schedule/runner, provider work-around, hidden retry loop or generic permission escalation.

## Verification
Protected current-main candidate Required+CodeQL and autonomous System Map/skill regression must pass. After release, check the scheduled watchdog provider run and only then promote live-proven; a synthetic denial must remain a visible red failure while allowing independent dispatch. Human/Notion/dashboard status must retain CANDIDATE before provider proof.

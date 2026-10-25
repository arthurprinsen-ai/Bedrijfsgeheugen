# Required Gate Watchdog: bounded GitHub provider failures

Fingerprint: `delivery|required-watchdog|transient-api-abort-all-prs|20261022-v1`  
Owner: existing five-minute Required Gate Watchdog and canonical same-owner PR handoff.  
Incident class: suspected full-tick interruption from one unbounded GitHub API read or per-PR exception; confirmed from source inspection, not production recurrence measurements.

## Minimal correction
- GitHub GET read timeout 8s, maximum two attempts for HTTP 429, 5xx or network/timeout; 403/404 remain terminal.
- Never repeat ambiguous comment/dispatch POST. The next scheduled tick rechecks the exact head and owner marker before any side effect.
- Catch failures separately per PR, continue to later PRs, cap at three failed PRs per tick and preserve red exit if any observation incomplete.
- Keep original five-minute scheduler, one owner, unchanged admission, Required and CodeQL, CLS limit, branch protection, provider correctness and full BRAIN obligations.
- Regression: `tests/brain-required-gate-watchdog-resilience-v1.test.mjs`. System Map, existing GitHub acceleration skill, Brain learning and append-only ledger travel in this same commit.

## Release truth
Candidate only. No completed CI, protected merge, scheduler execution or production outcome is claimed. Full BRAIN zero failures and migration/portal acceptance remain independent issues. ChatGPT client streaming interruption is a different service and not fixed by this repository change.

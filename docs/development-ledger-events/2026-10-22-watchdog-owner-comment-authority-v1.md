# Watchdog GitHub owner-comment authorization incident — 22 Oct 2026

Obligation-ID: `delivery|failed-gate|watchdog-observation-only|20261022-v1`, same original [PR #4660](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4660), issue [#3742](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/3742).

## Observation and cause
Real [postmerge watchdog run 39811993147](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39811993147) on `main=01af9f2a05794a170cd3fd63013db75a33e76268` dispatched missing Required for #4662, then POST `/issues/4656/comments` returned HTTP 403 Resource not accessible by integration. Job GITHUB_TOKEN permissions were issues:write but pull-requests:read; existing script aborted the entire periodic scan.

## Contained repair
Authorize only existing watchdog `pull-requests:write` and preserve existing `issues:write`. Catch only authenticated owner PR-comment 401/403, bound unauthorized handoffs to two per tick, continue unrelated safe missing Required dispatch. End RED when even one owner signal was denied; no false green, no new scheduler, no duplicate writer, no retries of failed source tests, no waiver of mobile CLS 0.100 or security guards.

## Required evidence
Original BRAIN regression `tests/brain-required-failed-gate-owner-routing-v1.test.mjs` expanded with negative fixtures and explicit workflow permission/source guards. Exact-head Required and CodeQL followed by protected merge and **real postmerge watchdog owner-comment** readback are still mandatory; provider policy may continue to deny despite requested permission. Regression/test success alone does not establish GitHub provider authority. Keep failure registry OBSERVED until proven.

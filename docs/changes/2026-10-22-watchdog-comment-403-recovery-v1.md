# Required Gate Watchdog — provider-authority recovery (22 October 2026)

## Verified failure
Existing required-gate watchdog [run #39811993147](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39811993147) encountered HTTP 403 `Resource not accessible by integration` for `POST /issues/4656/comments`, even though the GitHub runner printed `Issues: write`. Exact provider cause remains unproven; do not label this permission omission without further readback.

## Minimal correction
Keep the existing five-minute watchdog and same existing PR-owner obligation from merged #4660. The GitHub API accepts `issues:write` **or** `pull-requests:write` for comments on pull requests; request the second permitted capability rather than weaken gates or create a scheduler. Any denied comment means **NO HANDOFF**, not success.

The existing script now classifies only the exact comment 403, stops repeating the same denied write in that tick, records exact PR/head/gate/run in an artifact and ends red; it still executes independent safe missing-Required dispatch for remaining PRs. Other failure classes still fail closed immediately. The original website source problem remains with #4651/#4215 and PR #4656.

## Acceptance and limitations
Protected Required/CodeQL, exact-SHA merge and a real workflow_dispatch/provider readback are required before stating comment delivery is live. A successful comment is only an owner alert, not an autonomous source-code fix. If GitHub rejects both authorized scopes, leave it red with durable evidence instead of using unsupported credentials. No new scheduler, no branch-protection bypass and no fabricated success.

Regression: `tests/brain-required-failed-gate-owner-routing-v1.test.mjs`.
Learning: `brain/learning/2026-10-22-watchdog-owner-comment-authority-403-v1.json`.

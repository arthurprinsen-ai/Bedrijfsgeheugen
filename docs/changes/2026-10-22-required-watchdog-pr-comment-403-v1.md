# Actual watchdog 403: minimum PR-comment permission repair — 22 October 2026

Original merged main `01af9f2` (PR #4660) has scheduled Required Gate Watchdog failure-to-owner routing, but the first provider dispatch [run 39811993147](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39811993147) **failed** after dispatching Required for #4662. The next action, `POST /issues/4656/comments`, returned `403 Resource not accessible by integration`. Runner explicitly showed `Issues: write` but `PullRequests: read`. There was no verified repair-owner comment.

Root cause is the permission boundary for PR conversation comments. GitHub upstream [rest-api-description#6994](https://github.com/github/rest-api-description/issues/6994) independently records that the actual integration may require BOTH PR and Issues write, despite documentation listing either. Scoped change: add `pull-requests: write` to the **existing** watchdog; keep `issues: write`, `actions: write`, `contents: read`, five-minute schedule, original dedupe and missing-Required dispatch. No other token, service, workflow, scheduler, RLS or production app is changed.

Executable regression: `node --test tests/brain-required-watchdog-pr-comment-403-v1.test.mjs`. Existing failures under owner #4651 and P0 #4215 remain open; a comment is not an autonomous CSS fix.

Keep CANDIDATE until exact-head Required/CodeQL, protected merge, a new actual watchdog run with SUCCESS and a deduplicated PR comment/provider readback. Existing separately observed >2h PR-age cutoff and delayed scheduled cadence are **NOT FIXED** here; remain open on original #4660/#3742 lineage.

# 2026-09-24 — Problem Radar chat closure

- Fingerprint: `powerhouse-50-problem-radar-chat-closure-20260924-v1`
- Scope: Problem Radar executive P0 + terminal delivery learning + production proof
- Status: `LIVE_BEWEZEN`
- Feature PR: #2779
- Feature merge: `53c1c5db7a6e499f3afa4a5d9b470e6196460579`
- Closure PR: #2781
- Closure merge: `b9e129ee972b990681d7e426f023cd25f75036cd`
- Current main at closure: `945febc5cb2d603dfaefcc8b1d12a36b075a7d1d`
- Netlify production: deploy `6ab5417a7533790008782b04`, state `ready`, context `production`, commit_ref equals current main.
- Product proof: canonical PH-Pxxx, max-five executive projection, evidence drawer, impact-certainty contract, action/capability/outcome mapping.
- Subsequent same-lineage extension: #2786 Verified Value Created by canonical problem.
- Delivery learnings: validate Base-SHA metadata; material changes require Brain learning + ledger + human docs; learning requires historical replay; merge is not live proof; use ancestry for feature-live and equality for exact-main-live.
- Skills updated: Problem Radar, Powerhouse Continuity, Delivery Self-Optimization.
- Full documentation: `docs/brain/powerhouse-50-problem-radar-chat-closure-20260924.md`.

## Recovery learnings added

- Proven admission root cause: `gh api` open-PR JSON exceeded Node `execFileSync` default output buffer; current main uses `maxBuffer=16*1024*1024`.
- Failure was control-plane execution-envelope capacity, not malformed PR data.
- Reconciliation race observed: transient branch=head==base caused GitHub to auto-close #2791 as zero-diff.
- Same obligation/branch/PR was preserved and #2791 reopened after replaying the full delta.
- Permanent skills updated with `delivery|github-api-buffer-pr-reconcile-race|v1` and `github|same-pr|zero-diff-autoclose-recovery|v1`.

## Runner-capacity prevention

- Root cause amplification: old browser/readback jobs had bounded step retries but no enclosing job timeout.
- Fix: 25-minute job-level bounds on website browser, canonical brand-shell production readback and production release readback.
- Regression: `tests/brain-delivery-runner-leak-timeout-v1.test.mjs`.
- Rule: timeout is fail-closed and releases runner capacity; it is never interpreted as successful verification.

## Additional runner recovery learning

- Controlled reopen/close test on closed PRs #2788 and #2782 did not reliably terminate already-running reusable-workflow jobs.
- Both PRs were restored to closed state immediately.
- Permanent rule: no PR-state churn as a runner-capacity recovery mechanism; use bounded jobs/concurrency and fail closed when cancellation authority is unavailable.

## Production readback single-flight

- Canonical brand-shell production readback now uses stable concurrency with `cancel-in-progress: true`.
- Production release readback now cancels obsolete unfinished main-commit readbacks.
- Regression guard: `tests/brain-delivery-runner-leak-timeout-v1.test.mjs`.

## Technical SEO utility-route runtime fix

- Required page-SEO failure: `ReferenceError: UTILITY_ROUTES is not defined`.
- Root cause: canonical `PUBLIC_UTILITY_ROUTES` import existed, but the absolute runtime set was never derived.
- Fix: derive `UTILITY_ROUTES` from `ORIGIN + PUBLIC_UTILITY_ROUTES`.
- Regression strengthened: `tests/brain-seo-login-noindex-scope-v1.test.mjs`.


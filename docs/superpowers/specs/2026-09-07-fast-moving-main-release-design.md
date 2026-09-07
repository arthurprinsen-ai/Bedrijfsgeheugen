# Fast Moving-Main Release Design

## Goal
Make website changes materially faster while preventing stale green PRs from merging after `main` has moved.

## Release contract
1. Every PR records the `main` SHA it was tested against.
2. A merge candidate is valid only when the current `main` SHA still equals that tested base SHA.
3. If `main` moved, the candidate is stale and must be rebuilt/retested against current `main`; old green evidence cannot authorize merge.
4. Fast Fix changes run only cheap static contracts plus targeted affected-route browser checks.
5. Normal changes run targeted static/browser checks for affected surfaces.
6. High Risk changes run full website regression.
7. Independent static checks and deploy-preview creation run concurrently where GitHub Actions permits it.
8. Playwright installation occurs only in browser jobs and uses dependency caching.
9. Duplicate broad browser gates are prohibited; one canonical release gate owns browser eligibility.
10. Merge uses the exact PR head SHA and a fresh-base assertion immediately before merge.
11. Production success is claimed only after Netlify reports the exact resulting `main` SHA as `ready` in production.

## Performance SLOs
- Fast Fix: p95 merge/live eligibility under 10 minutes when tests pass.
- Normal Change: p95 under 20 minutes when tests pass.
- High Risk: full regression remains mandatory where risk requires it.

## Moving-main behavior
The required `test` workflow determines the PR's tested base SHA and compares it with the current remote `main` before declaring success. A stale base fails explicitly. Expensive checks are selected from the changed delivery lane/risk profile, so unrelated `main` movement does not force broad regressions.

## Risk classification
The existing website release-risk classifier remains authoritative for browser scope. Control-plane-only changes do not require public-surface browser work; focused menu changes get focused browser coverage; public surface changes get targeted or full browser coverage depending on risk.

## CI topology
Cheap classification and static contracts run first. Browser verification is isolated in its own job so Playwright/Chromium setup is never paid by backend/portal/control-plane-only changes. The final job named `test` aggregates required jobs and performs the fresh-base assertion. Branch protection can continue requiring the stable `test` context while internals become parallel and risk-aware.

## Merge safety
No workflow writes directly to `main`. A merge is authorized only from the exact PR head SHA after the current-base check. If `main` moves between validation and merge, the merge attempt must be rejected/retried against the new base rather than trusting old evidence.

## Production readback
After merge, production verification compares Netlify `commit_ref` to the exact GitHub `main` SHA and requires `state=ready` and `context=production` before declaring the release live.

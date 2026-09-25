# Production snapshot latest-main-wins — 25 September 2026

## Problem

Production was able to lag behind GitHub `main` because `Production Source Snapshot` only ran when its own workflow file changed. Parallel merges could therefore advance `main` without a production reconcile.

At the time of diagnosis:
- GitHub `main`: `2edfe3df…`
- Netlify production: `f45ad02f…`
- production lag: 9 commits

## Permanent repair

`Production Source Snapshot` now:
- triggers on every push to `main`;
- uses a single `production-source-snapshot-main` concurrency group;
- uses `cancel-in-progress: true`.

That makes production reconciliation latest-main driven: when a newer commit lands, any older snapshot is obsolete and is cancelled rather than consuming capacity or publishing stale state.

Terminal proof remains unchanged: exact production SHA, production context, pricing content and browser-level pricing/i18n proof must all pass before `LIVE_BEWEZEN`.

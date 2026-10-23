# Append-only development ledger: research/performance type boundary

- Date: 2026-10-23
- Canonical issue: #4198
- Obligation: `content|learning|research-signal-mixed-with-performance|20261023-v1`
- Source incident: native daily Content growth learning run #39931429624, `content_id is required`
- Cause: source-only problem-radar event incorrectly reached canonical attributable content-performance aggregator
- Repair: partition exact source-only event type upstream; retain original source and bounded excluded-ID evidence; no synthetic content or commercial measurements
- Regression: `tests/brain-content-growth-source-boundary.test.mjs`
- Protected checks: Required, CodeQL, exact-head source, historical event replay, postmerge scheduled run
- Live: UNVERIFIED_CANDIDATE; no claim of added leads, sales, agent accuracy or background action
- Owner invariant: existing content-growth and #4198 single canonical lane, no new database/cron/agent

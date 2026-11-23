# Content chain measurement stage — 2026-11-05

## Finding (provider readback)
In `content_publication_obligations` no row had ever been measured: 18 blogs and 29 LinkedIn company posts were LIVE_PROVEN, `measured_at` and `metrics` were empty. Five rows had `learned_at` without a measurement. The hourly GA4 sync reported `ok` while `metingen_ingevuld` stayed 0 and the latest run reused a cached Windsor readback because `WINDSOR_API_KEY` is absent.

## Change (migration `20261105125354_content_outcome_measurement_v1`, applied at the provider, lock row 806)
- `powerhouse_measure_content_outcomes_v1`: for live-proven blogs older than seven days, sums sessions, active users and events for the blog's page path over the first seven days from `bg_ga4_csv_batches` (latest batch per day), and records `MEASURED` via `record_content_publication_state` with `data_quality` = `SUFFICIENT`, `INSUFFICIENT_DATA` or `INCOMPLETE_COVERAGE`. It never sets `LEARNED`.
- `powerhouse_content_closed_loop_tick_v1` calls it in an isolated block after the existing reconcile step. Auth and dispatch errors stay uncaught. No new cron job.

## Result at the provider
18 blogs measured, 0 sufficient for learning: none received a session in its first seven days. The site has about 150 sessions over 53 days, so the content lever is distribution, not generation.

## Not changed
LinkedIn and Instagram measurement (no page-level source yet), the five unmeasured `learned_at` rows (flagged, not edited), GA4 collector, Windsor secret.

## Independent gates
Protected Required, CodeQL, original BRAIN and terminal closure. Proves no customer or revenue outcome.

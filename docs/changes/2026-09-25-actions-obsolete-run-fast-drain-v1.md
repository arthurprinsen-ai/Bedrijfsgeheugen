# GitHub Actions fast queue drainage — 25 september 2026

## Incident
Development was again slowed by 19 in-progress/active and 11 queued GitHub Actions runs despite earlier queue-storm controls.

## Root cause
The prevention logic correctly recognized obsolete run identity, but cleanup latency was still operationally too conservative: queued obsolete runs waited up to six hours and obsolete in-progress runs up to thirty minutes before the supervisor could reap them. The supervisor itself ran only every fifteen minutes and allowed recovery dispatch until the non-terminal count reached twenty.

## Fix
- recovery supervisor cadence: every 5 minutes;
- proven-obsolete queued run grace: 60 seconds;
- proven-obsolete in-progress run grace: 300 seconds;
- stale cancellation budget: 100 per cycle;
- recovery circuit breaker: 12 total non-terminal runs;
- healthy current-head work is never cancelled for count reduction alone;
- regression test and delivery-concurrency skill updated in the same lineage.

## Prevention rule
Capacity recovery must be identity-driven, not age-driven. Once a run is proven obsolete by SHA/PR/branch identity, it must stop consuming runner capacity within minutes. Recovery automation must stop creating new work before the repository reaches saturation.

Terminal closure still requires protected merge, current-main containment and production/readback evidence where applicable.

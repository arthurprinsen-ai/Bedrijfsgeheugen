# Content-growth daily evidence accuracy — 2026-10-24

- Owner: existing daily Content growth learning at 04:20 UTC, no new scheduler, no bypass.
- Observed: company LinkedIn post metrics use `PROVIDER_OBSERVED_LINKED`, which old consumer did not recognize. LinkedIn views absent, so no engagement-rate denominator.
- Observed: GA4 MISSING, GSC AWAITING_PROVIDER, daily Instagram/LinkedIn OBSERVED_LEGACY. Individual provider snapshots and aggregate source freshness are different layers.
- Repair: accept linked provider actual comment/reaction counts, reject stale and future timestamp receipts, require fresh consented human page and source evidence before recommending CTA changes, preserve explicit coverage gaps.
- Tests: tests/brain-daily-content-performance-diagnostics-v1.test.mjs. No false leads or commercial outcomes.

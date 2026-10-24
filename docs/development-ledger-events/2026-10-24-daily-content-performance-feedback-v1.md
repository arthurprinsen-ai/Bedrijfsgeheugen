# Daily social/blog/website feedback — 2026-10-24

- Existing owner: 04:20 UTC Content growth learning job, no second schedule.
- Root cause: original daily learner only used static repository events, not live canonical provider posts and consented website interaction aggregates.
- Measurement: Instagram views/likes/comments available for a bounded subset; LinkedIn reactions-only must not become fabricated view rates.
- Fix: one read-only tenant-filtered snapshot per post and human consented page aggregates, plus next-day hypothesis generator. Uses existing SUPABASE_ACCESS_TOKEN in protected Actions secret; missing access reports AUTH_REQUIRED.
- Guardrails: no personal session ID export, no visitor reidentification, no causality inference without experiment, no lead/order without attribution, no automated unsafe publishing.
- Regression: tests/brain-daily-content-performance-diagnostics-v1.test.mjs. Production terminal state requires source readback and tested measured outcomes.

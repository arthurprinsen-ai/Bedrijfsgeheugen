# Daily Powerhouse source truth: measured data required (24 October 2026)

The existing `Content growth learning` workflow could accept a successful read-only Supabase management query and nonempty *post registrations* plus source health metadata as proof of observed content performance even when all posts lacked current metric snapshots. The canonical social query uses a LEFT JOIN, so this is a real false-positive condition. Separately, the page diagnostic discarded `observed_at`, making it impossible to verify whether consented page activity was current.

The same scheduled workflow now requires **at least one** recent measured brand-owned Instagram/LinkedIn post OR one recently observed consented nonrobot page-session aggregate linked to a recent observed website-interactions source. This is explicitly a **partial-channel proof** if not both are available; it never establishes GA4 or GSC complete scope, social lift, customer intent, leads or paid orders. A healthy provider HTTP response with missing metrics becomes `NO_RECENT_VERIFIED_POST_OR_WEBSITE_MEASUREMENTS`, not green.

The canonical 04:20 UTC runner, Supabase read-only source, existing published-content owner, source retries, always-upload evidence and policy gates are unchanged. The failed gate leaves the source owner a concrete recovery task. No second scheduler, private sessions, external publisher, auto-merge exception or new analytics database.

Tests: `tests/brain-daily-provider-proof-gate-v1.test.mjs` and `tests/brain-daily-content-performance-diagnostics-v1.test.mjs`. Terminal proof requires protected merge and next real scheduled artifact readback.

# SEO/CRO: measurement identity from the final page, not from an intermediate build state

**Date:** 28 October 2026. **Status:** candidate, not production-proven until protected delivery.

Live check on 28 October 2026: 68 of 70 sampled public pages carried an inline growth-measurement config with `canonical: /over-ons`, role `support` and stage `discover`, while the page itself (head canonical and `data-bg-*` body attributes) was correct. The config is baked by `seo-apply` before later build steps finalise the page, and the script let that baked config win. Result: since tracking resumed on 25 October, 2,203 of 2,510 human page views were attributed to `/over-ons`; money pages such as `/prijzen` and `/frisse-blik` showed no views, and no per-page funnel could be measured.

## Bounded implementation
- In the existing inline script only: `canonical` and `landing_canonical` come from `link[rel=canonical]` when it points to the same host; `page_role`, `funnel_stage`, `intent_id` and `keyword_cluster` come from the body `data-bg-*` attributes. The baked values remain the fallback.
- No new collector, cookie, identity, scheduler or PII. Event schema and endpoint are unchanged.

## Independent validation
Replay test with a stale baked config; fallback test; other-host canonical test; existing measurement tests unchanged. After merge and deploy: public DOM readback plus a real page view of `/prijzen` and `/frisse-blik` arriving in `growth_events` with their own canonical. Historical rows cannot be re-attributed and stay as measured.

# Measure reading depth, visible time and exit

**Date:** 28 October 2026. **Status:** candidate, not production-proven until protected delivery. Builds on the measurement-identity repair (PR #5024).

Until now the site measured page views, one engaged view and CTA events. To find where visitors drop off, two events are added from the existing inline script: `scroll_depth` (25, 50, 75, 100 percent, once each) and `page_exit` (visible seconds, once per page view; highest scroll depth is carried in `engagement_reason`).

## Bounded implementation
- `tools/seo-order-engine/measurement.mjs`: listeners for scroll, `visibilitychange` and `pagehide`; no timers, cookies or identifiers.
- `tools/seo-growth/normalize-observation.mjs`: allowlist gains the two types; `value` accepted only when numeric, 0 to 86,400.
- `netlify/functions/growth-event.mjs`: forwards `value` to the data hub (already part of its contract).
- Not included: section-level views (`growth_events` has no content column) and returning-visitor identification (needs a consent decision; GA4 already reports it).

## Independent validation
Replay of the real script and real normaliser in a sandbox. After merge and deploy: a real page view followed by scrolling and leaving must produce `scroll_depth` and one `page_exit` in `growth_events` with a numeric value. Note that `growth_events.value` is currently 0 for all rows; consumers that sum `value` across event types should filter by event type.

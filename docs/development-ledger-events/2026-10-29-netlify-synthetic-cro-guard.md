# Development ledger — Netlify analytics headless requestguard 2026-10-29

Obligation: `powerhouse|netlify|synthetic-cro-events-preview-cost|20261029`. Authority: existing CRO/SEO injectGrowthMeasurement and Netlify edge usage telemetry. No new scheduler/publisher, no database write.

Observed 2026-10-29: public HTTP 503 `usage_exceeded` on all site and deploy aliases despite provider deploy `ready`. HeadlessChrome/149: 123501 requests / 2.88GB bandwidth; growth-event route: 22458 hits. Correlation to exact quota is not yet proven.

Change: add transparent, early `navigator.webdriver===true` guard before growth analytics session/write event emission; preserve all normal visitor/CTA/lead consent measurements. Add real-browser and synthetic-browser VM tests. Exact-head protected CI, deployment, public readback and Notion/GitHub incident learning are terminal criteria.

Proof state: NOT LIVE / quota P0. Explicit Netlify Team PrinsenCo billing/usage intervention may be needed. `ready` deploy must not override external `503` failure.

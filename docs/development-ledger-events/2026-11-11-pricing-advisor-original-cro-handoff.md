# 2026-11-11 — Pricing three-field advice CTA ignored by original website CRO measurement

- Fingerprint: `pricing|package-advisor|three-fields-not-measured-or-linked|20261111-v1`.
- Original owners: website/commercial pricing builder and original SEO/CRO growth-event producer, not a new scheduler.
- Observation: `pkgSize`, `pkgGoal`, `pkgMode` are three public categorical selectors; link `pkgGo` originally had `href=/pakketadvies` but no conversion attribution and a separate onclick JS redirect. The original analytics only recognizes explicit marked actions or a limited known path fallback, not `/pakketadvies`.
- Correction: native link href always contains three current categorical selections, one original CRO intent marker, no second nav or provider call.
- Evidence: historical/shadow/canary VM playback of actual original builder snippet; protected Required/CodeQL, original Netlify/DOM exact release.
- Remaining business receipt: actual destination interaction → qualified consented lead → real order → independent provider readback → Powerhouse/Heartbeat measurement and next-run learning; none claimed from a package advice click.

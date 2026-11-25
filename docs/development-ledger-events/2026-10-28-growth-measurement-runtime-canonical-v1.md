# 2026-10-28 — Fix per-page attribution of growth events

- Canonical obligation: `website|seo-cro|growth-measurement-runtime-canonical|20261028-v1`.
- Defect: inline measurement config baked at `seo-apply` time (canonical `/over-ons`, role `support`) overrode the final page values on 68 of 70 sampled pages.
- Scope: `tools/seo-order-engine/measurement.mjs`, one standalone Brain replay/shadow/canary test, learning and change documentation.
- No change to visible text, offers, pricing, shell or claims; no PII; no new collector or schedule.
- Required next proofs: exact-head Required/CodeQL/Netlify, protected merge, public DOM readback, real `/prijzen` and `/frisse-blik` page views in `growth_events`.
- This is **measurement repair**, not evidence of more customers.

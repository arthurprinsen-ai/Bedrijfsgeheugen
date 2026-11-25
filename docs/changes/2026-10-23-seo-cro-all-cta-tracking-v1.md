# SEO/CRO: make all first-party content CTA clicks observable

**Date:** 23 October 2026. **Status:** candidate, not production-proven until protected delivery.

The existing SEO instrumenter decorated only **the first** anchor for a given canonical primary CTA inside `<main>`. A page commonly has hero, middle and closing CTAs; the second and later identical targets remained unmeasured as primary events. Likewise a dynamic in-content CTA to `/zelfscan`, `/frisse-blik` or `/afsluiten` was missed unless another script added a `data-bg-conversion` attribute.

## Bounded implementation
- Mark all statically matching primary CTA anchors **inside main**; no change to header, mobile navigation or footer shell markup.
- Extend the **existing** delegated first-party `/api/growth-event` observer to infer only three explicitly allowlisted conversion destinations on same-site anchors inside `<main>`; do not count external, non-content or ordinary text links.
- Emit the same non-PII `primary_cta_click`, plus existing selfscan/Frisse Blik start events where applicable; do not add a cookie, new tracker, identity graph, collect form contents or claim paid outcomes from a click.
- Keep the existing source-of-truth Brain/CRO daily leerlus, quality gates and only one publisher/scheduler unchanged.

## Independent validation
Source and live browser readback must prove three static CTAs tagged and one dynamic CTA tracked, including no duplicate events and footer/menu preservation. Verify end-to-end `growth-event` → Netlify Blob → Supabase `growth_events` or explain any ingestion deficit. A real click in production, not a synthetic fixture, is necessary before reporting improved observability; conversion *lift* needs qualified leads/orders/payment evidence with a defensible baseline.

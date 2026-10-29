# 2026-10-23 — Fix lost primary CTA attribution

- Canonical obligation: `website|seo-cro|all-primary-cta-instrumentation|20261023-v1`.
- Existing first-party analytics remains `/api/growth-event`, canonical Brain context; no new scheduler/tracker/CRM.
- Observed code defect: first-match-only static CTA annotation, delegated listener ignoring dynamic in-content links without marker.
- Scope: `conversion.mjs`, `measurement.mjs`, their existing regression tests, one standalone Brain replay/shadow/canary test, learning and change documentation.
- No change to visible text, offers, pricing, site-global shell or product claims; no PII.
- Required next proofs: exact-head Required/CodeQL/Netlify, protected merge, public DOM and real event-ingestion readback, subsequent measured qualified-lead/order outcomes.
- This is **measurement repair**, not evidence of more customers yet.

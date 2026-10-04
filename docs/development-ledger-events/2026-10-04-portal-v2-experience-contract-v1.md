# Portal V2 Experience Contract v1 — development ledger event

Date: 2026-10-04  
Fingerprint: `portal-v2|experience|responsive|interaction|backend-contract|v1`  
Obligation: `portal-v2-experience-contract-v1`

Portal V2 receives one cross-cutting responsive and interaction contract instead of additional page-local visual fixes. The candidate bounds media and chart scale, enforces minimum touch targets and keyboard focus, supports reduced motion, keeps dialogs within the viewport, and normalizes dynamically rendered portal surfaces.

Backend authority is deliberately unchanged: authenticated Portal State, canonical business-input write ordering, Supabase/Netlify store behavior and fail-closed write confirmation remain authoritative.

This event is a delivery record, not production proof. Terminal closure requires exact-head CI, visual/live-preview evidence, protected merge, production deploy and production readback.

Canonical documentation authority: `docs/changes/2026-10-04-portal-v2-experience-contract-v1.md`.


## Consolidated v2 event
A parallel Portal product-experience implementation was deliberately retired in favor of this existing canonical `experience.css/js` lineage. The canonical layer now also owns dynamic visual measurement, 44 px legacy override protection and a 24-screenshot release matrix. This prevents duplicate UX authorities and keeps the Powerhouse learning, visual-assurance configuration and browser gate on one obligation.

# Portal V2 Experience Contract v1 — development ledger event

Date: 2026-10-04  
Fingerprint: `portal-v2|experience|responsive|interaction|backend-contract|v1`  
Obligation: `portal-v2-experience-contract-v1`

Portal V2 receives one cross-cutting responsive and interaction contract instead of additional page-local visual fixes. The candidate bounds media and chart scale, enforces minimum touch targets and keyboard focus, supports reduced motion, keeps dialogs within the viewport, and normalizes dynamically rendered portal surfaces.

Backend authority is deliberately unchanged: authenticated Portal State, canonical business-input write ordering, Supabase/Netlify store behavior and fail-closed write confirmation remain authoritative.

This event is a delivery record, not production proof. Terminal closure requires exact-head CI, visual/live-preview evidence, protected merge, production deploy and production readback.

Canonical documentation authority: `docs/changes/2026-10-04-portal-v2-experience-contract-v1.md`.

## Terminal production proof
- Status: **LIVE_PROVEN_RUNTIME / LIVE_BEWEZEN**
- Delivery PR: #3683
- Candidate head: `a21b9b961bedf9840a69fad5ff9059c8f6643196`
- Protected main: `d5abf46b5f86a65720fd2cf2d454116f696e8c45`
- Netlify production deploy: `6ac253953b573d0008e8e31a` (`ready`)
- Production portal: https://www.bedrijfsgeheugen.nl/portal-v2/
- Required test: run `37205339277` — success
- Portal V2 Production DOM Readback: run `37205339123` — success
- Portal Visual Density: run `37205339124` — success
- Powerhouse CodeQL: run `37205339174` — success
- Obligation Terminalizer: run `37205519609` — success

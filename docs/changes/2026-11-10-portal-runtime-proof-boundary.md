# P0 #4215 — Tenant runtime proof boundary, never false GREEN

**Owner:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215  
**Fingerprint:** `portal|runtime|unknown-evidence-false-green-and-revocation-stale|20261110-v1`

## Original source defects
- The Powerhouse-to-Portal runtime mapper treated any component without `healthy:false` as `healthy:true`; graph nodes, audit entries, unblocked agents and non-HIGH governance risks were also represented as healthy without independent outcome/compliance proof.
- On a 401/403 the transient domain projection was discarded but the original page invalidation event was absent, permitting an already-open read-only page to remain stale. On network errors and non-2xx, the previous green projection was retained.

## Contained fix
- Existing `portal-v2/runtime-evidence.js`: `healthy:true` is the only green integration confirmation; false is attention; absence is open/unverified. Graph presence, nonfailed agent activity and low/unassessed risk no longer imply verified health. Observed audit is not verified work.
- Missing authorization, 401/403, non-2xx and transport failures invalidate only the same-session transient runtime projection and dispatch the **existing** `bg:runtime-evidence` event, once per transition. No source/customer state writes, alternate provider, scheduler, new data table or browser storage.
- Existing page shell retains tenant/route guard and preserves DOM-only unsaved forms. A form may show a reopen request; automatic repaint is intentionally suppressed to protect entered data.

## Tests and acceptance
- `portal-v2/tests/portal-runtime-proof-boundary.test.mjs` tests absent/explicit/failed source proof, independent status signals, authorization revocation, source outage and stale-identity rejection.
- `tests/brain-portal-runtime-proof-boundary-20261110.test.mjs` and pre-existing all-pages tests enforce the original source and skill contract.
- Candidate remains EVIDENCE_DUE until protected Required + CodeQL + production exact-SHA readback and real signed-in tenant A/B browser acceptance. Server-durable BusinessInput outbox and end-to-end real action, provider readback, measurement and learning remain separate unresolved #4215 acceptance gates. No blanket green claim.

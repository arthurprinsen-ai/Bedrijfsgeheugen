# Koppeling Studio — evidence-first customer journey (2026-11-02)

Existing obligation: `portal-connection-studio-multiroute-recovery-20261102-v1`. Existing original P0 issue #4215. Fingerprint: `portal|connector-studio|opaque-progress-and-absent-source-journey|20261102-v1`. Owner: original Portal V2 UX + canonical connector owner + ONE BRAIN.

## Problem, root cause and affected users
The server already allows field/page selection and stores a tenant-scoped connector definition, but customer-facing pages displayed plain technical metadata without visual orientation, progressive disclosure, source discovery or a clear distinction between **configured**, **tested** and **actual verified values**. That creates confusing workflows, low perceived trust and potential overclaiming. Existing connector_definitions/executions/reviews were all empty at preflight on 2026-11-02 (0/0/0). The sample-only connector runtime is not real provider-data ingestion.

## Implemented candidate
- One clear Studio journey: choose system, approve scope, independently verify source/storage, understand outcomes. Selection feedback updates with chosen field count, chosen page count and explicitly consented AI mode.
- A branded, responsive *Source Journey* on selected portal destinations with real tenant-configured connector count, configuration status, selected fields and action to the original Studio. A useful source search only when >=3 connectors; hidden when not needed.
- No artificial status scores, sample financial values, imaginary timestamp, green 'synced' badge or inferred customer KPI. The server response is validated against the strict metadata-only proof contract and the public UI always labels source values unverified.
- Semantic buttons/links, 44px action targets, visible keyboard focus, accessible status/labels, reduced-motion handling, mobile 320px layout and no untrusted innerHTML.
- Machine regression, original BRAIN import, agent skill and original human ledger; no parallel publisher, store, workflow, data model or new cron.

## Proof status and acceptance
**Code delivered does not mean live real values**. Live external provider readback → tenant-authoritative storage → provenance/freshness → Portal V2 readback → Brain/Powerhouse **remains OPEN** in original issue #4215. No provider connector may be marked verified without source-side receipt, user consent, real target persistence, independent two-tenant isolation, revocation tests and sovereignty policy. Full WCAG 2.2 AA and Red Dot award / SUS >=85 require independent user-testing and judging; current work does not assert them.

Release gate: exact-head Required + CodeQL + BRAIN + browser, original writerlease, protected merge, Netlify exact published SHA and authenticated readback. On failure, record original incident, correct root cause, add regression, retest; do not change gates to green. Postrelease user and real-provider tests remain distinct obligations.

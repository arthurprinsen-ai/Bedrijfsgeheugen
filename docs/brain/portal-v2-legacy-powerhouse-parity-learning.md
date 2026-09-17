# Portal V2 legacy parity + Powerhouse learning

**Fingerprint:** `portal-v2-legacy-powerhouse-parity-v1`  
**Status:** VERIFIED  
**Date:** 2026-09-17  
**Scope:** Portal V2, legacy migration parity, Powerhouse architecture, production verification

## Context

A request was made to make Portal V2 contain everything from the old customer portal and make it work with the Bedrijfsgeheugen Powerhouse.

The initial risk was to interpret that request as a greenfield rebuild. Current-state inspection showed that this would have violated EXISTING-STATE-FIRST and REUSE-FIRST: the repository already contained a protected legacy baseline, a complete 24-capability functional inventory, executable parity ownership, persistence contracts, fail-closed tests and production evidence gates.

## Canonical authorities

- Immutable legacy baseline: `klantportaal.html`.
- Functional migration inventory: `portal-v2/legacy-functional-inventory.js`.
- Executable parity authority: `portal-v2/parity-gate.js`.
- Fail-closed parity tests: `portal-v2/tests/parity-gate.test.mjs` plus the full Portal V2 test suite.
- Production state/persistence authority: existing Powerhouse/Supabase domain-state contracts.
- Delivery authority: protected GitHub main + BRAIN delivery + exact-SHA production readback.
- Human/read-model documentation: Powerhouse Menselijk Handboek and Powerhouse Direct Knowledge Base in Notion.

## Evidence

Protected PR: `#1846` — Portal V2 full legacy + Powerhouse parity verification.

Candidate SHA:

`568aed3bbab56c6233e98cc10f829b31bc239f02`

Protected merge SHA:

`05f9cc58c629e6ab9991b7ca1d6bc6e9222a336b`

The candidate passed Required test, Portal V2 suite, portal production contracts, Supabase security, backend Brain/Quality Intelligence, BRAIN delivery, CodeQL and Netlify deploy-preview gates.

Post-merge workflow `Canonical brand shell live readback`, run `35137918209`, ran on exact merge SHA `05f9cc58c629e6ab9991b7ca1d6bc6e9222a336b` and finished `completed/success`. The run included exact Netlify production-commit verification plus production browser/visual readback.

## Proven conclusion

Portal V2 already had the protected legacy functional surface represented by 24 capability contracts. No evidence justified rebuilding those capabilities in a second implementation. The correct change was to re-prove current parity, preserve the existing implementation and repair only evidence-backed regressions.

V2 remains a view and interaction layer on the same canonical Powerhouse. It must not introduce a parallel portal database, second Brain, second queue, duplicated calculations or disconnected business logic.

## Root cause of the decision risk

A visual inspection of V2 can make a capability appear missing even when the underlying functional contract, renderer, calculation, persistence and production behavior already exist. Treating perceived UI absence as proof of missing capability can create duplicate functionality and architecture drift.

## Permanent prevention rules

1. **Inspect before building.** Before any legacy-to-V2 restoration, read current protected `main`, `legacy-functional-inventory.js`, `parity-gate.js`, capability contracts, owner modules and current production evidence.
2. **Navigation is not parity.** A menu entry, route, card or static explanation is never sufficient proof that a legacy capability has migrated.
3. **Functional parity is multi-dimensional.** A protected capability counts as present only when its applicable fields, models, calculations, actions, dependencies, renderer ownership, persistence and browser/production evidence are all covered.
4. **Repair gaps; do not duplicate owners.** If the capability is already owned by a current module, extend/fix that owner rather than adding a parallel module or store.
5. **Powerhouse is the only business authority.** Portal V2 uses the existing tenant-scoped Powerhouse/Supabase state, provenance, freshness, confidence, outcome and learning contracts.
6. **Use exact-SHA evidence.** Candidate green status must bind to the exact tested SHA; merge must use the protected branch path; production readback must bind to the exact deployed merge/candidate identity according to the delivery contract.
7. **Production evidence is mandatory.** CI or merge is not terminal proof. Browser/runtime/readback evidence is required before `LIVE & BEWEZEN`.
8. **Write back the learning.** Every parity restoration or discovered gap must record root cause, fix, evidence and prevention in the existing Powerhouse learning/documentation chain.

## Regression trigger

Any future Portal V2 change that causes one of the following becomes a recovery obligation:

- protected legacy capability disappears from the inventory;
- a capability loses renderer or persistence ownership;
- a protected calculation/action/dependency is no longer implemented;
- authentication, tenant isolation, import/export, print permission, feedback, branding or mobile navigation regresses;
- production evidence is missing or refers to a different SHA;
- a second portal data authority or duplicated Powerhouse logic is introduced.

## Required recovery flow

`detect → reproduce → add/strengthen regression check → root-cause fix in existing owner → full Portal V2 tests → protected delivery gates → exact-SHA merge/promotion → production browser/runtime readback → Powerhouse learning/writeback`

No workaround may weaken parity, security, truth, RLS, persistence or production-evidence gates.

## Open obligation

None for fingerprint `portal-v2-legacy-powerhouse-parity-v1` at the time of this writeback.

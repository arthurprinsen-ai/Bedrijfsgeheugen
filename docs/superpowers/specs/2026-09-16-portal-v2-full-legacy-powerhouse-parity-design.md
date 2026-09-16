# Portal V2 Full Legacy + Powerhouse Parity Design

## Goal
Portal V2 is the single customer-facing portal experience and must preserve every protected capability of `klantportaal.html` while using the existing Bedrijfsgeheugen Powerhouse as canonical runtime authority.

## Baseline and invariants
- `klantportaal.html` remains the immutable functional migration baseline.
- `portal-v2/legacy-functional-inventory.js` remains the machine-readable inventory of the 24 protected legacy capabilities.
- No legacy capability is considered migrated by navigation or static copy alone: fields, models, calculations, actions, dependencies, persistence and production browser evidence must all be owned and verified.
- V2 does not create a parallel CRM, portal database, analytics store, learning system, action queue or business brain.
- Canonical state, provenance, freshness, confidence, lineage, outcomes and learning remain in the existing Powerhouse/Supabase contracts.
- Production promotion stays under the existing BRAIN delivery/release authority and exact-candidate verification.

## Protected capability surface
The protected capability set is: overzicht, profiel, dataai, aiscan, invoeren, antwoorden, business, cijfers, waarde, mensen, branche, onderzoek, beleid, aicap, strategie, canvassen, eindconclusie, dd, dna, bijhouden, wijzigingen, advies, offerte and roadmap.

Global protected capabilities are authenticated customer context, logout, export, import, permission-gated print, feedback, customer branding and mobile navigation.

## Architecture
### 1. Legacy inventory as contract
`legacy-functional-inventory.js` is the source contract for legacy parity. Every protected capability records editable fields, models, calculations, actions and dependencies. The inventory is fail-closed and may only grow or change with explicit migration evidence.

### 2. V2 capability ownership
`capability-contracts.js`, specialist modules and `modules/functional-suite.js` own the rendered experience. `parity-gate.js` maps every protected capability to its renderer, persistence path, dependency contract and browser-evidence owner.

### 3. Powerhouse authority
Portal state is tenant scoped and round-trips through the existing domain-state/Powerhouse persistence contract. UI-only or local-only state is not accepted as proof for editable business state. Derived values retain their calculation authority and source lineage.

### 4. Strategy-to-outcome chain
V2 must preserve the connected operating chain:
strategy/Strategy DNA -> capability/department impact -> recommendation -> business case -> roadmap/action -> execution state -> observed outcome -> learning/writeback.
No step may silently fork into a standalone store.

### 5. Proof model
A protected capability is green only when all of the following are present: contract, renderer, fields owner, model owner, calculation owner, action owner, dependencies owner, persistence owner and production evidence. Aggregate parity is green only when all 24 are green.

## Functional requirements
- Preserve the legacy models and semantics, including CMMI/maturity, adoption/change curves, manual-work annualization, capacity-not-cash wording, financial/value models, people/market/research/compliance models, AI scan/capabilities, canvases, final synthesis, due diligence/exit readiness, Strategy DNA, freshness/decision/change registers, advice, offers and roadmap.
- Preserve interactive editing and repeatable-row behavior where present in legacy.
- Preserve import/export, permission-gated print, feedback, customer branding, authentication/logout and mobile navigation.
- Preserve downstream recalculation after canonical writes.
- Preserve source/provenance/freshness/confidence exposure wherever current Powerhouse contracts provide it.
- Preserve fail-closed tenant isolation and security/RLS expectations.

## Regression strategy
Tests must prove structure and behavior, not only the existence of menu entries. Required proof layers are:
1. legacy inventory completeness;
2. implementation ownership parity;
3. calculation/model tests;
4. persistence roundtrip tests for every editable capability slice;
5. browser/DOM action tests;
6. mobile/responsive parity;
7. visual regression for protected views;
8. accessibility plus console/network error checks;
9. Powerhouse/Supabase security and tenant isolation gates;
10. exact-candidate production readback for all 24 capability evidence records.

## Delivery and rollback
Changes are minimal, existing-state-first and capability-local. Each discovered regression receives a failing regression test before the smallest cause-oriented fix. Existing BRAIN delivery lanes, preview gates, exact-candidate promotion, production readback, rollback identity and material-outcome writeback remain authoritative.

## Definition of done
The change is complete only when the current protected `main` produces 24/24 verified Portal V2 capability evidence, protected global capabilities remain working, Powerhouse roundtrip/writeback is proven, required CI/release gates are green, the exact promoted candidate is confirmed in production and the resulting evidence/learning is written back canonically.
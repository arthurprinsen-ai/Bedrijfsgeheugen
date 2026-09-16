# Portal V2 Full Parity Design

## Goal
Portal V2 must become the complete SaaS presentation layer of the same canonical Bedrijfsgeheugen Powerhouse. No legacy capability may be omitted, flattened into placeholder/schema-only UI, or backed by a parallel datastore.

## Scope
The protected legacy inventory in `portal-v2/legacy-functional-inventory.js` is normative and currently contains 24 capabilities: overzicht, profiel, dataai, aiscan, invoeren, antwoorden, business, cijfers, waarde, mensen, branche, onderzoek, beleid, aicap, strategie, canvassen, eindconclusie, dd, dna, bijhouden, wijzigingen, advies, offerte and roadmap.

All global capabilities are also in scope: authenticated customer context, logout, export, import, permission-gated print, feedback, customer branding and mobile navigation.

## Non-negotiable parity rule
For every protected capability, V2 must provide the legacy-equivalent content, fields, models, calculations, actions and dependencies defined in the inventory. UX may improve, but semantics and business functionality may not be reduced.

A capability can be marked `verified` only when all five proof classes are green:
1. **UI/content parity** — complete functional surface exists in V2 and all legacy sections, values, models, explanations, actions and editable fields have semantic equivalents.
2. **Calculation parity** — every named calculation/model has executable deterministic tests and uses canonical inputs.
3. **State parity** — the rendered state is tenant-scoped canonical Powerhouse/domain state and shared source changes propagate to every dependent capability.
4. **Writeback parity** — editable fields/actions use canonical state mutation and server-confirmed persistence; save -> reload -> reopen returns the same state; failures fail closed.
5. **Exact-production parity** — exact deploy SHA is verified before browser assertions, with DOM/browser/mobile readback and visual regression terminal green.

No source-presence-only, screenshot-only, generic readback-only or schema-only evidence can satisfy `verified`.

## Architecture
Reuse the existing Portal V2 shell, capability contracts, domain-state adapter, Powerhouse authorities and specialist workspaces. Do not create a new portal database, alternative calculations store, duplicate roadmap, duplicate learning system or shadow customer state.

The canonical path is:
`Powerhouse tenant/customer state -> Portal V2 domain state -> capability renderer/workspace -> validated edit -> server-confirmed flush -> canonical Powerhouse state -> dependent calculations/intelligence -> downstream V2 views -> outcome/evidence lineage`.

## Capability families
Implementation may share renderer infrastructure, but parity remains capability-specific.

- Cockpit/profile: overzicht, profiel, data-ai, ai-scan, invoeren, antwoorden.
- Finance/value: businesscase, cijfers, waarde-financiering.
- People/market/research: mensen, branche, onderzoek.
- Governance/AI/CSRD: beleid, ai-capabilities and all ESG/CSRD input and evidence flows.
- Strategy: strategie, all strategic models, canvassen, eindconclusie, Strategy DNA.
- M&A: due diligence and exit-readiness.
- Execution: bijhouden, wijzigingen, advies, offerte, roadmap.

## Hardcoded customer truth is forbidden
Live customer routes may not present static/demo numbers as if they are canonical truth. `portal-v2/legacy-parity.js` currently includes hardcoded overview values such as `3,4 / 5`, `6.720 uur`, `3,7 FTE`, `11%`, `5` blockers and `68%`; these are parity defects unless the route is explicitly marked preview/demo.

Production rules:
- canonical Powerhouse value when evidence exists;
- `Onvoldoende gegevens` (or semantically equivalent explicit unknown state) when evidence is absent;
- preview/demo values only in an explicitly labelled demo/preview context;
- no silent numeric fallback may satisfy parity or production evidence.

## Strategy-model parity
BCG is not sufficient. `strategie` and specialist strategic-model pages must render all legacy strategy findings/models present in the legacy model surface or canonical source state, including their explanation, input/note surface when editable, calculations, current position, conclusion, evidence/provenance, advice contribution and roadmap action.

Every strategic model must have a stable model id, source-field contract, deterministic derivation function, provenance, conclusion, downstream finding/action generation and model-specific tests. BCG is the reference implementation pattern, not the complete strategy implementation.

## Canvas parity
All six legacy canvases plus canvas conclusion must be derived from canonical Powerhouse state. Canvas answers and owners must write back through the existing domain-state flush and survive reload. Canvas changes must affect strategy/final-conclusion outputs where the dependency contract requires it. Existing valid Canvassen production evidence must be reused and synchronized into assurance rather than needlessly rerun.

## Data-input parity
All protected input groups are mandatory, including company financials, balance/financing, customers, measurements, policy documents, sustainability/CSRD, AI scan tasks, people metrics, industry context, DD dossier, Strategy DNA free text and building blocks, execution/change records, offer configuration and roadmap items.

Dynamic/repeatable groups must support the legacy-equivalent add/edit/remove behaviour where applicable. Validation errors must be visible and invalid state must fail closed rather than be reported as saved.

## Calculation parity
All calculation names in the inventory are executable requirements. This includes maturity and capacity calculations, TEI, AI opportunity scoring, benchmark and KPI ratios, DCF, EBITDA multiple, DuPont, Altman Z, interest coverage, DSCR, break-even/safety margin, people deltas, ESG/policy readiness, strategy prioritisation, cross-source consensus, DD readiness/materiality, Strategy DNA impact/maturity, freshness, change impact, advice prioritisation, offer pricing and roadmap value/progress.

Legacy semantic invariants such as capacity-not-cash and 46-week annualisation remain binding.

## Cross-capability consistency
Changing a canonical source field must invalidate/recompute every dependent view. Examples:
- revenue/headcount/hour cost -> overview/profile/business/value/advice where applicable;
- maturity -> business/value/strategy/advice;
- market/industry -> KPI/people benchmarks and strategic model context;
- canvas answer -> strategy/final conclusion;
- ESG/policy -> compliance/final conclusion/DD/advice;
- strategy finding -> advice/roadmap;
- changes/freshness -> roadmap/advice;
- advice -> offer/roadmap;
- roadmap state -> overview/progress/execution.

No page may cache independent business truth that can drift from Powerhouse.

## CSRD/resource impact
The existing CSRD/impact capability must expose customer-relevant and Bedrijfsgeheugen-relevant resource impact when canonical evidence exists, including CO2/water/energy/material topics and AI/token/resource usage where available. Values must include provenance, period, units, freshness/confidence and must never be fabricated. Token counts may not be converted into environmental claims without a documented conversion authority.

## Evidence model
`powerhouse/assurance/portal-v2-parity.json` is the machine-readable release ledger. Status semantics remain:
- contracted: inventoried only;
- implemented: executable V2 implementation/tests exist, production proof pending;
- verified: content + calculations + canonical state + writeback + production behaviour proven;
- retired: explicit supersession with retirement evidence.

The verifier must reject `verified` if any required inventory field, model, calculation, action or dependency lacks executable/runtime evidence. A release-wide gate must fail until all 24 protected capabilities are `verified` (or explicitly retired with valid evidence) and all global capability tests pass.

## Testing
Required layers:
- inventory completeness tests for exactly 24 protected capabilities and global capabilities;
- contract tests mapping every inventory field/model/calculation/action/dependency to implementation/evidence ownership;
- unit tests for every calculation, selector, validator and derived model;
- state tests for canonical read, mutation, flush, errors and tenant isolation;
- workspace tests for rendered content and user actions per capability;
- cross-capability recalculation tests;
- integration tests for real portal state API and server-confirmed persistence semantics;
- authenticated E2E tests for edit/save/reload/reopen and downstream effects;
- mobile widths 320, 390 and 430;
- exact-SHA deployment identity before production assertions;
- production DOM/browser readback;
- visual regression.

## Release process
1. read current protected main and current parity ledger;
2. consolidate onto one feature branch; never bypass branch protection;
3. implement capability batches with TDD and reuse existing renderer families;
4. run full Portal V2 tests plus Powerhouse Assurance;
5. open protected PR; Required + BRAIN + relevant portal checks must be green;
6. merge through protected path only;
7. prove exact Netlify production SHA before browser assertions;
8. run full 24-capability production parity tour plus global capabilities;
9. update parity ledger only from terminal evidence;
10. write CurrentState + Verification + Learning/evidence to canonical Powerhouse;
11. update Notion Latest Verified State and Human Handbook;
12. re-read those records before final status.

## Final acceptance gate
Portal V2 may receive overall `LIVE & BEWEZEN` only when:
- all 24 protected capabilities are `verified` or explicitly `retired` with valid evidence;
- all global capabilities are production-proven;
- zero hardcoded customer-truth placeholders remain on live paths;
- all editable legacy fields have server-confirmed persistence proof;
- all named inventory calculations have executable proof;
- dependency propagation is proven;
- mobile and visual regressions are green;
- exact production deployment identity is proven;
- canonical Powerhouse and documentation writeback are read back successfully.

Anything less remains `DEELS LIVE`, with exact open obligations recorded.

## Prevention rules
- Never mark a capability verified from source code presence alone.
- Never accept hardcoded/demo values as production customer truth.
- Never use generic production readback as substitute for exact deploy identity.
- Never retry an exact runner while that same runner is active.
- Track immutable capability release SHA separately from moving protected main.
- Never introduce a parallel V2 datastore or duplicate business calculation authority.
- Never close overall Portal V2 while any capability, global capability or production evidence obligation remains open.

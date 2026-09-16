# Portal V2 Full Parity Design

## Goal
Portal V2 must become the complete SaaS presentation layer of the same canonical Bedrijfsgeheugen Powerhouse. No legacy capability may be omitted, flattened into placeholder/schema-only UI, or backed by a parallel datastore.

## Scope
The protected legacy inventory in `portal-v2/legacy-functional-inventory.js` is normative and currently contains 24 capabilities: overzicht, profiel, dataai, aiscan, invoeren, antwoorden, business, cijfers, waarde, mensen, branche, onderzoek, beleid, aicap, strategie, canvassen, eindconclusie, dd, dna, bijhouden, wijzigingen, advies, offerte and roadmap.

All global capabilities are also in scope: authenticated customer context, logout, export, import, permission-gated print, feedback, customer branding and mobile navigation.

## Non-negotiable parity rule
For every protected capability, V2 must provide the legacy-equivalent content, fields, models, calculations, actions and dependencies defined in the inventory. UX may improve, but semantics and business functionality may not be reduced.

A capability can be marked `verified` only when all of the following are proven:
1. complete functional surface exists in V2;
2. all required inputs are editable when the legacy surface allowed editing;
3. canonical Powerhouse state is the read authority;
4. writes are tenant-scoped and server-confirmed in canonical Powerhouse state;
5. all inventory calculations are executable and regression-tested;
6. cross-page/downstream dependencies recalculate from the changed canonical state;
7. save -> reload -> reopen returns the same confirmed state;
8. fail-closed behaviour is proven for failed writes/reads;
9. desktop and mobile browser behaviour is proven;
10. exact deployment SHA is proven before DOM/browser assertions;
11. production DOM/readback and visual regression are terminal green;
12. assurance metadata and Powerhouse learning/evidence are written back.

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

## Strategy-model parity
BCG is not sufficient. `strategie` and specialist strategic-model pages must render all legacy strategy findings/models that are present in canonical source state, including their explanation, input/note surface when editable, calculations, current position, conclusion, evidence/provenance, advice contribution and roadmap action. Strategy output must be derived from canonical state and must not be hand-maintained separately.

## Canvas parity
All six legacy canvases plus canvas conclusion must be derived from canonical Powerhouse state. Canvas answers and owners must write back through the existing domain-state flush and survive reload. Canvas changes must affect strategy/final-conclusion outputs where the dependency contract requires it.

## Data-input parity
All protected input groups are mandatory, including company financials, balance/financing, customers, measurements, policy documents, sustainability/CSRD, AI scan tasks, people metrics, industry context, DD dossier, Strategy DNA free text and building blocks, execution/change records, offer configuration and roadmap items.

## Calculation parity
All calculation names in the inventory are executable requirements. This includes maturity and capacity calculations, TEI, AI opportunity scoring, benchmark and KPI ratios, DCF, EBITDA multiple, DuPont, Altman Z, interest coverage, DSCR, break-even/safety margin, people deltas, ESG/policy readiness, strategy prioritisation, cross-source consensus, DD readiness/materiality, Strategy DNA impact/maturity, freshness, change impact, advice prioritisation, offer pricing and roadmap value/progress.

Legacy semantic invariants such as capacity-not-cash and 46-week annualisation remain binding.

## Cross-capability consistency
Changing a canonical source field must invalidate/recompute every dependent view. Examples:
- revenue/headcount/hour cost -> overview/profile/business/value/advice where applicable;
- maturity -> business/value/strategy/advice;
- canvas answer -> strategy/final conclusion;
- ESG/policy -> compliance/final conclusion/DD/advice;
- strategy finding -> advice/roadmap;
- roadmap state -> overview/progress/execution.

No page may cache independent business truth that can drift from Powerhouse.

## CSRD/resource impact
The existing CSRD/impact capability must expose customer-relevant and Bedrijfsgeheugen-relevant resource impact when canonical evidence exists, including CO2/water/energy/material topics and AI/token/resource usage where available. Values must include provenance, freshness/confidence and must never be fabricated when source evidence is absent.

## Evidence model
`powerhouse/assurance/portal-v2-parity.json` is the machine-readable release ledger. Status semantics remain:
- contracted: inventoried only;
- implemented: executable V2 implementation/tests exist, production proof pending;
- verified: content + functionality + Powerhouse binding + writeback + production behaviour proven;
- retired: explicit supersession with retirement evidence.

A release-wide gate must fail until all 24 protected capabilities are `verified` and all global capability tests pass.

## Testing
Required layers:
- unit tests for every calculation and derived model;
- contract tests mapping every inventory field/model/calculation/action/dependency to an implementation/evidence owner;
- integration tests for domain-state read/write, validation and fail-closed behaviour;
- cross-capability recalculation tests;
- authenticated E2E tests for edit/save/reload/reopen;
- mobile widths 320, 390 and 430;
- production exact-SHA deployment identity check before assertions;
- production DOM/browser readback;
- visual regression.

## Release process
1. branch from current protected main;
2. TDD capability-family implementation;
3. Required + BRAIN + Portal V2 tests + Powerhouse Assurance;
4. protected merge only, no branch-protection bypass;
5. exact-SHA Netlify production promotion;
6. exact-SHA DOM/browser/mobile/readback;
7. visual regression;
8. update parity ledger only from terminal evidence;
9. write CurrentState + Learning/evidence to canonical Powerhouse;
10. update Notion Latest Verified State and Human Handbook;
11. final aggregate parity audit must show 24/24 verified before Portal V2 receives `LIVE & BEWEZEN` overall status.

## Prevention rules
- Never mark a capability verified from source code presence alone.
- Never use generic production-readback as substitute for exact deploy identity.
- Never retry an exact runner while that same runner is active.
- Track immutable capability release SHA separately from moving protected main.
- Never introduce a parallel V2 datastore or duplicate business calculation authority.
- Never close overall Portal V2 while any capability, global capability or production evidence obligation remains open.

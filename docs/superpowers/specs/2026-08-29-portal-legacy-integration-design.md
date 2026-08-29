# Bedrijfsgeheugen Portal — Legacy Integration & Business Operating Intelligence Design

## Status
Approved visual direction: the existing white enterprise/SaaS portal design is the binding design baseline. New Business Operating Intelligence capabilities must integrate into this visual language instead of replacing it.

## Product invariant
No existing portal capability, metric, report, action, integration, administration function, user route or meaningful dashboard object may disappear silently. New functionality is additive and must map existing portal state into the new canonical model.

## Visual design baseline
The portal keeps the approved visual characteristics:
- white/off-white enterprise canvas;
- left navigation with blue active states;
- top command/search bar;
- high information density without visual clutter;
- dark navy typography;
- electric blue primary actions and brand accents;
- soft borders and subtle card elevation;
- compact KPI cards and mini trend lines;
- a primary centre workspace plus right-side operational column where useful;
- subtle motion only where it communicates state, flow or impact;
- responsive behaviour that preserves hierarchy rather than shrinking desktop blindly.

The dark-sidebar prototype is not the target visual direction.

## Canonical information architecture
### Primary navigation
1. Vandaag
2. Bedrijfsgezondheid
3. Bedrijf
4. Intelligence
5. Besluiten
6. Uitvoering
7. Impact
8. Geheugen

### Administration section
- Integraties
- Roadmap
- Facturen & abonnement
- Organisatie & gebruikers
- Rollen & rechten
- AI Governance
- Agents & automatisering
- Audit
- Instellingen

## Legacy-to-new mapping
- Overzicht → Vandaag
- Bedrijfsgezondheid → Bedrijfsgezondheid
- Strategie & uitvoering → Bedrijf / Strategie + Uitvoering / Roadmap
- Processen & organisatie → Bedrijf / Processen & Organisatie
- Kennis → Geheugen / Kennis
- Data & koppelingen → Bedrijf / Data & Systemen + Beheer / Integraties
- AI & Insights → Intelligence + contextuele Bedrijfsgeheugen AI
- Acties & impact → Uitvoering + Impact
- Rapportages → Impact / Rapportages
- Koppelingen bouwen → Beheer / Integraties
- Roadmap → Uitvoering / Roadmap
- Facturen & abonnement → Beheer / Facturen & abonnement
- Organisatie & gebruikers → Beheer / Organisatie & gebruikers
- Instellingen → Beheer / Instellingen
- Frisse Blik Scan → retained as product/upsell surface according to customer state

## Vandaag / executive overview
The existing overview composition is retained and upgraded:
1. Welcome + period/export controls.
2. AI Management Summary.
3. Bedrijfsgezondheid and domain score cards.
4. Decisions needed, risks, opportunities and notable changes.
5. Business Graph / “Alles verbonden in één overzicht”.
6. Roadmap & voortgang.
7. Recommended actions.
8. Impact deze maand / Verified Value.
9. Recent activity / business timeline.
10. Integration status.
11. Quick links.

### AI Management Summary
Retain Kansen, Bedreigingen, Trends and Conclusie. The data source changes from presentation-only data into Business Graph + internal source data + verified external intelligence.

### Health cards
Retain at minimum:
- Bedrijfsgezondheid
- Kennisborging
- Processen
- Data & systemen
- AI-volwassenheid

Additional domain scores may be added without removing these baseline cards.

## Business Graph
The existing “Alles verbonden in één overzicht” becomes the entry point to the Business Graph. Existing nodes remain recognizable:
- Kennis
- Processen
- Mensen
- Doelen & strategie
- Systemen
- Data
- Acties

Extend with:
- Klanten
- Producten & diensten
- Markt
- KPI's
- Besluiten
- Risico's
- Capabilities
- Leveranciers
- Finance

Relationships are functional. Hover/select reveals dependencies. Active signals/changes may animate dotted relationship lines. Every graph object has owner, status, source/evidence, access policy, last change and related decisions/actions.

## Canonical operating loop
All material information follows one shared model:

Source / Signal → Context → Business Graph → Impact → Decision → Owner → Action → Execution → Verification → Result → Learning → Memory

No module is allowed to keep an isolated truth outside this loop.

## Canonical object model
Every material object must support:
- immutable ID;
- tenant/entity scope;
- object type;
- name and description;
- owner;
- lifecycle status;
- source/evidence references;
- confidence/verification state;
- relationships;
- version/history;
- created/changed by;
- timestamps;
- permissions;
- AI provenance where applicable;
- audit events.

First-class domains include strategy, organisation, commercial, operations, technology, data, knowledge, intelligence, governance, decision, action/change and result/value.

## Change & Impact Engine
Any material change can answer:
- what changed;
- why;
- who/what caused it;
- affected objects;
- dependencies;
- owner;
- urgency;
- expected impact;
- actual impact;
- status;
- evidence;
- rollback/last-known-good where relevant.

A universal detail drawer uses this structure across KPI, signal, process, system, decision, action and opportunity objects.

## Intelligence
External intelligence covers market, competitors, customers, technology, regulation, economics, sector developments and opportunities.

Required pipeline:
Detect → Verify → Match to Business Graph → Score relevance/confidence/urgency → Calculate impact → Prioritise → Recommend → Decision/Action → Measure → Learn

Official regulatory sources must remain distinguishable from AI interpretation.

## Decisions
Decision objects contain:
- decision question;
- context;
- evidence;
- alternatives/scenarios;
- AI recommendation where permitted;
- human reasoning;
- risk;
- expected impact;
- owner/approver;
- decision date;
- resulting actions;
- 30/90/180-day outcome evaluation where applicable.

## Execution
Actions are first-class objects. An action cannot become Active without an owner. “Done” requires execution + verification + registered outcome evidence.

Agent execution uses the existing repository self-healing/outcome-obligation contract. Safe actions can be autonomous only within policy. Hard boundaries remain credentials/secrets, weakened security, destructive irreversible data actions, paid-resource increases and legally/financially binding acts.

## Impact / Verified Value
Retain existing monthly impact metrics such as time saved, cost savings, realised value and CO2 savings. Add a verified-value funnel:
Identified → Validated → Approved → Executing → Realised

Only Realised with valid evidence contributes to Verified Value Created.

## Geheugen
Geheugen contains both knowledge and company history:
- documents;
- procedures;
- decisions;
- lessons learned;
- experts;
- changes;
- timeline;
- source/evidence links.

The system must answer “why is this the way it is?” with traceable source and decision history.

## Agents
Expose a coherent Agent Team rather than disconnected bots. At minimum the product model supports responsibilities for observing, analysing, advising, operating, guarding, optimising and maintaining memory. Domain-specialist agents may run underneath these roles.

All agents share the repository/platform team memory and must comply with outcome obligations, autonomy policies, audit and writeback rules.

## Access model
Use tenant/entity scope plus RBAC/ABAC/object-level permissions. AI and agents inherit the same or narrower effective permissions as the invoking user/policy. No AI action may expand access implicitly.

## AI & EU AI Act governance
The product must support:
- AI use-case inventory;
- model/provider registry;
- purpose and data category;
- risk classification;
- human oversight policy;
- approvals;
- evaluations;
- incidents;
- model/version changes;
- source/evidence;
- audit trail.

AI may process authorised context but is not the system of record for company data.

## Integrations and data flow
Existing portal data is migrated/mapped, not re-entered:
Existing portal/source data → Canonical objects → Business Graph → Intelligence/Decision/Execution/Impact/Memory → UI

Prefer event/delta-driven updates. Page opening must not trigger full data reloads when cached/known state exists.

## Compatibility
Existing direct links and saved portal routes must remain valid through preserved routes or explicit aliases/redirects. A navigation redesign may change presentation, not silently break accepted capability access.

## Responsive design
Desktop keeps the approved dense enterprise dashboard layout. Tablet may collapse secondary columns. Mobile prioritises:
- Vandaag
- Besluiten
- Acties
- AI
with remaining functions under Meer. Complex graph exploration stays richer on desktop/tablet.

## Performance requirements
- cached useful state: target <1s;
- interactive target <2s;
- non-blocking background refresh;
- no full rerender/reload for unchanged data;
- delta/event sync preferred;
- frontend memory, API usage and AI/token cost observable.

## Error handling and resilience
Use repository invariants:
- no silent failure;
- no lost obligations;
- technical success is insufficient without outcome evidence;
- safe self-healing continues until production green, rolled-back green, or a hard boundary;
- last-known-good remains available where technically possible.

## Testing and release gates
Required tests/gates include:
1. legacy capability preservation contract;
2. route/backward-compatibility test;
3. information-architecture contract;
4. canonical object validation;
5. permission policy tests;
6. intelligence pipeline tests;
7. decision/action Definition-of-Done tests;
8. Verified Value evidence tests;
9. responsive/mobile UI tests;
10. accessibility/reduced-motion tests;
11. cached/delta-loading performance regression tests;
12. production smoke verification on exact commit/deploy;
13. existing accepted website baseline and whole-brain outcome-obligation gates remain mandatory.

## Migration strategy
Do not rewrite the platform in one cutover. Migrate incrementally behind stable interfaces:
1. lock legacy capability inventory and route contract;
2. introduce canonical domain model;
3. map existing portal data into the model;
4. introduce event/change ledger;
5. permission and governance layer;
6. Business Graph services;
7. intelligence contracts;
8. decision/action/outcome services;
9. agent runtime integration;
10. impact/verified-value service;
11. replace example portal state with real adapters;
12. preserve legacy routes while switching screens to the new services;
13. preview validation;
14. production promotion and verification.

## Definition of Done
The integrated portal is complete only when:
- every meaningful legacy capability is present or explicitly mapped to its new location;
- the approved white enterprise visual design is used consistently;
- no protected route/capability regresses;
- screens read from the canonical model or explicit adapters rather than duplicated mock truth;
- permissions and audit apply across UI, AI and agents;
- decisions can become verified actions/results;
- external intelligence can be traced to evidence and company-specific impact;
- Verified Value counts only proven results;
- portal is responsive and accessible;
- preview and production checks are green on the exact commit;
- outcome obligations and shared-memory writeback are complete.

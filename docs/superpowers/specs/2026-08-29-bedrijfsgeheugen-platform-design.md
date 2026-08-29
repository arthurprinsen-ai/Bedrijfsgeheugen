# Bedrijfsgeheugen — Master Blueprint v1

Datum: 2026-08-29
Status: Ontwerp afgerond — klaar voor implementatieplanning

## 1. Productdefinitie
Bedrijfsgeheugen is het intelligente besturingssysteem van een bedrijf. Het brengt kennis, processen, data, systemen, strategie, uitvoering en externe signalen samen in één canonieke bedrijfswaarheid. AI analyseert tijdelijk en gecontroleerd; Bedrijfsgeheugen bewaart de bedrijfswaarheid.

Kernlus:

Signaleren → Begrijpen → Adviseren → Besluiten → Uitvoeren → Verifiëren → Impact meten → Leren

Kernbelofte:

**Meer grip. Minder gedoe. Sneller groeien.**

## 2. Niet-onderhandelbare ontwerpregels
1. Eén canonieke Business Truth.
2. Bestaande portalfunctionaliteit mag niet verloren gaan.
3. Website, portal en agents delen dezelfde zakelijke objecten en definities.
4. AI mag bedrijfsdata verwerken, maar AI zelf slaat geen bedrijfs- of klantdata permanent op.
5. AI-interpretatie is nooit automatisch Business Truth.
6. Alle agents opereren als één team op dezelfde graph, events, policies, evidence en learning memory.
7. View, Edit, Export, Approve, Execute en AI Process zijn aparte bevoegdheden.
8. ACTIVE en WORKING blijven gescheiden.
9. Materiële wijzigingen zijn versioned, impact-assessed, auditable en verified.
10. Geen legacyfunctie verdwijnt vóór aantoonbare parity.
11. Geen release met rode parity/security/privacy/governance/data/QA/production gate.
12. Mobile behoudt functionele parity en krijgt taakgerichte UX.
13. Motion heeft uitsluitend semantische betekenis: attention, relationship, progress, transition, focus, success of failure.
14. Cache/read models versnellen maar zijn nooit de waarheid.
15. Make en Notion blijven bron/orchestratie waar nuttig, maar vormen geen concurrerende canonical truth.

## 3. Doelarchitectuur

Sources → Adapters → Canonical Data + Company Graph → Events/Changes/Policies → Read Models + Intelligence → Portal/Website/Agents/API.

Horizontale control planes: Identity & Access, Privacy, AI Governance, Audit & Evidence, Security, Observability.

## 4. Canonical Company Graph

Canonical object families:

- Core: Company, BusinessUnit, Team, Person, Role.
- Strategy: Strategy, Goal, KPI, Assumption, Constraint, Decision.
- Execution: Initiative, Project, RoadmapItem, Action, Change, Impact, Learning.
- Operations: Process, ProcessStep, Capability, KnowledgeItem, Document, System, DataDomain, Dataset, Integration, Vendor, Contract.
- Commercial: Market, Segment, Need, Proposition, Product, Service, Offering, PricePlan, Customer, Lead, Opportunity, Campaign, Channel, Content, Experiment, Revenue.
- Governance: Policy, Permission, Requirement, Control, Evidence, AIUseCase, Agent, AgentWork, Provider, Model, DataClassification, AccessReview.
- Existing models/canvases remain intact through a universal Model/ModelVersion/FieldDefinition/Response/AIReview wrapper.

Every canonical object carries immutable identity, tenant/company scope, lifecycle state, health, ownership, version, provenance, confidence/completeness/quality/freshness where applicable, permissions, relationships and history.

## 5. Truth model

Four truth classes are explicit:

- Source Truth: reliable source facts.
- Business Truth: approved/active organizational truth.
- Derived Truth: deterministic derivation from facts.
- AI Interpretation: hypothesis, observation or recommendation generated through AI.

AI Interpretation never silently becomes Business Truth. Promotion requires deterministic verification or authorized human/change workflow.

Each authoritative datatype has a Source of Record where needed. Conflicts become explicit conflict objects/events; AI does not silently choose a winner.

## 6. Relationship model

Object + Relationship + Event form the platform core. Relationships are first-class records with identity, type, source, confidence, criticality, temporal validity and verification.

Controlled relation groups include Structure, Ownership, Strategy, Execution, Operations, Knowledge, Commercial, Risk, Change and Impact. Causal semantics distinguish correlation, may-influence, likely-causes and causes.

Graph traversal is permission-aware and may expose only a restricted placeholder when a hidden dependency is structurally relevant.

## 7. Event/state model

Material changes emit immutable events with event_id, event_type, object/company, timestamp, actor, source, before/after references, reason, correlation_id, causation_id, risk and schema version.

Current state is projected from Event Log → Current State Store → Read Models/Cache → Portal.

No silent overwrite: optimistic locking/version conflicts are explicit. Events are idempotent/deduplicated; failed processing has retry classification, DLQ/quarantine and compensation where applicable.

Lifecycle and AI Health are separate. Done ≠ Verified ≠ Impact.

## 8. Change Engine

Business lifecycle:

Concept/Working → Impact Analysis → Review → Approved → Active → Verified.

Every meaningful change shows what changed, who, why, owner/reviewer/approver, before/after diff, direct/dependent/predicted impact, dependencies, risks, evidence, tests, rollback and resulting verification.

Scenario/Preview state never mixes with Active state.

## 9. Policy & Access Engine

Authorization uses RBAC + ABAC + object-level + field-level + relationship-aware controls. Actions include View, View Sensitive, Create, Edit Draft, Submit, Approve, Activate, Archive, Export, Share, Ask AI, AI Process Sensitive, Run Scenario, Execute, Change Permissions and View Audit.

AI-processing permission is distinct from human view permission. Every AI call must pass user/agent authorization, use-case authorization, data authorization and provider/model authorization.

Temporary/external access has scope and expiry. Sensitive access changes themselves use the Change lifecycle. Effective Access and Explain Access are first-class projections. Explicit deny wins unless an authorized break-glass policy applies.

## 10. AI Data Gateway

Every AI call flows through:

Requester/Agent → Permission Check → AI Use Case/Purpose → Data Classification → Data Minimization/Pseudonymization → Provider/Model Policy → Temporary Context → AI → Result Gateway.

AI runtime/provider memory is not the company memory. Prohibited by default: persistent prompt history with business data, raw payload debug logs, unmanaged provider embeddings/vector stores, provider conversational memory and training on customer data.

Embeddings, when used, are governed business data and live in the controlled Bedrijfsgeheugen data layer.

Result Gateway checks schema, unsupported claims, leakage, PII, provenance, confidence, policy and review requirements before a structured AI-derived object may persist.

## 11. EU AI governance

Every production AI use-case is registered with purpose, owner, legal role, risk classification, model/provider, data categories, human oversight, autonomy, transparency requirements, logging/evidence, evaluations, incidents, review date and status.

Screening: prohibited → potential high-risk → transparency obligations → other AI system → relevant model/provider dependencies. Prohibited use cannot activate. Potential high-risk is blocked pending qualified review.

Compliance is modeled as Law → Requirement → Policy → Control → Evidence. Regulatory changes can trigger reassessment of affected use-cases and controls. Mandatory governance gates can reduce autonomy or suspend a use-case.

UI distinguishes AI Analyse, AI Voorstel, Menselijk Goedgekeurd and Automatisch Uitgevoerd Binnen Policy.

## 12. One Agent Team

Agents share Company Graph, Active State, Event Bus, Policy Engine, Evidence Engine, Change Engine, Work Queue and Learning Memory. They do not keep separate business truths.

A thin Team Coordinator routes events, assigns work, detects conflicts, manages priority/locking/resource budgets and context minimization; it does not own content truth.

Specialists include Strategy, Growth, Market, Website, SEO, Finance, Operations, Knowledge, Integration, Security, Risk, Cost, QA, Performance, UX, Design and Learning.

Structured AgentWork contains trigger/problem, priority, primary/support agents, affected objects, evidence, plan, risk, status, change, verification, outcome and learning.

Autonomy L0 Observe, L1 Advise, L2 Prepare, L3 Execute With Approval, L4 Autonomous Within Policy, L5 Self-Heal is granted per action category, not per agent globally. Agents cannot raise their own permissions/autonomy or activate their own new AI use-cases.

## 13. Self-healing

Safe known failures follow Detect → Root Cause → Regression Test → Minimal Fix → Execute → Verify → Learn. Unknown/high-impact cases degrade to Prepare/Approval. Maximum blind retry behavior is bounded; last-known-good and rollback are preferred.

Verification failure cannot become Resolved. Learning is stored centrally in Bedrijfsgeheugen, not model memory.

## 14. Read models and performance

The portal consumes purpose-built read models such as ManagementSummaryView, AttentionView, BusinessHealthView, MyWorkView, RoadmapView, GrowthControlView, IntegrationHealthView, TrustOverviewView and AgentTeamView.

Read models are incrementally updated from events and include generated_at, source-state version and freshness/stale status. Portal opening must not fetch/process/render the entire source estate in the browser. Target first usable overview state is approximately 1–3 seconds under representative production data, followed by delta updates.

## 15. Definitive information architecture

Desktop navigation:

1. Overzicht
2. Strategie
3. Groei
4. Operatie
5. Organisatie
6. Data & Technologie
7. Uitvoering

Separated utilities: Mijn werk, Model Library, Trust & Governance, Beheer. Global permission-aware command/search: “Zoek of vraag Bedrijfsgeheugen…”. Mobile bottom navigation: Home, Werk, AI/Zoeken, Wijzigingen, Meer.

Existing portal routes remain available through compatibility routing until their parity gate passes.

## 16. Overview contract

First viewport: AI Management Summary, Wat vraagt aandacht?, Business Health and Mijn Werk. Secondary: Roadmap, Business Map, External Intelligence, Trust summary, Agent Team, Recent Changes and Integrations where relevant.

Every score is drillable to cause, evidence, owner, actions and expected impact. Management Summary is permission-safe and must not leak hidden object counts/details.

## 17. Business Map

Interactive progressive graph: Markt → Strategie → Groei/Klant → Operatie → Organisatie → Data & Technologie → Uitvoering → Impact. Default shows only high-level nodes. Focus reveals one/two hops; deeper traversal is deliberate.

Dotted motion indicates active dependency/flow; idle relations are static; blockers stop/pulse. Reduced-motion provides equivalent static semantics. Mobile uses focused paths rather than shrinking the desktop graph.

## 18. Contextual workspaces

Universal object detail pattern: Header, Summary, Attention, Main Workspace, Intelligence, Relations, Execution, Evidence, History. Header exposes status, AI Health, owner, version and freshness.

Strategy: Strategy/Goal/KPI/Assumption/Constraint/Decision.
Growth: Market/Segment/Need/Proposition/Product/PricePlan/Customer/Opportunity/Contract/Revenue/Brand/Website/Campaign/Experiment.
Operations: Process/Capability/Quality/Supplier/Contract.
Organization: BusinessUnit/Team/Role/Person/Capability/Knowledge/Document.
Data & Technology: System/Data/Integration/AI/Provider/Model/Architecture.
Execution: Initiative/Project/RoadmapItem/Action/Change/Impact/Learning.

## 19. Frisse Blik and models

Original scan answers are immutable. Scoring models are versioned so historical scores retain their original meaning. Responses may create contextual Findings/Risks/Recommendations but never rewrite the source response.

All existing models/canvases and their fields/statuses remain. Universal wrapper adds owner, last changed/reviewed, completeness, quality, confidence, freshness, source quality and AI Review without flattening model-specific content.

## 20. Commercial/website graph

Website and portal share canonical Proposition, Offering, PricePlan, Segment and Experiment truth. Published pricing comes from approved active PricePlan state, not duplicated hardcoded business truth. Website/CRM/billing discrepancies create Findings.

Website Agent changes use Finding → Recommendation/Experiment → Working Change → tests → policy/approval → deploy → verification → measurement → impact.

## 21. External Intelligence

External world → source trust/corroboration/freshness → relevance → Company Context → Finding → Opportunity/Threat → Recommendation → Decision → Action/Change → Impact/Learning.

Domains include market, competition, customers, suppliers, technology/AI, economy, labor, tenders/subsidies, regulation, cybersecurity and reputation. This is not a generic news feed.

## 22. Trust & Governance Center

Sections: Overview, Access, Data & Privacy, AI Register, Agent Control, Policies & Controls, Compliance, Audit & Evidence.

Trust Map: People → Roles → Data → AI Use Cases → Agents → Systems. Effective Access, Explain Access, permission simulation, temporary access, access review, AI processing preview, Privacy Ledger, Evidence Drawer and controlled kill switches are included.

Trust Score is reproducible and decomposable; the product does not make unsupported absolute legal-compliance claims.

## 23. UX/design system

Premium calm surface: light/white cards, strong whitespace, navy typography, restrained blue/purple accents, soft depth and rounded geometry. Avoid tile overload and decorative AI theatrics.

Core components: Shell, Navigation, Command Bar, Management Summary, Attention Card, Health Indicator, Object Header, Status, AI Health, Confidence, Evidence, Relationship Line, Graph Node, Change Diff, Impact Card, AI Label, Permission Chip, Access Matrix, Drawer, Bottom Sheet, Timeline, Agent Activity and Scenario State.

Motion semantics: Attention, Relationship, Progress, Transition, Focus, Success, Failure. Essential information/actions cannot be hover-only. WCAG 2.2 AA is the target, including keyboard, focus, contrast, touch size, semantic markup and reduced motion.

## 24. Parity and migration

Every existing screen/function maps: Existing screen → route → functions → fields → status → data → actions → dependencies → new location → new component → AI extension → test.

Classifications: KEEP, IMPROVE, MERGE, DELETE only with explicit duplicate proof/approval. Definitive parity includes record, field, status, action, calculation, permission, route, relationship, history and mobile behavior.

Use compatibility adapters and dual-run/reconciliation where useful. Legacy retirement requires parity verified, data reconciled, required usage zero, rollback window passed and audit retained.

## 25. Release trains

Release A Foundation: parity inventory, canonical schema, adapters, events, read models, Definition Registry.
Release B Trust: identity/policy, privacy, AI Data Gateway, AI Register, evidence/audit.
Release C Intelligence: management intelligence, contextual AI, agent work runtime, verification/self-healing, external intelligence.
Release D Experience: design system, portal shell, Overview, Business Map, My Work, Change Center, Trust UX, mobile.
Release E Business OS: migrate Strategy, Execution, Operations, Organization, Data/Technology, Growth, website synchronization, Frisse Blik/models, Learning/Value; retire verified legacy.

No calendar-driven promotion. A release advances only when its gates are green.

## 26. Guardians and stop-the-line

Persistent guardian responsibilities: Platform Architect, Truth Guardian, Parity Guardian, Data Guardian, Security Guardian, Privacy Guardian, AI Governance Guardian, Agent Governance Guardian, Design Guardian, UX Guardian, Performance Guardian, Cost Guardian and QA Guardian.

Any relevant guardian may block a release. Coordinator cannot silently override red gates. Human exception requires explicit authority, rationale and audit.

## 27. Release quality gates

Every applicable release must pass Functional, Parity, Data/Reconciliation, Security/Tenant Isolation, Privacy, AI Governance, Performance, UX, Accessibility, Visual Regression, Agent Verification, Observability, Rollback and Production Smoke/Exact Deploy Identity.

Production stays on last-known-good while a candidate is red.

## 28. Program Definition of Done

The platform program is complete only when simultaneously:

- required existing functionality has verified parity or explicit approved retirement;
- Company Graph + canonical active state is the single Business Truth;
- authoritative datatypes have explicit source-of-record rules where needed;
- website, portal and agents use shared contracts rather than duplicate business truth;
- AI runtime/provider memory is not persistent business memory;
- every AI call is purpose/use-case/data/provider/permission gated;
- relevant AI outputs have provenance, confidence, model/version and evidence;
- production AI use-cases are registered and governance-gated;
- agents share one work/evidence/learning system and cannot self-elevate;
- material/high-impact changes are reviewable, auditable, verifiable and rollbackable where practical;
- portal overview meets agreed performance with representative production data;
- desktop/mobile/accessibility/reduced-motion requirements are verified;
- search/graph/notifications/exports/AI summaries cannot infer hidden information;
- safe self-healing works and unsafe/unknown failures escalate;
- website and portal share canonical active commercial truth;
- verified impact closes the recommendation/change/learning loop;
- no required release gate is red.

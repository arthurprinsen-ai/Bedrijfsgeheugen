# Powerhouse System Map Governance

Version: v1  
Fingerprint: `powerhouse|system-map|same-lineage-auto-writeback|v1`

## Purpose

The Powerhouse System Map is the canonical architecture view of how all skills, agents, intelligence layers, workflows, connectors, authorities, data flows and control surfaces work together.

The machine-readable source is:

`platform/system-map/canonical-system-map.mjs`

The intended Portal V2 projection is:

`https://www.bedrijfsgeheugen.nl/portal-v2/?page=powerhouse-control-center`

## Non-negotiable contract

Every current and future chat, agent, workflow and autonomous node inherits System Map maintenance automatically.

Whenever a material change alters Powerhouse topology, capability, ownership or relationships, the same delivery lineage must update:
- the machine-readable System Map;
- the relevant skill/capability inventory;
- agent ownership/routing/relations where changed;
- human architecture/change documentation;
- Brain learning/prevention;
- the append-only development ledger;
- any human/portal projection that visualizes the changed topology.

A change is not completely closed while the System Map is stale.

## What must be represented

The map must remain sufficient to answer:
- Which intelligence layers exist?
- Which agents/capabilities exist and who owns them?
- Which skills govern execution?
- Which workflows, schedulers and connectors are active?
- Which source is authoritative for each class of truth?
- Which nodes depend on or feed which other nodes?
- Which control surfaces and charts project the canonical truth?
- Which external providers are evidence sources versus authority?
- How does learning flow back into skills, decisions and future execution?

## Closure status

Missing System Map writeback produces `SYSTEM_MAP_WRITEBACK_INCOMPLETE`.

Missing wider repository-native closure produces `WRITEBACK_INCOMPLETE`.

Neither is compatible with `PRODUCTION_GREEN`, `LIVE_BEWEZEN` or equivalent terminal claims.

## Automatic maintenance

System Map maintenance is part of the Definition of Done, not a separate user-requested documentation task. Agents must perform read-after-write verification before terminal closure.



## Company Intelligence OS

Powerhouse is architecturally governed as an AI-native Company Operating System / Company Intelligence Platform.

CRM is a source adapter, not the brain. Company, person, opportunity, action, outcome and realized-value evidence is projected into one Company Graph and compiled into a System of Context before decisions and actions.

Canonical loop:

`Evidence → Company Graph → System of Context → Prediction/Decision → Autonomous Action → Provider Readback → Outcome Memory → Realized Value → Learning → Compound → Next Decision`

Canonical runtime surfaces:
- `public.powerhouse_company_graph_nodes_v1`
- `public.powerhouse_company_graph_edges_v1`
- `public.powerhouse_system_of_context_v1`
- `public.powerhouse_autonomous_action_layer_v1`
- `public.powerhouse_outcome_memory_v1`
- `public.powerhouse_compound_intelligence_v1`
- `public.powerhouse_run_company_intelligence_os_v1(date)`
- `brain/company-intelligence/company-intelligence-os.mjs`
- `brain/contracts/company-intelligence-os-v1.json`
- `.agents/skills/powerhouse-company-intelligence-os/SKILL.md`

All future skills, agents, connectors and portal capabilities that touch company intelligence must reuse these layers rather than create a parallel CRM, graph, context store or learning loop.


## Self-Improvement Layer

Powerhouse uses one controlled compounding loop above Company Intelligence. It composes existing optimization, quality, model-health, autonomous-improvement and protected-delivery authorities; it does not create a second learning store or a second production writer.

Canonical loop:

`Observe → Detect → Hypothesize → Build → Test → Evaluate → Compare → Promote → Measure → Learn`

Canonical runtime:
- `public.powerhouse_agent_objective_registry_v1`
- `public.powerhouse_learning_compiler_queue_v1`
- `public.powerhouse_self_improvement_control_v1`
- `public.powerhouse_run_self_improvement_layer_v1(date)`
- `brain/self-improvement/self-improvement-layer.mjs`
- `brain/contracts/self-improvement-layer-v1.json`
- `.agents/skills/powerhouse-self-improvement-layer/SKILL.md`

North Star: Powerhouse must function measurably better tomorrow than today without degrading reliability, safety or code quality.

Self-learning may autonomously observe, diagnose, generate candidates and evaluate them. Production promotion remains evidence-gated and reuses protected delivery. Unknown evidence is never green.


## Contextual intelligence visibility

System Map governance also governs whether intelligence is visible at the point of decision.

When a material capability produces a prediction, recommendation, benchmark, risk, opportunity, graph insight or learning that can alter a user's decision, the same delivery lineage must include:
- the relevant Portal V2 projection;
- an appropriate compact visual;
- evidence/uncertainty behavior;
- regression coverage;
- a System Map relation from capability to portal surface.

A technically live backend capability with no relevant customer-facing projection is `WRITEBACK_INCOMPLETE`. Do not centralize everything into a generic AI-insights page; place each intelligence signal where it is operationally relevant.


## Canonical public website CMS shell

The public website shell is now an explicit Powerhouse control surface rather than page-local presentation.

Canonical geometry:
- desktop shell/container: 1220px;
- primary navigation height: 72px;
- “Meer” mega-menu: centered, max 1190px;
- solutions mega-menu: 850px;
- desktop gutter: 20px;
- mobile gutter: 12px.

Header, navigation, footer and mega-menu must remain pixel-aligned across all public routes. New routes inherit this shell. Route-local geometry overrides are prohibited because they create CMS drift.

Authority:
- `tools/bouw-v18-production-core.mjs`
- `tools/site-shell/v18-megamenu-browser-check.mjs`
- `tests/v18-megamenu-regression-lock.test.mjs`
- `docs/sitestandaard.md`

The System Map exposes this as `canonicalWebsiteChrome`. Any future sitewide shell migration must update these authorities in one lineage and prove route parity before terminal production status.


## Canonical public CMS + locale authority

Fingerprint: `powerhouse|public-cms-i18n|shared-shell-same-route|v1`.

De publieke site is één canonieke control surface. Header, footer, mega-menu, primaire navigatie, mobiele navigatie en NL/EN-switching horen bij dezelfde gedeelde site-shell en mogen niet per route afsplitsen.

Locale-authority:
- Nederlands: on-geprefixte canonical routes;
- Engels: `/en/*`;
- same-route invariant: `/x ↔ /en/x` en homepage `/ ↔ /en/`;
- build authority: `tools/site-shell/apply-i18n.mjs` + `tools/site-shell/build-localized-routes.mjs`;
- runtime guard: `assets/js/i18n.js`;
- cache authority: versiegebonden i18n JS/CSS;
- production authority: Netlify current production moet exact de actuele protected-main identity voeren;
- terminal bewijs: live browserreadback van NL→EN→NL op representatieve routes plus correcte `html lang`, header/footer en routebehoud.

Alle huidige en toekomstige chats, agents, skills en website-workflows erven dit contract. Tussentijdse CI/deploy-status is interne uitvoeringsstate en geen gebruikersmelding.


## Source-backed outbound loop v1 — 29 september 2026

Fingerprint: `powerhouse-source-backed-all-channels-v1`.

Powerhouse behandelt Instagram, LinkedIn persoonlijk, LinkedIn bedrijf, blog, e-mail en LinkedIn DM als channel-native projecties van één evidence-first outbound loop:

`SOURCE -> EVIDENCE -> DEDUPE -> PROBLEM/TRIGGER -> CHANNEL FIT -> CANDIDATE -> IDENTITY/TRUTH GATE -> PUBLISH/SEND -> PROVIDER READBACK -> OUTCOME -> LEARNING -> NEXT SELECTION`.

Runtime authorities:
- `public.powerhouse_outbound_source_lineage_v1`
- `public.powerhouse_materialize_source_backed_channel_candidates_v1(date)`
- `public.powerhouse_require_source_for_direct_outreach_v1()`
- `public.powerhouse_refresh_outbound_source_lineage_v1(date)`
- `supabase/functions/powerhouse-content-orchestrator/index.ts`

Channel boundaries remain hard: public evidence may select a personal-life theme but cannot fabricate an Arthur experience; company/blog prefer current evidence over static seeds; email/LinkedIn DM require a traceable trigger plus person/company context; Instagram remains Mira-only. Provider outcomes and commercial outcomes return to the same lineage.

Continuous assurance authority: `source-backed-outbound`. The hourly scheduler `powerhouse-outbound-source-lineage-hourly-v1` re-proves all eight stages—input, decision, action, readback, outcome, measurement, learning and guard. GREEN requires current runtime evidence plus 8/8 fresh stage receipts.

## Social historical story-family uniqueness v6 — 30 september 2026

The System Map now contains `social-story-family-uniqueness-v6` as a fail-closed social-publication authority.

Canonical chain:

`candidate → exact/normalized hash → story fingerprint → shingle similarity → keyword Jaccard → keyword overlap coefficient → database reservation/backstop → provider write`.

Authority:
- `public.powerhouse_reserve_unique_publication_v1`
- `public.powerhouse_publication_story_family_guard_v2`
- `public.powerhouse_publication_uniqueness_v1`
- `supabase/functions/powerhouse-social-publisher/index.ts`

All chats, agents, schedulers and connectors consume the same canonical history. A rewritten version of a consumed anecdote is never a new story. The car/electric-sliding-door/airco incident from 24/30 September 2026 is the permanent regression case.


## AI Model Intelligence & Advisor v1 — 30 september 2026

Fingerprint: `powerhouse|ai-model-intelligence|goal-cost-governance-sovereignty|v1`.

De AI Modelwijzer is een canonieke Powerhouse-capability en geen losse vergelijkingsblog. De capability koppelt actuele officiële provider-evidence aan een user-goal-first beslislaag en aan de bestaande commerciële outcome-lineage.

Canonical chain:

`official provider evidence → normalized model catalog → user goal + hard constraints → explainable shortlist → task-cost estimate → model-routing alternative → value-first public result → optional qualified lead → order/revenue outcome → learning`.

Authorities:
- modeldata: `data/ai-model-catalog-v1.json`;
- decision/governance policy: `config/powerhouse-ai-model-intelligence-v1.json`;
- public decision surface: `/ai-modelwijzer`;
- commercial write: `netlify/functions/ai-modelwijzer-lead.mjs` via the existing `_commercial-lead.mjs` lineage;
- skill: `.agents/skills/powerhouse-ai-model-intelligence/SKILL.md`;
- regression: `tests/ai-model-advisor-v1.test.mjs`.

Governance invariants:
- there is no universal “best model” verdict; fit starts from the user's job-to-be-done;
- storage residency, inference residency, provider jurisdiction, subprocessors and deployment control are separate fields;
- “EU data residency” is never treated as synonymous with full data sovereignty;
- unknown or stale evidence is shown as unknown and cannot silently pass a hard privacy/sovereignty filter;
- self-host/open-weight paths are explicit and do not imply equal managed-service pricing;
- the first useful recommendation is ungated; lead capture follows value delivery;
- no second CRM, lead store, outcome store or learning loop is introduced.

The capability is structurally registered in the canonical System Map. Production status remains evidence-gated by protected merge, exact-main Netlify deployment and public functional readback.
